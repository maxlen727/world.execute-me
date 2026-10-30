"""整条管线搬上显卡：单元格 → 位图 → CRT → uint8。

关键点：单元格是 36×128 的规则网格，每个格子固定 15×30 像素，
所以"把字形贴上去"根本不是 scatter，而是一次广播加：

    canvas(36,30,128,15,3) += 字形(36,128,30,15) × 颜色×强度(36,128,3)

这样 CPU 每帧只需要上传 4608 个格子的 char/color/intensity（约 90KB），
不用再生成 25MB 的位图。中文字形预先切成左右两半（30×15），
也塞进同一张图集，于是走同一条路径。
"""
import numpy as np

from . import core as C
from . import crt
from . import lyrics as LY
from .core import ROWS, COLS, CW, CH, H, W, PAL_NP, cid, CH2ID

cp = crt.cp
HAVE_GPU = crt.HAVE_GPU


def _build_atlas():
    """ASCII 图集 + 中文字形左右半片，拼成一张 (N, CH, CW)。"""
    A = crt._atlas()                      # (N, CH, CW) float32
    masks = [A]
    cjk_map = {}
    chars = set()
    for l in LY.LINES:
        chars.update(l["cn"])
    chars.update("世界执行我；（）. ")
    for ch in sorted(chars):
        if ch == " ":
            continue
        m = C.cjk_mask(ch)                # (CH, 2*CW)
        left = len(masks)
        masks.append(np.ascontiguousarray(m[:, :CW])[None, ...])
        masks.append(np.ascontiguousarray(m[:, CW:])[None, ...])
        cjk_map[ch] = (left, left + 1)
    atlas = np.concatenate(masks, axis=0).astype(np.float32)
    return atlas, cjk_map


class Raster:
    def __init__(self):
        self.gpu = HAVE_GPU
        self.post = crt.Post()
        if not self.gpu:
            return
        atlas, cjk_map = _build_atlas()
        self.atlas_np = atlas
        self.cjk_map = cjk_map
        self.atlas = cp.asarray(atlas)
        self.pal = cp.asarray(PAL_NP)
        self.K = cp.asarray(crt.KVIG)
        self.noise = [cp.asarray(n) for n in crt.NOISE_POOL]
        self.canvas = cp.zeros((ROWS, CH, COLS, CW, 3), cp.float32)
        self.flat = self.canvas.reshape(H, W, 3)
        self.prev = cp.zeros((H, W, 3), cp.float32)
        self.glyph_cache = {}
        self.chars = np.zeros((ROWS, COLS), np.int32)
        self.cols_ = np.zeros((ROWS, COLS, 3), np.float32)
        self.inten = np.zeros((ROWS, COLS), np.float32)
        self.u8 = np.empty((H, W, 3), np.uint8)

    # ------------------------------------------------------------ 大字形
    def _glyph(self, ch, gw, h, cjk):
        key = (ch, gw, h, cjk)
        g = self.glyph_cache.get(key)
        if g is None:
            m = crt._big_glyph(ch, gw, h, cjk)
            g = cp.asarray(m)
            self.glyph_cache[key] = g
        return g

    # ------------------------------------------------------------ 主入口
    def render(self, frame, rng, fx):
        if not self.gpu:
            rgb = crt.rasterize(frame)
            return self.post(rgb, rng, fx)

        xp = cp
        chars = self.chars
        colors = self.cols_
        inten = self.inten
        chars[:] = frame.ch
        np.take(PAL_NP, frame.p, axis=0, out=colors)
        inten[:] = frame.i

        # 中文：替换成左右半片的字形 id
        for (x, y, chs, p, it) in frame.cjk_items:
            half = self.cjk_map.get(chs)
            if half is None:
                continue
            if 0 <= y < ROWS and 0 <= x < COLS - 1:
                chars[y, x] = half[0]
                chars[y, x + 1] = half[1]
                colors[y, x] = PAL_NP[p]
                colors[y, x + 1] = PAL_NP[p]
                inten[y, x] = it
                inten[y, x + 1] = it

        g_chars = xp.asarray(chars)
        g_col = xp.asarray(colors)
        g_int = xp.asarray(inten)

        tiles = self.atlas[g_chars]                      # (R,C,CH,CW)
        tiles = tiles.transpose(0, 2, 1, 3)              # (R,CH,C,CW)
        w = g_col * g_int[:, :, None]                    # (R,C,3)
        self.canvas[:] = 0
        self.canvas += tiles[:, :, :, :, None] * w[:, None, :, None, :]

        out = self.flat
        for (px, py, chs, p, it, gw, h, cjk) in frame.glyphs:
            if it <= 0.02:
                continue
            m = self._glyph(chs, gw, h, cjk)
            y0 = max(0, py); x0 = max(0, px)
            y1 = min(H, py + h); x1 = min(W, px + gw)
            if y1 <= y0 or x1 <= x0:
                continue
            out[y0:y1, x0:x1] += (m[y0 - py:y1 - py, x0 - px:x1 - px][:, :, None]
                                  * (self.pal[p] * it))

        return self._post(out, rng, fx)

    # ------------------------------------------------------------ 后处理
    def _post(self, out, rng, fx):
        xp = cp
        g = float(fx.get("glitch", 0.0))
        ab = float(fx.get("aberr", 0.35 + g * 1.6))
        nz = float(fx.get("noise", 0.10 + g * 0.35))
        br = float(fx.get("bright", 1.0))
        dec = float(fx.get("decay", 0.52))
        bl = float(fx.get("bloom", 0.62))

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
        u8 = (out * 255.0).astype(xp.uint8)
        np.copyto(self.u8, cp.asnumpy(u8))
        return self.u8
