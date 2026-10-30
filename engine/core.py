"""ASCII 网格引擎：调色板 / 字形图集 / 单元格帧缓冲 / 绘制原语。"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------- 网格
COLS, ROWS = 128, 36
CW, CH = 15, 30
W, H = COLS * CW, ROWS * CH          # 1920 x 1080

FONT_MONO = "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Medium.ttf"
FONT_MONO_B = "/usr/share/fonts/TTF/JetBrainsMonoNerdFontMono-Medium.ttf"
FONT_FALLBACK = "/usr/share/fonts/TTF/DejaVuSansMono.ttf"
FONT_CJK = "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc"
FONT_CJK_B = "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc"
CJK_INDEX = 2   # SC

FS = 25          # 等宽字号，advance = 15.0
BASELINE = 22    # 单元格内基线

# ---------------------------------------------------------------- 调色板
PAL = [
    (0, 0, 0),            # 0  空
    (10, 34, 27),         # 1  DIM
    (18, 68, 51),         # 2  DEEP
    (40, 134, 98),        # 3  MID
    (96, 224, 164),       # 4  MAIN
    (198, 255, 226),      # 5  HI
    (150, 255, 218),      # 6  CYAN   → 冷调荧光
    (58, 168, 116),       # 7  BLUE   → 中绿
    (238, 255, 210),      # 8  AMBER  → 近白荧光
    (72, 190, 132),       # 9  ORANGE → 并入绿色族（红只留给处决）
    (255, 40, 40),        # 10 RED
    (126, 8, 18),         # 11 RED2
    (242, 250, 246),      # 12 WHITE
    (104, 126, 118),      # 13 GREY
]
BG, DIM, DEEP, MID, MAIN, HI, CYAN, BLUE, AMBER, ORANGE, RED, RED2, WHITE, GREY = range(14)
PAL_NP = np.array(PAL, np.float32) / 255.0

# ---------------------------------------------------------------- 字符集
RAMP = " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"
RAMP_DENSE = " .:-=+*#%@"
BLOCKS = "░▒▓█"
EXTRA = "∞∑√π∫≠≤≥∴→←↑↓●○■□◆◇※×÷±≡∅=<>·▪▫◦"

CHARS = []
_cmap = {}


def _add(ch):
    if ch in _cmap:
        return
    _cmap[ch] = len(CHARS)
    CHARS.append(ch)


for _c in RAMP + BLOCKS + EXTRA + "─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▁▂▃▄▅▆▇▶◀▲▼":
    _add(_c)
for _i in range(32, 127):
    _add(chr(_i))
_add(" ")

CH2ID = _cmap
RAMP_ID = np.array([CH2ID[c] for c in RAMP], np.int16)
RAMP_DENSE_ID = np.array([CH2ID[c] for c in RAMP_DENSE], np.int16)
BLOCK_ID = np.array([CH2ID[c] for c in BLOCKS], np.int16)
TEXT_ID = np.array([CH2ID[c] for c in " .+#"], np.int16)


def cid(ch):
    v = _cmap.get(ch)
    if v is None:
        v = _cmap.get("?")
    return v


# ---------------------------------------------------------------- 字形图集
def _render_glyph(ch, font, fbk, w, h, baseline):
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    try:
        d.text((0, baseline), ch, font=font, fill=255, anchor="ls")
    except Exception:
        d.text((0, baseline), ch, font=fbk, fill=255, anchor="ls")
    a = np.asarray(img, np.float32) / 255.0
    if a.max() < 0.04:
        img = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(img)
        d.text((0, baseline), ch, font=fbk, fill=255, anchor="ls")
        a = np.asarray(img, np.float32) / 255.0
    return a


_ATLAS = None
_ATLAS_CJK = None


def atlas():
    global _ATLAS
    if _ATLAS is not None:
        return _ATLAS
    f = ImageFont.truetype(FONT_MONO, FS)
    fb = ImageFont.truetype(FONT_FALLBACK, FS)
    _ATLAS = np.stack([_render_glyph(c, f, fb, CW, CH, BASELINE) for c in CHARS])
    return _ATLAS


def atlas_cjk():
    """CJK 字形：30x30 盒，2 格宽。"""
    global _ATLAS_CJK
    if _ATLAS_CJK is not None:
        return _ATLAS_CJK
    f = ImageFont.truetype(FONT_CJK, 29, index=CJK_INDEX)
    _ATLAS_CJK = {}
    return _ATLAS_CJK


def cjk_mask(ch):
    if _ATLAS_CJK is None:
        atlas_cjk()
    a = _ATLAS_CJK.get(ch)
    if a is None:
        f = ImageFont.truetype(FONT_CJK, 29, index=CJK_INDEX)
        img = Image.new("L", (2 * CW, CH), 0)
        d = ImageDraw.Draw(img)
        d.text((0, 26), ch, font=f, fill=255, anchor="ls")
        a = np.asarray(img, np.float32) / 255.0
        _ATLAS_CJK[ch] = a
    return a


_GM = {}


def glyph_mask(ch, w, h, cjk=False):
    key = (ch, w, h, cjk)
    g = _GM.get(key)
    if g is not None:
        return g
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    if cjk:
        f = ImageFont.truetype(FONT_CJK, int(min(w, h) * 0.86), index=CJK_INDEX)
        d.text((w * 0.5, h * 0.80), ch, font=f, fill=255, anchor="ms")
    else:
        f = ImageFont.truetype(FONT_MONO_B, int(h * 0.83))
        d.text((0, h * 0.76), ch, font=f, fill=255, anchor="ls")
    g = np.asarray(img, np.float32) / 255.0
    _GM[key] = g
    return g


# ---------------------------------------------------------------- 值噪声
def _hash2(ix, iy, seed):
    s = np.uint64(int(seed) % 65536)
    ix = np.asarray(ix).astype(np.uint64)
    iy = np.asarray(iy).astype(np.uint64)
    with np.errstate(over="ignore"):
        n = ix * np.uint64(374761393) + iy * np.uint64(668265263) + s * np.uint64(1442695041)
        n = (n ^ (n >> np.uint64(13))) * np.uint64(1274126177)
        n = n ^ (n >> np.uint64(16))
    return (n & np.uint64(0xFFFF)).astype(np.float32) / 65535.0


def vnoise(x, y, seed=0):
    ix = np.floor(x).astype(np.int64)
    iy = np.floor(y).astype(np.int64)
    fx = x - ix
    fy = y - iy
    ux = fx * fx * (3 - 2 * fx)
    uy = fy * fy * (3 - 2 * fy)
    a = _hash2(ix, iy, seed)
    b = _hash2(ix + 1, iy, seed)
    c = _hash2(ix, iy + 1, seed)
    d = _hash2(ix + 1, iy + 1, seed)
    return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy


def rnd(x, y, seed=0):
    """逐格伪随机 0..1（向量化）"""
    ix = np.asarray(x).astype(np.int64)
    iy = np.asarray(y).astype(np.int64)
    with np.errstate(over="ignore"):
        n = (ix * 374761393 + iy * 668265263 + seed * 1442695041).astype(np.uint64)
        n = (n ^ (n >> np.uint64(13))) * np.uint64(1274126177)
        n = n ^ (n >> np.uint64(16))
    return (n & np.uint64(0xFFFF)).astype(np.float32) / 65535.0


def fbm(x, y, seed=0, oct=3):
    v = np.zeros_like(x, np.float32)
    amp = 0.5
    tot = 0.0
    for o in range(oct):
        v += amp * vnoise(x * (2 ** o), y * (2 ** o), seed + o * 17)
        tot += amp
        amp *= 0.5
    return v / tot


# ---------------------------------------------------------------- 缓动
def clamp01(v):
    return np.clip(v, 0.0, 1.0)


def sstep(a, b, v):
    t = clamp01((v - a) / (b - a + 1e-9))
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = clamp01(t)
    return 1 - (1 - t) ** 3


def ease_io(t):
    t = clamp01(t)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- 帧缓冲
class Frame:
    __slots__ = ("ch", "p", "i", "X", "Y", "cjk_items", "glyphs", "rows", "cols")

    def __init__(self, rows=ROWS, cols=COLS):
        self.rows, self.cols = rows, cols
        self.ch = np.zeros((rows, cols), np.int16)
        self.p = np.zeros((rows, cols), np.uint8)
        self.i = np.zeros((rows, cols), np.float32)
        self.Y, self.X = np.mgrid[0:rows, 0:cols]
        self.X = self.X.astype(np.float32)
        self.Y = self.Y.astype(np.float32)
        self.cjk_items = []
        self.glyphs = []

    def blit_into(self, dst, y0, x0=0):
        y0 = int(y0); x0 = int(x0)
        hh = min(self.rows, dst.rows - y0)
        ww = min(self.cols, dst.cols - x0)
        if hh <= 0 or ww <= 0:
            return
        dst.ch[y0:y0 + hh, x0:x0 + ww] = self.ch[:hh, :ww]
        dst.p[y0:y0 + hh, x0:x0 + ww] = self.p[:hh, :ww]
        dst.i[y0:y0 + hh, x0:x0 + ww] = self.i[:hh, :ww]
        for (x, y, chs, p, inten) in self.cjk_items:
            if y < hh and x < ww - 1:
                dst.cjk_items.append((x + x0, y + y0, chs, p, inten))
        for (px, py, chs, p, inten, w, h, cjk) in self.glyphs:
            dst.glyphs.append((px + x0 * CW, py + y0 * CH, chs, p, inten, w, h, cjk))

    # --- 基础 ---
    def clear(self):
        self.ch[:] = 0
        self.p[:] = 0
        self.i[:] = 0.0
        self.cjk_items.clear()
        self.glyphs.clear()

    def put(self, x, y, c, p, inten=1.0):
        x = int(x)
        y = int(y)
        if 0 <= x < self.cols and 0 <= y < self.rows and inten > 0.012:
            if inten >= self.i[y, x] - 0.02:
                self.ch[y, x] = c
                self.p[y, x] = p
                self.i[y, x] = min(1.0, inten)

    def text(self, x, y, s, p, inten=1.0, step=1, jitter=0.0, rng=None):
        for k, ch in enumerate(s):
            xx = int(x + k * step)
            if 0 <= xx < self.cols and 0 <= y < self.rows:
                j = 0.0
                if jitter and rng is not None:
                    j = (rng.random() - 0.5) * jitter
                self.put(xx, y, cid(ch), p, min(1.0, inten + j))

    def ctext(self, y, s, p, inten=1.0, x0=0, x1=None):
        """ASCII 居中"""
        if x1 is None:
            x1 = self.cols
        n = len(s)
        x = x0 + max(0, (x1 - x0 - n) // 2)
        self.text(x, y, s, p, inten)

    def cjk(self, x, y, s, p, inten=1.0):
        """中文：每个字占 2 格（单独图层，栅格化时叠加）"""
        for k, ch in enumerate(s):
            xx = int(x + 2 * k)
            if 0 <= xx < self.cols - 1 and 0 <= y < self.rows:
                self.cjk_items.append((xx, int(y), ch, p, float(inten)))
                for dx in (0, 1):
                    if inten > self.i[y, xx + dx]:
                        self.ch[y, xx + dx] = 0
                        self.p[y, xx + dx] = 0
                        self.i[y, xx + dx] = float(inten)

    def bigtext(self, x, y, s, p, inten=1.0, scale=2, cjk=False):
        """scale 倍大小的字形（画在独立图层，占用格子）"""
        w = CW * scale
        h = CH * scale
        for k, ch in enumerate(s):
            if ch == " ":
                continue
            xx = int(x + k * (2 * scale if cjk else scale))
            if xx < 0 or xx + (2 if cjk else 1) * scale > self.cols or y < 0 or y + scale > self.rows:
                continue
            gw = w * 2 if cjk else w
            self.glyphs.append((xx * CW, y * CH, ch, p, float(inten), gw, h, cjk))
            for dy in range(scale):
                for dx in range((2 if cjk else 1) * scale):
                    yy, xc = y + dy, xx + dx
                    if 0 <= yy < self.rows and 0 <= xc < self.cols:
                        if inten > self.i[yy, xc]:
                            self.ch[yy, xc] = 0
                            self.p[yy, xc] = 0
                            self.i[yy, xc] = float(inten)

    def bigtext_c(self, y, s, p, inten=1.0, scale=2, cjk=False):
        w = len(s) * ((2 if cjk else 1) * scale)
        x = max(0, (self.cols - w) // 2)
        self.bigtext(x, y, s, p, inten, scale, cjk)

    def cjk_c(self, y, s, p, inten=1.0):
        w = 2 * len(s)
        x = max(0, (self.cols - w) // 2)
        self.cjk(x, y, s, p, inten)

    def hline(self, y, x0=0, x1=None, c="─", p=MID, inten=0.6):
        if x1 is None:
            x1 = self.cols - 1
        for x in range(int(x0), int(x1) + 1):
            self.put(x, y, cid(c), p, inten)

    def vline(self, x, y0, y1, c="│", p=MID, inten=0.6):
        for y in range(int(y0), int(y1) + 1):
            self.put(x, y, cid(c), p, inten)

    def box(self, x0, y0, x1, y1, p=MID, inten=0.7, c=None):
        h, v = (c or "─"), (c or "│")
        self.hline(y0, x0 + 1, x1 - 1, h, p, inten)
        self.hline(y1, x0 + 1, x1 - 1, h, p, inten)
        self.vline(x0, y0 + 1, y1 - 1, v, p, inten)
        self.vline(x1, y0 + 1, y1 - 1, v, p, inten)
        self.put(x0, y0, cid("┌"), p, inten)
        self.put(x1, y0, cid("┐"), p, inten)
        self.put(x0, y1, cid("└"), p, inten)
        self.put(x1, y1, cid("┘"), p, inten)

    # --- 场 ---
    def ramp(self, v, ramp_ids=None, p=MAIN, inten=None, gain=1.0, mask=None):
        """把 (ROWS,COLS) 的 0..1 场映射成字符"""
        ids = RAMP_ID if ramp_ids is None else ramp_ids
        vv = clamp01(v * gain)
        idx = (vv * (len(ids) - 1) + 0.5).astype(np.int32)
        np.clip(idx, 0, len(ids) - 1, out=idx)
        ch = ids[idx]
        ii = vv if inten is None else np.full_like(vv, inten)
        if mask is not None:
            ch = np.where(mask, ch, 0)
            ii = np.where(mask, ii, 0)
        better = ii > self.i
        self.ch[better] = ch[better]
        self.p[better] = p
        self.i[better] = np.minimum(1.0, ii[better])

    def add_glow(self, v, p, k=1.0, mask=None):
        """只加亮度不改字符"""
        vv = clamp01(v * k)
        if mask is not None:
            vv = np.where(mask, vv, 0)
        upd = vv > self.i
        self.i[upd] = np.minimum(1.0, vv[upd])
        self.p[upd] = p

    # --- 位图转字符 ---
    def image(self, img_l, x0, y0, cols, rows, p, ramp_ids=None, inten=1.0, gamma=1.0, gain=1.0):
        """img_l: PIL L 或 ndarray，缩到 cols x rows 后映射为字符"""
        if isinstance(img_l, Image.Image):
            a = np.asarray(img_l.resize((cols, rows), Image.BOX), np.float32) / 255.0
        else:
            a = np.asarray(img_l, np.float32)
            if a.shape != (rows, cols):
                a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((cols, rows), Image.BOX), np.float32) / 255.0
        a = np.clip(a * gain, 0, 1) ** gamma
        ids = RAMP_ID if ramp_ids is None else ramp_ids
        idx = (a * (len(ids) - 1) + 0.5).astype(np.int32)
        np.clip(idx, 0, len(ids) - 1, out=idx)
        ch = ids[idx]
        ii = a * inten
        x0 = int(x0); y0 = int(y0)
        x0c, y0c = max(0, x0), max(0, y0)
        x1c, y1c = min(self.cols, x0 + cols), min(self.rows, y0 + rows)
        if x1c <= x0c or y1c <= y0c:
            return
        sub_ch = ch[y0c - y0:y1c - y0, x0c - x0:x1c - x0]
        sub_i = ii[y0c - y0:y1c - y0, x0c - x0:x1c - x0]
        dst_ch = self.ch[y0c:y1c, x0c:x1c]
        dst_p = self.p[y0c:y1c, x0c:x1c]
        dst_i = self.i[y0c:y1c, x0c:x1c]
        better = sub_i > dst_i
        dst_ch[better] = sub_ch[better]
        dst_p[better] = p
        dst_i[better] = np.minimum(1.0, sub_i[better])
        self.ch[y0c:y1c, x0c:x1c] = dst_ch
        self.p[y0c:y1c, x0c:x1c] = dst_p
        self.i[y0c:y1c, x0c:x1c] = dst_i

    # --- 故障 ---
    def glitch(self, rng, amount=0.0, rows=None, bands=None):
        if amount <= 0.01:
            return
        nb = bands if bands is not None else int(2 + amount * 7)
        for _ in range(nb):
            if rng.random() > amount:
                continue
            y0 = rng.integers(0, self.rows)
            hgt = rng.integers(1, 4)
            sh = rng.integers(-int(3 + 26 * amount), int(3 + 26 * amount) + 1)
            ys = slice(y0, min(self.rows, y0 + hgt))
            self.ch[ys] = np.roll(self.ch[ys], sh, axis=1)
            self.p[ys] = np.roll(self.p[ys], sh, axis=1)
            self.i[ys] = np.roll(self.i[ys], sh, axis=1)

    def speckle(self, rng, amount, p=DIM, pmax=DEEP, chars=".:'"):
        n = int(amount * self.cols * self.rows)
        if n <= 0:
            return
        ys = rng.integers(0, self.rows, n)
        xs = rng.integers(0, self.cols, n)
        cs = np.array([cid(chars[k % len(chars)]) for k in range(n)], np.int16)
        ii = rng.random(n).astype(np.float32) * 0.5
        better = ii > self.i[ys, xs]
        self.ch[ys, xs] = np.where(better, cs, self.ch[ys, xs])
        self.p[ys, xs] = np.where(better, p, self.p[ys, xs])
        self.i[ys, xs] = np.where(better, ii, self.i[ys, xs])

    def copy_from(self, other):
        self.ch[:] = other.ch
        self.p[:] = other.p
        self.i[:] = other.i


# ---------------------------------------------------------------- 文本→蒙版
def text_mask(s, px_w, px_h, size=100, font_path=FONT_MONO_B, spacing=0.0):
    """把字符串渲染成 L 图（自适应缩放到 px_w x px_h 内），返回 PIL 图"""
    f = ImageFont.truetype(font_path, size)
    img = Image.new("L", (int(px_w), int(px_h)), 0)
    d = ImageDraw.Draw(img)
    bb = d.textbbox((0, 0), s, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    sc = min(px_w / max(tw, 1), px_h / max(th, 1)) * 0.98
    size2 = max(6, int(size * sc))
    f2 = ImageFont.truetype(font_path, size2)
    bb2 = d.textbbox((0, 0), s, font=f2)
    tw2, th2 = bb2[2] - bb2[0], bb2[3] - bb2[1]
    x = (px_w - tw2) / 2 - bb2[0]
    y = (px_h - th2) / 2 - bb2[1]
    d.text((x, y), s, font=f2, fill=255)
    return img


def shape_mask(draw_fn, px_w, px_h):
    img = Image.new("L", (int(px_w), int(px_h)), 0)
    d = ImageDraw.Draw(img)
    draw_fn(d)
    return img
