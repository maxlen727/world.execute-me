"""栅格化 + CRT 后处理（扫描线 / 辉光 / 色散 / 噪点 / 撕裂 / 残影）。

两条路径：
  · GPU（cupy）—— 后处理整段在显卡上跑，CPU 只负责把单元格画成 25MB 的位图。
    一帧 1080p 的后处理是 7~9 个全分辨率 pass，放 CPU 上就是纯内存带宽消耗，
    放 GPU 上不到 2ms。
  · CPU（numpy）—— 没有 cupy 时的兜底，逻辑完全一样，只是慢。
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .core import (COLS, ROWS, CW, CH, W, H, PAL_NP, atlas, cjk_mask)

# 注意：不能在 import 阶段创建 CUDA context —— 否则 fork 出来的 worker 里 context 是坏的。
# 这里只查设备数（不建 context），真正的 context 在每个进程自己的 Post.__init__ 里建。
try:
    import cupy as cp
    HAVE_GPU = cp.cuda.runtime.getDeviceCount() > 0
except Exception:
    cp = None
    HAVE_GPU = False

_A = None


def _atlas():
    global _A
    if _A is None:
        _A = atlas()
    return _A


# ---------------------------------------------------------------- 预计算
_pat = np.array([1.0, 0.74, 0.90], np.float32)
SCAN = (0.22 * _pat[np.arange(H) % 3] + 0.78).astype(np.float32).reshape(H, 1, 1)

_xn = (np.arange(W, dtype=np.float32) - W / 2) / (W / 2)
_yn = (np.arange(H, dtype=np.float32) - H / 2) / (H / 2)
_r = np.sqrt(_xn[None, :] ** 2 * 0.72 + _yn[:, None] ** 2)
VIGNETTE = np.clip(1.10 - 0.32 * _r ** 2.4, 0.64, 1.0).astype(np.float32)[:, :, None]
KVIG = (SCAN * VIGNETTE).astype(np.float32)      # 扫描线 × 暗角 合成一次乘法
del _r

_rng0 = np.random.default_rng(7)
_grain = np.clip(_rng0.standard_normal((H // 2, W // 2)).astype(np.float32) * 0.5 + 0.5, 0, 1)
_grain = np.repeat(np.repeat(_grain, 2, axis=0), 2, axis=1)[:, :, None]
NOISE_POOL = [_grain, _grain]   # 固定斑纹：x264/NVENC 才压得动


# ---------------------------------------------------------------- 大字字形
_GLYPH_CACHE = {}


def _big_glyph(ch, gw, h, cjk):
    key = (ch, gw, h, cjk)
    m = _GLYPH_CACHE.get(key)
    if m is None:
        from PIL import ImageFont
        from .core import FONT_CJK, FONT_MONO_B, FONT_MONO, CJK_INDEX
        if cjk:
            font = ImageFont.truetype(FONT_CJK, int(h * 0.86), index=CJK_INDEX)
        else:
            font = ImageFont.truetype(FONT_MONO_B, int(h * 0.80))
        img = Image.new("L", (gw, h), 0)
        d = ImageDraw.Draw(img)
        try:
            d.text((0, int(h * 0.80)), ch, font=font, fill=255, anchor="ls")
        except Exception:
            d.text((0, int(h * 0.80)), ch, font=font, fill=255)
        m = np.asarray(img, np.float32) / 255.0
        _GLYPH_CACHE[key] = m
    return m


# ---------------------------------------------------------------- 栅格化
def rasterize(frame, rgb=None):
    """单元格 → float32 RGB (H,W,3)，0..1。传入 rgb 可复用缓冲区（避免每帧 25MB 的分配/释放）。"""
    A = _atlas()
    ch = frame.ch
    ii = frame.i
    pp = frame.p
    active = ii > 0.02

    if rgb is None:
        rgb = np.zeros((H, W, 3), np.float32)
    else:
        rgb.fill(0.0)
    rgbf = rgb.reshape(-1, 3)

    ids, inv = np.unique(ch, return_inverse=True)
    inv = inv.reshape(ROWS, COLS)
    for k, c in enumerate(ids):
        if c == 0:
            continue
        m = A[c]
        if m.max() < 0.02:
            continue
        ys, xs = np.nonzero(m > 0.02)
        vals = m[ys, xs]
        sel = (inv == k) & active
        if not sel.any():
            continue
        cy, cx = np.nonzero(sel)
        inten = ii[cy, cx]
        cols = PAL_NP[pp[cy, cx]]
        Y = cy[:, None] * CH + ys[None, :]
        X = cx[:, None] * CW + xs[None, :]
        np.clip(Y, 0, H - 1, out=Y)
        np.clip(X, 0, W - 1, out=X)
        f = (Y * W + X).ravel()
        v = inten[:, None] * vals[None, :]
        rgb_ch = cols[:, None, :] * v[:, :, None]
        rgbf[f] = rgb_ch.reshape(-1, 3)

    if frame.cjk_items:
        cmap = {}
        for (x, y, chs, p, inten) in frame.cjk_items:
            key = (chs, p)
            if key not in cmap:
                cmap[key] = cjk_mask(chs)
            msk = cmap[key]
            y0 = y * CH
            x0 = x * CW
            hh = min(CH, H - y0)
            ww = min(2 * CW, W - x0)
            if hh <= 0 or ww <= 0:
                continue
            sub = msk[:hh, :ww] * inten
            rgb[y0:y0 + hh, x0:x0 + ww] += sub[:, :, None] * PAL_NP[p]

    # 大字层（字幕 / 标题）：独立字形，不占单元格
    if frame.glyphs:
        for (px, py, chs, p, inten, gw, h, cjk) in frame.glyphs:
            if inten <= 0.02:
                continue
            m = _big_glyph(chs, gw, h, cjk)
            y0 = max(0, py); x0 = max(0, px)
            y1 = min(H, py + h); x1 = min(W, px + gw)
            if y1 <= y0 or x1 <= x0:
                continue
            sub = m[y0 - py:y1 - py, x0 - px:x1 - px]
            rgb[y0:y1, x0:x1] += sub[:, :, None] * (PAL_NP[p] * inten)
    return rgb


# ---------------------------------------------------------------- CPU 兜底
def _blur3(a, axis):
    return (np.roll(a, 1, axis) + 2.0 * a + np.roll(a, -1, axis)) * 0.25


def _post_cpu(out, rng, fx, state, u8):
    g = fx["glitch"]
    ab = fx["aberr"]
    nz = fx["noise"]
    br = fx["bright"]
    dec = fx["decay"]
    bl = fx["bloom"]

    if br != 1.0:
        np.multiply(out, br, out=out)

    if bl > 0.01:
        s = out[2::4, 2::4].copy()
        for _ in range(3):
            s = _blur3(s, 0)
            s = _blur3(s, 1)
        s *= bl
        blk = out.reshape(H // 4, 4, W // 4, 4, 3)
        blk += s[:, None, :, None, :]

    dx = int(round(ab))
    if dx > 0:
        out[:, :, 0] = np.roll(out[:, :, 0], dx, axis=1)
        out[:, :, 2] = np.roll(out[:, :, 2], -dx, axis=1)

    if g > 0.02:
        for _ in range(int(1 + g * 9)):
            if rng.random() > g * 1.15:
                continue
            y0 = int(rng.integers(0, H - 4))
            hgt = int(rng.integers(2, 6 + int(60 * g)))
            sh = int(rng.integers(-int(4 + 90 * g), int(4 + 90 * g) + 1))
            out[y0:y0 + hgt] = np.roll(out[y0:y0 + hgt], sh, axis=1)

    out *= KVIG

    if nz > 0.005:
        n = NOISE_POOL[int(rng.integers(0, len(NOISE_POOL)))]
        out += (n - 0.5) * nz

    if state["has"] and dec > 0.01:
        np.multiply(state["prev"], dec, out=state["prev"])
        np.maximum(out, state["prev"], out=out)

    np.clip(out, 0, 1, out=out)
    np.copyto(state["prev"], out)
    state["has"] = True
    np.multiply(out, 255.0, out=out)
    np.copyto(u8, out, casting="unsafe")
    return u8


# ---------------------------------------------------------------- GPU
class Post:
    """有状态的 CRT 处理器（残影跨帧）。每个进程一个实例。"""

    def __init__(self):
        self.u8 = np.empty((H, W, 3), np.uint8)
        self.gpu = HAVE_GPU
        if self.gpu:
            self.K = cp.asarray(KVIG)
            self.noise = [cp.asarray(n) for n in NOISE_POOL]
            self.prev = cp.zeros((H, W, 3), cp.float32)
            self.out = cp.empty((H, W, 3), cp.float32)
            self.small = cp.empty((H // 4, W // 4, 3), cp.float32)
        else:
            self.st = {"prev": np.zeros((H, W, 3), np.float32), "has": False}

    def __call__(self, rgb, rng, fx=None):
        fx = fx or {}
        u8 = self.u8
        g = float(fx.get("glitch", 0.0))
        ab = float(fx.get("aberr", 0.35 + g * 1.6))
        nz = float(fx.get("noise", 0.10 + g * 0.35))
        br = float(fx.get("bright", 1.0))
        dec = float(fx.get("decay", 0.52))
        bl = float(fx.get("bloom", 0.62))

        if not self.gpu:
            return _post_cpu(rgb, rng, fx, self.st, u8)

        xp = cp
        g_img = xp.asarray(rgb)
        out = g_img
        if br != 1.0:
            xp.multiply(out, br, out=out)

        if bl > 0.01:
            s = out[2::4, 2::4]
            for _ in range(3):
                s = (xp.roll(s, 1, 0) + 2.0 * s + xp.roll(s, -1, 0)) * 0.25
                s = (xp.roll(s, 1, 1) + 2.0 * s + xp.roll(s, -1, 1)) * 0.25
            s *= bl
            blk = out.reshape(H // 4, 4, W // 4, 4, 3)
            blk += s[:, None, :, None, :]

        dx = int(round(ab))
        if dx > 0:
            out[:, :, 0] = xp.roll(out[:, :, 0], dx, axis=1)
            out[:, :, 2] = xp.roll(out[:, :, 2], -dx, axis=1)

        if g > 0.02:
            for _ in range(int(1 + g * 9)):
                if rng.random() > g * 1.15:
                    continue
                y0 = int(rng.integers(0, H - 4))
                hgt = int(rng.integers(2, 6 + int(60 * g)))
                sh = int(rng.integers(-int(4 + 90 * g), int(4 + 90 * g) + 1))
                out[y0:y0 + hgt] = xp.roll(out[y0:y0 + hgt], sh, axis=1)

        out *= self.K

        if nz > 0.005:
            n = self.noise[int(rng.integers(0, len(self.noise)))]
            out += (n - 0.5) * nz

        if dec > 0.01:
            xp.multiply(self.prev, dec, out=self.prev)
            xp.maximum(out, self.prev, out=out)

        xp.clip(out, 0, 1, out=out)
        xp.copyto(self.prev, out)
        gu8 = (out * 255.0).astype(xp.uint8)
        np.copyto(u8, cp.asnumpy(gu8))
        return u8


def to_u8(a):
    np.multiply(a, 255.0, out=a)
    return a.astype(np.uint8)
