"""全部段落的分镜实现（时间轴以 LRC 为准）。"""
import numpy as np
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

from . import core as C
from .core import (Frame, cid, CH2ID, RAMP_ID, RAMP_DENSE_ID, BLOCK_ID, TEXT_ID, clamp01, sstep,
                   ease_out, ease_io, rnd, vnoise, fbm, text_mask,
                   BG, DIM, DEEP, MID, MAIN, HI, CYAN, BLUE, AMBER, ORANGE, RED, RED2,
                   WHITE, GREY, COLS, ROWS, CW, CH)
from . import lyrics as LY
from . import design

ASPECT = 0.5
SR = 30.0


# ------------------------------------------------------------------ 锚点
def T(sec):
    return int(round(sec * 30))


A = {
    "title": T(16.000), "verse2": T(29.709),
    "points": T(29.709), "dimension": T(32.682), "circle": T(33.412),
    "circum": T(36.287), "sine": T(37.067), "tangents": T(40.049),
    "infinity": T(40.706), "limits": T(43.507),
    "acdc": T(44.452), "dizzy": T(49.534), "travel": T(51.363), "adbc": T(53.225),
    "unite": T(55.083), "stim": T(61.958), "satis": T(65.397),
    "exec1": T(68.252), "exec1b": T(69.259), "trapped1": T(70.084),
    "egg": T(74.045), "tomato": T(77.576), "cat": T(81.351), "god": T(85.078),
    "gender": T(88.587), "ftom": T(90.197), "am_pm": T(93.953),
    "role": T(95.465), "stom": T(97.739), "trance": T(101.474),
    "vib": T(106.293), "compl": T(110.221), "left": T(110.900),
    "iso": T(117.274), "frag": T(120.860), "dis": T(124.890),
    "illegal": T(131.224), "break_end": T(147.660),
    "chant": T(147.660), "ein": T(158.900), "liu": T(161.124),
    "give_all": T(162.632), "exec_give": T(165.166), "only": T(167.022),
    "only_exec": T(168.911), "back": T(169.824), "run": T(171.868),
    "runexec": T(172.712), "trapped2": T(173.643), "studied": T(177.246),
    "love1": T(179.929), "qme": T(180.857), "love2": T(183.646),
    "alg": T(184.540), "love3": T(187.665), "free": T(188.483),
    "trapped_in": T(190.801), "love4": T(191.356),
    "math_end": T(44.452), "sensory_end": T(74.045), "organic_end": T(103.489),
    "climax_end": T(191.356), "last": T(205.811), "end": 6358,
}

def F(sub, k=0):
    lo = sub.strip().lower()
    hits = [l for l in LY.LINES if l["en"].strip().lower() == lo]
    if not hits:
        hits = [l for l in LY.LINES if lo in l["en"].lower()]
    if k < len(hits):
        return hits[k]["f0"]
    return 0


CHANTS = [l["f0"] for l in LY.LINES
          if l["sec"] == "climax" and l["en"].strip().upper() == "EXECUTION" and l["f0"] < A["ein"]]


# ------------------------------------------------------------------ 上下文
class Ctx:
    def __init__(self, npz):
        self.bands = npz["bands"]
        self.rms = npz["rms"]
        self.rms_raw = npz["rms_raw"]
        self.low = npz["low"]
        self.onset = npz["onset_low"]
        self.flux = npz["flux"]
        self.vocal = npz["vocal"]
        self.total = 6358
        self.state_name = "INIT"
        self.load = 0.25
        self.buf = 4
        self.alert = False
        n = len(self.onset)
        k = np.zeros(n, np.float32)
        p = 0.0
        for i in range(n):
            p = max(float(self.onset[i]), p * 0.80)
            k[i] = p
        self.kick = k
        self.fx = {}

    def b(self, f, lo=0, hi=128):
        f = int(np.clip(f, 0, self.total - 1))
        return float(self.bands[f, lo:hi].mean())

    def k(self, f):
        return float(self.kick[int(np.clip(f, 0, self.total - 1))])

    def e(self, f):
        return float(self.rms[int(np.clip(f, 0, self.total - 1))])


@lru_cache(maxsize=1024)
def tmask(s, w, h, bold=True):
    return text_mask(s, w, h, size=140,
                     font_path=C.FONT_MONO_B if bold else C.FONT_MONO)


def big_text(st, s, y0, rows, p, inten=1.0, x0=0, cols=None, gamma=1.0, bold=True, ramp_ids=None):
    cols = cols or st.cols
    st.image(tmask(s, cols * CW, rows * CH, bold), x0, y0, cols, rows, p,
             ramp_ids=TEXT_ID if ramp_ids is None else ramp_ids,
             inten=inten, gamma=gamma * 0.85)


@lru_cache(maxsize=4)
def title_field(cols, rows):
    a = np.zeros((rows, cols), np.float32)
    m1 = np.asarray(tmask("WORLD.EXECUTE", cols * CW, 9 * CH).resize((cols, 9), Image.BOX), np.float32) / 255.0
    m2 = np.asarray(tmask("(ME);", cols * CW, 13 * CH).resize((cols, 13), Image.BOX), np.float32) / 255.0
    a[3:12] = np.maximum(a[3:12], m1)
    a[12:25] = np.maximum(a[12:25], m2)
    return a


def scramble(st, f, amount, seed=0, ramp_ids=None, p=DEEP):
    if amount <= 0.005:
        return
    m = rnd(st.X, st.Y, seed * 7 + f // 2) < amount
    ids = RAMP_ID if ramp_ids is None else ramp_ids
    q = rnd(st.X + 3.1, st.Y + 7.7, seed * 13 + f // 3)
    cs = ids[(q * (len(ids) - 1)).astype(np.int32)]
    vv = 0.25 + 0.5 * rnd(st.X, st.Y, seed + f)
    st.ch[m] = cs[m]
    st.p[m] = p
    st.i[m] = np.maximum(st.i[m], vv[m])


def rain_bg(st, f, ctx, p=DEEP, speed=1.0, inten=0.30, seed=0):
    Y, X = st.Y, st.X
    sp = 0.35 + 0.85 * rnd(X, 0, seed + 1)
    yy = Y - f * 0.5 * sp * speed
    cell = np.floor(yy)
    q = rnd(X, cell, seed + 2)
    cs = RAMP_ID[(q * (len(RAMP_ID) - 1)).astype(np.int32)]
    seg = np.floor(yy / 3.0)
    iv = (0.10 + inten * (1.0 - ((yy % 3.0) / 3.0))) * (0.5 + 0.5 * rnd(X, seg, seed + 5))
    better = iv > st.i
    st.ch[better] = cs[better]
    st.p[better] = p
    st.i[better] = np.minimum(1.0, iv[better])


def hexrow(n, seed):
    r = np.random.default_rng(seed)
    return "".join("0123456789ABCDEF"[k] for k in r.integers(0, 16, n))


def ring(st, cx, cy, r, p, inten=0.8, ch="●"):
    n = max(10, int(2 * np.pi * max(r, 1) * 2.4))
    for i in range(n):
        a = i / n * 2 * np.pi
        st.put(int(round(cx + np.cos(a) * r)), int(round(cy + np.sin(a) * r * ASPECT)), cid(ch), p, inten)


def arc(st, cx, cy, r, a0, a1, p, inten=0.8, ch="·", dens=1.0):
    span = max(abs(a1 - a0), 1e-4)
    n = max(6, int(span * max(r, 1) * 3.4 * dens))
    for i in range(n):
        a = a0 + (a1 - a0) * i / n
        st.put(int(round(cx + np.cos(a) * r)), int(round(cy + np.sin(a) * r * ASPECT)), cid(ch), p, inten)


def line_ch(st, x0, y0, x1, y1, p, inten=0.8, ch="·"):
    n = int(max(abs(x1 - x0), abs(y1 - y0) * 2)) + 1
    for i in range(n + 1):
        t = i / max(n, 1)
        st.put(int(round(x0 + (x1 - x0) * t)), int(round(y0 + (y1 - y0) * t)), cid(ch), p, inten)


def panel(st, x0, y0, x1, y1, p=DEEP, inten=0.45, title=None, tp=MID):
    st.box(x0, y0, x1, y1, p, inten)
    if title:
        st.text(x0 + 2, y0, f"┤ {title} ├", tp, 0.75)


def disc(st, cx, cy, r, p, inten=0.95, ch="█", ring_only=False):
    for y in range(int(cy - r / ASPECT) - 1, int(cy + r / ASPECT) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            dx = x - cx
            dy = (y - cy) * ASPECT
            d = (dx * dx + dy * dy) ** 0.5
            if d <= r:
                if ring_only and d < r - 1.4:
                    continue
                st.put(x, y, cid(ch), p, inten)


def plot_curve(st, xs, ys, p, inten=0.9, ch="·", glow=0.0):
    xi = np.clip(np.round(xs), 0, st.cols - 1).astype(np.int32)
    yi = np.clip(np.round(ys), 0, st.rows - 1).astype(np.int32)
    st.ch[yi, xi] = CH2ID[ch]
    st.p[yi, xi] = p
    st.i[yi, xi] = np.maximum(st.i[yi, xi], inten)
    if glow > 0:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            gx = np.clip(xi + dx, 0, st.cols - 1)
            gy = np.clip(yi + dy, 0, st.rows - 1)
            st.i[gy, gx] = np.maximum(st.i[gy, gx], inten * glow)


def prog(f, a, b):
    return clamp01((f - a) / max(1.0, b - a))


_rng5 = np.random.default_rng(5)
_PTS = _rng5.normal(size=(1440, 3)).astype(np.float32)
_PTS /= np.linalg.norm(_PTS, axis=1, keepdims=True)


def density_floor(st, f, ctx, k=0.11):
    """把没被任何场景写过的格子填成很暗的数据流——保证画面永远是密的。"""
    Y, X = st.Y, st.X
    m = st.i < 0.045
    if not m.any():
        return
    sp = 0.35 + 0.75 * rnd(X, 0, 3)
    yy = Y - f * 0.42 * sp
    cell = np.floor(yy)
    q = rnd(X, cell, 7)
    cs = RAMP_ID[(q * (len(RAMP_ID) - 1)).astype(np.int32)]
    inten = (0.05 + k * (1.0 - ((yy % 3.0) / 3.0))) * (0.35 + 0.65 * rnd(X, np.floor(yy / 2.0), 11))
    st.ch[m] = cs[m]
    st.p[m] = DEEP
    st.i[m] = np.maximum(st.i[m], inten[m])


_CHECK = [
    ("KERNEL / SYS.INIT", "0x2A4F"),
    ("MEMORY MAP", "2048K"),
    ("AUDIO CLOCK", "130.00 BPM"),
    ("LYRIC LEXICON", "129 LINES"),
    ("GLYPH MATRIX", "128x27"),
    ("SUBTITLE BUS", "EN / CN"),
    ("CRT LAYER", "SCAN/BLOOM"),
    ("EXEC ENGINE", "READY"),
    ("WORLD.EXECUTE(ME);", "WAIT"),
]


def act_init(st, f, ctx):
    """0 - 13.89s：冷启动。左侧数据倾倒，右侧主计数，中间一条电源线，下面是逐项清单。"""
    ctx.state_name = "INIT"
    ctx.load = 0.18 + 0.62 * clamp01(f / 340.0)
    st.clear()
    D = design
    D.dotgrid(st, 0.075)

    # ---- 页眉
    D.label(st, D.L, 1, "INIT SEQUENCE", MID, 0.85)
    n_done = int(clamp01((f - 40) / 250.0) * 9)
    D.label(st, D.R - 4, 1, f"{n_done:02d}", HI if n_done >= 9 else MAIN, 0.9)
    D.label(st, D.R, 1, "09", DIM, 0.5)
    if f > 16:
        D.rule(st, 2, D.L, D.L + int((D.R - D.L) * clamp01((f - 16) / 24.0)), DIM, 0.45)

    # ---- 左：十六进制倾倒
    for r in range(8):
        y = 4 + r
        t0 = 30 + r * 6
        if f < t0:
            continue
        off = hexrow(4, 300 + r)
        body = hexrow(20, 400 + r + f // 26)
        D.label(st, D.L, y, f"0x{off}", DIM, 0.55)
        st.text(D.L + 8, y, " ".join(body[i:i + 2] for i in range(0, 20, 2)), MID, 0.42)

    # ---- 右：主计数
    q = clamp01((f - 54) / 290.0)
    if f > 46:
        D.label(st, 88, 3, "DATA FILL", DIM, 0.6)
        n = f"{int(q * 100):3d}"
        D.seg7(st, n, 104, 3, HI if q > 0.99 else MAIN, 0.35 + 0.65 * q)
        D.label(st, 124, 5, "%", MID, 0.8)
    if f > 64:
        D.meter(st, 11, 88, 126, q, MAIN, HI, 0.85)
        D.label(st, 88, 12, f"{int(q * 4096):04d}/4096 W", DIM, 0.5)
    if f > 10:
        D.label(st, 106, 12, "V_IN", DIM, 0.5)
        v = 220.0 + 0.7 * np.sin(f * 0.33)
        st.text(112, 12, f"{v:5.1f}V", MID, 0.8)

    # ---- 电源线
    if f > 22:
        y = 14
        grow = clamp01((f - 22) / 38.0)
        x1 = D.L + int((D.R - D.L) * grow)
        D.rule(st, y, D.L, x1, MID, 0.5, cap=True)
        if grow > 0.99:
            pos = (f * 2.4) % (D.R - D.L)
            for d in range(-9, 10):
                xx = int(D.L + pos + d)
                if D.L <= xx <= D.R:
                    k = 1 - abs(d) / 10.0
                    st.put(xx, y, cid("█" if k > 0.72 else "▓"), HI, 0.2 + 0.8 * k)

    # ---- 清单
    for i, (k, v) in enumerate(_CHECK):
        t0 = 44 + i * 24
        if f < t0:
            continue
        y = 16 + i
        done = f >= t0 + 5
        st.put(D.L, y, cid("["), DIM, 0.45)
        st.put(D.L + 3, y, cid("]"), DIM, 0.45)
        if done:
            st.text(D.L + 1, y, "OK", MAIN, 0.95)
        elif (f // 5) % 2 == 0:
            st.text(D.L + 1, y, "··", MID, 0.7)
        D.label(st, D.L + 6, y, k, MID if done else DIM, 0.85 if done else 0.45)
        kw = D.label_w(k)
        D.leader(st, D.L + 6 + kw + 2, D.R - len(v) - 2, y)
        for j, ch in enumerate(v):
            st.put(D.R - (len(v) - 1 - j), y, cid(ch), HI if done else MID, 0.9 if done else 0.5)

    # ---- 页脚
    if f > 86:
        D.rule(st, 25, D.L, D.R, DIM, 0.3)
        msg = "ALL PARAMETERS WRITTEN" if n_done >= 9 else "WRITING PARAMETERS"
        D.label(st, D.L, 26, msg, MAIN if n_done >= 9 else MID, 0.85)
        if (f // 8) % 2 == 0:
            st.put(D.L + D.label_w(msg) + 2, 26, cid("█"), HI, 0.9)
        D.label(st, D.R - 9, 26, "BUILD 0.0.1", DIM, 0.45)

    # ---- 收尾：整屏开始抖
    if f > 372:
        k = clamp01((f - 372) / 45.0)
        scramble(st, f, 0.5 * k, seed=17)
        st.i = np.clip(st.i * (1 + 0.8 * k), 0, 1)


TITLE_LINES = ["WORLD.", "EXECUTE(ME);"]
TS = 2           # 5×5 点阵字放大倍数
TGAP = 0
TITLE_Y = [1, 13]


def act_title(st, f, ctx):
    """13.89 - 29.71s：塌缩 → 铺满乱流 → 重组成片名。"""
    ctx.state_name = "TITLE"
    st.clear()
    D = design
    f0 = A["title"]
    t = f - f0

    tx = [max(0, (st.cols - D.pixw(t, TS, TGAP)) // 2) for t in TITLE_LINES]

    # ---- 0-32：版面塌缩成一条线
    if t < 32:
        q = clamp01(t / 30.0)
        D.dotgrid(st, 0.07 * (1 - q))
        half = int((D.R - D.L) * (1 - q) / 2)
        if half > 0:
            D.rule(st, 13, 63 - half, 63 + half, MID, 0.55)
        for i in range(int(50 * q)):
            a = rnd(i, 0, 5) * 6.28
            st.put(int(63 + np.cos(a) * 26 * q), int(13 + np.sin(a) * 4.5 * q), cid("·"), DIM, 0.4)
        return

    # ---- 32-112：全屏乱流
    if t < 112:
        u = clamp01((t - 32) / 80.0)
        Y, X = st.Y, st.X
        cx, cy = 63.5, 13.0
        dx = (X - cx) * ASPECT
        dy = Y - cy
        r = np.sqrt(dx * dx + dy * dy) + 1e-3
        a = np.arctan2(dy, dx) + f * 0.055 + 1.1 / (r + 0.7)
        v = 0.5 + 0.5 * np.sin(r * 0.5 - f * 0.24 + a * 2.0)
        v *= 0.55 + 0.45 * fbm(X * 0.07 + a, Y * 0.07, 21, 3)
        st.ramp(v, p=MAIN, inten=0.9, gain=1.1)
        scramble(st, f, 0.8 - 0.28 * u, seed=23)
        for k in range(3):
            yy = int((f * (2.2 + k * 1.6) + k * 9) % st.rows)
            for x in range(st.cols):
                if rnd(x, yy, f + k) > 0.45:
                    st.put(x, yy, cid("─"), HI, 0.4)
        return

    # ---- 112 起：粒子归位
    tt = clamp01((t - 112) / 92.0)
    targets = []
    for i, t in enumerate(TITLE_LINES):
        targets += D.pixcells(t, tx[i], TITLE_Y[i], TS, TGAP)
    if targets and tt <= 0.92:          # 落定后交给点阵字，粒子层收手
        tx = np.array([c[0] for c in targets])
        ty = np.array([c[1] for c in targets])
        tc = np.array([c[2] for c in targets])
        delay = 0.08 + 0.60 * rnd(tx, ty, 32)
        k = clamp01((tt - delay * 0.6) / 0.4)
        sx = rnd(tx, ty, 33) * st.cols
        sy = rnd(tx, ty, 34) * st.rows
        ang = rnd(tx, ty, 31) * 6.28 + (1 - k) * 7.0
        swirl = (1 - k) * 6.0
        px = tx + (sx - tx) * (1 - k) + np.cos(ang) * swirl * 0.6
        py = ty + (sy - ty) * (1 - k) + np.sin(ang) * swirl
        xi = np.clip(px, 0, st.cols - 1).astype(np.int32)
        yi = np.clip(py, 0, st.rows - 1).astype(np.int32)
        st.ch[yi, xi] = BLOCK_ID[3]
        st.p[yi, xi] = np.where(k > 0.9, HI, MAIN).astype(np.uint8)
        st.i[yi, xi] = np.clip((0.30 + 0.70 * tc) * (0.35 + 0.65 * k), 0, 1)

    # ---- 落定
    if tt > 0.88:
        q = clamp01((tt - 0.88) / 0.12)
        for i, t in enumerate(TITLE_LINES):
            D.pixfont(st, t, tx[i], TITLE_Y[i], TS, HI, 0.55 + 0.45 * q, TGAP,
                      fill=lambda x, y, k: "#" if (x + y + k) % 2 == 0 else "+")
        if q > 0.3:
            D.label(st, D.L, 26, "MILI", MAIN, 0.85 * q)
            D.label(st, 30, 26, "TRACK 03 / 2016", DIM, 0.6 * q)
        if q > 0.6:
            sy2 = int((f * 0.7) % st.rows)
            for x in range(st.cols):
                st.put(x, sy2, cid("─"), HI, 0.14)
        if (f // 43) % 11 == 0 and q > 0.5:
            scramble(st, f, 0.14, seed=29)


# ================================================================== 2. MATH
def act_math(st, f, ctx):
    ctx.state_name = "MATH"
    ctx.load = 0.62
    rain_bg(st, f, ctx, DEEP, 0.75, 0.16, seed=21)
    if f < A["circle"]:
        t = prog(f, A["points"], A["circle"])
        a = f * 0.024
        ca, sa = np.cos(a), np.sin(a)
        R = np.array([[ca, 0, sa], [0, 1, 0], [-sa, 0, ca]], np.float32)
        P = _PTS @ R.T
        sc = 40 + 8 * prog(f, A["dimension"], A["circle"])
        px = 63.5 + P[:, 0] * sc
        py = 13.5 + P[:, 1] * sc * ASPECT
        dep = (P[:, 2] + 1) * 0.5
        xi = np.clip(np.round(px), 0, st.cols - 1).astype(np.int32)
        yi = np.clip(np.round(py), 0, st.rows - 1).astype(np.int32)
        n = int(len(px) * clamp01(t * 6.0))
        st.ch[yi[:n], xi[:n]] = np.where(dep[:n] > 0.62, CH2ID["●"], CH2ID["·"]).astype(np.int16)
        st.p[yi[:n], xi[:n]] = np.where(dep[:n] > 0.72, HI, MID).astype(np.uint8)
        st.i[yi[:n], xi[:n]] = np.maximum(st.i[yi[:n], xi[:n]], 0.35 + 0.6 * dep[:n])
        for i in range(0, n, 3):
            for j in range(i + 1, min(n, i + 4)):
                if rnd(i, j, 91) > 0.72:
                    line_ch(st, px[i], py[i], px[j], py[j], DEEP, 0.30, "·")
        for v in np.eye(3, dtype=np.float32):
            Q = v @ R.T
            line_ch(st, 63.5, 13.5, 63.5 + Q[0] * sc, 13.5 + Q[1] * sc * ASPECT, MID, 0.7, "─")
        bx = int(sc * 1.05 / ASPECT * 0.5)
        st.box(64 - bx, 13 - bx // 2, 64 + bx, 13 + bx // 2, DEEP, 0.35)
        st.text(2, 2, "SET OF POINTS", MID, 0.85)
        st.text(2, 3, f"n = {n:4d} / 1440", AMBER, 0.9)
        st.text(2, 4, "DIM = 3", DEEP, 0.6)
        if f >= A["dimension"]:
            q = prog(f, A["dimension"], A["dimension"] + 8)
            big_text(st, "DIMENSION", 22, 4, HI, 0.9 * q, x0=34, cols=60)

    elif f < A["sine"]:
        t = prog(f, A["circle"], A["sine"])
        cx, cy = 63.5, 13.0
        r = 3 + 8.5 * ease_out(clamp01(t * 2.2))
        for k in range(48):
            ang = k / 48 * 2 * np.pi + f * 0.012
            rr = r * (1.06 if k % 4 == 0 else 1.0)
            st.put(int(round(cx + np.cos(ang) * rr)), int(round(cy + np.sin(ang) * rr * ASPECT)), cid("·"), DEEP, 0.45)
        arc(st, cx, cy, r, -np.pi / 2, -np.pi / 2 + 2 * np.pi * clamp01(t * 1.9), HI, 0.95, "█")
        ang = f * 0.045
        line_ch(st, cx, cy, cx + np.cos(ang) * r, cy + np.sin(ang) * r * ASPECT, AMBER, 0.8, "·")
        st.put(int(cx + np.cos(ang) * r * 0.55), int(cy + np.sin(ang) * r * ASPECT * 0.55) - 1, cid("r"), AMBER, 0.95)
        st.text(2, 2, "CIRCLE", MID, 0.85)
        st.text(2, 3, f"r = {r:5.2f}", DEEP, 0.65)
        if f >= A["circum"]:
            q = prog(f, A["circum"], A["circum"] + 8)
            st.text(2, 4, f"C = 2*pi*r = {2 * np.pi * r:6.2f}", HI, 0.95)
            big_text(st, "CIRCUMFERENCE", 22, 4, MID, 0.85 * q, x0=26, cols=76)

    elif f < A["infinity"]:
        t = prog(f, A["sine"], A["infinity"])
        x = np.arange(st.cols, dtype=np.float32)
        amp = 7.0
        k = 0.16
        ph = f * 0.24
        ys = 13 + np.sin(x * k + ph) * amp
        plot_curve(st, x, ys, HI, 0.95, "·", glow=0.5)
        nt = 1 if f < A["tangents"] else 1 + int(prog(f, A["tangents"], A["tangents"] + 14) * 6)
        for j in range(nt):
            x0 = (j * 20 + f * 1.3) % st.cols
            sl = amp * k * np.cos(x0 * k + ph)
            xs = np.arange(x0 - 6, x0 + 7)
            yy = ys[int(x0)] + sl * (xs - x0)
            m = (xs >= 0) & (xs < st.cols)
            plot_curve(st, xs[m], yy[m], AMBER, 0.85, "─")
            st.put(int(x0), int(round(ys[int(x0)])), cid("●"), HI, 1.0)
        st.text(2, 2, "SINE WAVE / dy-dx = cos(x)", MID, 0.85)
        st.text(2, 3, f"PHASE {int((ph * 180 / np.pi) % 360):3d}deg   TANGENTS {nt}", DEEP, 0.65)
        if f >= A["tangents"]:
            big_text(st, "TANGENTS", 22, 4, HI, 0.85, x0=42, cols=44)

    else:
        t = prog(f, A["infinity"], A["math_end"])
        tt = np.linspace(0, 2 * np.pi, 4000)
        lx = np.cos(tt) / (1 + np.sin(tt) ** 2)
        ly = np.sin(tt) * np.cos(tt) / (1 + np.sin(tt) ** 2)
        grow = 0.30 + 0.70 * ease_out(clamp01(t * 1.6))
        S = 58 * grow
        cx, cy = 63.5, 13.5
        xs = cx + lx * S
        ys = cy + ly * S * ASPECT * 1.7
        plot_curve(st, xs, ys, HI, 0.55 + 0.4 * grow, "█", glow=0.55)
        for j in range(8):
            idx = int(((f * 9 + j * len(tt) / 8) % len(tt)))
            st.put(int(round(xs[idx])), int(round(ys[idx])), cid("●"), WHITE, 1.0)
        if t > 0.4:
            q = prog(f, A["infinity"] + 30, A["math_end"])
            plot_curve(st, cx + lx * S * 0.42, cy + ly * S * 0.42 * ASPECT * 1.7, CYAN, 0.75 * q, "░")
        st.text(2, 2, "lim  x -> INF", AMBER, 0.95)
        st.text(2, 3, f"n = {int(1e3 * (1 + t * 999)):,}", DEEP, 0.65)
        if f >= A["limits"]:
            q = prog(f, A["limits"], A["limits"] + 8)
            big_text(st, "LIMITATIONS", 0, 3, MID, 0.85 * q, x0=32, cols=64)


# ================================================================== 3. SENSORY
def act_sensory(st, f, ctx):
    ctx.state_name = "SENSE"
    ctx.load = 0.80
    kick = ctx.k(f)

    if f < A["dizzy"]:
        # AC -> DC
        t = prog(f, A["acdc"], A["dizzy"])
        x = np.arange(st.cols, dtype=np.float32)
        rect = prog(f, A["acdc"] + 24, A["acdc"] + 54)
        flat = prog(f, A["acdc"] + 54, A["acdc"] + 84)
        y = np.sin(x * 0.24 + f * 0.6) * 9
        y = np.where(rect > 0, np.abs(y), y) * (1 - flat * 0.94)
        plot_curve(st, x, 13.5 + y, CYAN, 0.9, "─", glow=0.35)
        plot_curve(st, x, 13.5 + y * 0.5, DEEP, 0.45, "·")
        st.hline(13.5, 0, st.cols - 1, "─", DIM, 0.3)
        for k in range(0, st.cols, 8):
            st.put(k, 14, cid("┼"), DIM, 0.35)
        st.text(2, 2, "RECTIFY", MID, 0.85)
        st.text(2, 3, f"AC {int((1 - rect) * 100):3d}%  ->  DC {int(rect * 100):3d}%", AMBER, 0.9)
        st.text(2, 4, "60Hz -> 0", DEEP, 0.6)
        big_text(st, "AC to DC", 22, 4, HI, 0.8, x0=40, cols=48)

    elif f < A["travel"]:
        # dizzy
        t = prog(f, A["dizzy"], A["travel"])
        Y, X = st.Y, st.X
        cx, cy = 63.5, 13.5
        dx = (X - cx) * ASPECT
        dy = Y - cy
        r = np.sqrt(dx * dx + dy * dy) + 1e-3
        a = np.arctan2(dy, dx) + f * (0.10 + 0.14 * t)
        v = clamp01(0.5 + 0.5 * np.sin(a * 3 + r * 1.1 - f * 0.32)) * clamp01(1.35 - r / 24)
        st.ramp(v, p=MAIN, inten=0.9)
        scramble(st, f, 0.16 + 0.28 * t, seed=31)
        for k in range(4):
            ring(st, cx, cy, 4 + k * 5 + 2 * np.sin(f * 0.12 + k), CYAN, 0.5 - k * 0.08, "░")
        st.ctext(0, "VISION 0x00 / VESTIBULAR ERROR", AMBER, 0.9)
        if (f // 5) % 2 == 0:
            big_text(st, "so dizzy", 22, 4, HI, 0.85, x0=34, cols=60)

    elif f < A["unite"]:
        # A.D. -> B.C.
        t = prog(f, A["travel"], A["unite"])
        year = int(2026 - (2026 * 2 + 500) * ease_io(clamp01(t * 1.15)))
        for k in range(9):
            xx = int((k * 15 - f * 1.8) % (st.cols + 30)) - 15
            st.text(xx, 2 + k * 3, f"{year + k * 41:+05d}", DEEP, 0.32 + 0.28 * (k % 3))
        st.hline(14, 0, st.cols - 1, "─", MID, 0.45)
        off = (f * 2.6) % 10
        for k in range(0, st.cols, 10):
            st.put(int(k - off) % st.cols, 14, cid("┼"), MID, 0.7)
        big_text(st, f"{year:+05d}", 6, 9, HI if year > 0 else CYAN, 0.95, x0=24, cols=80)
        st.text(2, 2, "A.D." if year > 0 else "B.C.", AMBER, 0.95)
        st.text(2, 3, "TIME AXIS REVERSED", DEEP, 0.6)
        for k in range(8):
            xx = (k * 17 + int(f * 0.8)) % st.cols
            for y in range(st.rows):
                if rnd(xx, y, f // 3 + k) > 0.55:
                    st.put(xx, y, cid("│"), DEEP, 0.3)

    elif f < A["stim"]:
        # unite / phase lock
        t = prog(f, A["unite"], A["stim"])
        x = np.arange(st.cols, dtype=np.float32)
        sep = (1 - ease_io(clamp01(t * 1.35))) * 9 + 0.3
        y1 = 11 + np.sin(x * 0.19 + f * 0.44) * 6
        y2 = 11 + sep + np.sin(x * 0.19 + f * 0.44 + (1 - t) * 2.6) * 6
        plot_curve(st, x, y1, CYAN, 0.9, "█", glow=0.4)
        plot_curve(st, x, y2, AMBER, 0.9, "█", glow=0.4)
        if t > 0.82:
            q = prog(f, A["unite"] + int((A["stim"] - A["unite"]) * 0.82), A["stim"])
            plot_curve(st, x, (y1 + y2) / 2, HI, q, "█", glow=0.6)
            st.ctext(1, "PHASE LOCK", HI, 0.95)
        st.text(2, 3, f"MERGE {int(t * 100):3d}%", DEEP, 0.65)
        big_text(st, "so deeply", 22, 4, HI, 0.8, x0=34, cols=60)

    elif f < A["satis"]:
        # STIMULATIONS：刺激（频谱尖峰 + 电弧）
        t = prog(f, A["stim"], A["satis"])
        Y, X = st.Y, st.X
        st.clear()
        cy = 14.0
        bands = ctx.bands[int(np.clip(f, 0, ctx.total - 1))].astype(np.float32)
        bv = np.interp(np.linspace(0, 1, st.cols), np.linspace(0, 1, 128), bands)
        bv = (bv - bv.min()) / (bv.max() - bv.min() + 1e-4)
        bv = bv ** 1.7
        for x in range(st.cols):
            h = 1 + int(bv[x] * 8.0 * (0.8 + 0.4 * kick))
            for k in range(h):
                tip = k >= h - 2
                st.put(x, int(cy - k), cid("▓" if tip else "░"), AMBER, 0.45 + 0.35 * (k / 8.0))
                st.put(x, int(cy + k), cid("▓" if tip else "░"), ORANGE, 0.45 + 0.35 * (k / 8.0))
        # 中线
        st.hline(int(cy), 0, st.cols - 1, "═", HI, 0.9)
        # 电弧
        for b in range(int(3 + 5 * kick)):
            x = int(rnd(b, f // 2, 41) * st.cols)
            y = int(rnd(b, f // 2 + 1, 42) * st.rows)
            for seg in range(26):
                st.put(x, y, cid("●"), HI, 1.0)
                x = int(np.clip(x + int((rnd(x, y, f + seg) - 0.5) * 6), 0, st.cols - 1))
                y = int(np.clip(y + int((rnd(y, x, f + seg) - 0.5) * 4), 0, st.rows - 1))
        # 中心核
        disc(st, 63.5, cy, 1.6 + 2.0 * kick, WHITE, 1.0, "●")
        ring(st, 63.5, cy, 4 + 6 * kick, AMBER, 0.8, "░")
        st.text(2, 1, "INPUT GAIN", AMBER, 0.9)
        st.text(2, 2, f"{int(120 + 220 * kick):3d}%", HI, 1.0)
        st.text(2, 3, f"SPIKE {int(f * 3) % 9999:04d}", DEEP, 0.7)
        big_text(st, "STIMULATIONS", 23, 3, HI, 0.95, x0=16, cols=96)

    elif f < A["exec1"]:
        # SATISFACTION：进度条
        t = prog(f, A["satis"], A["exec1"])
        st.clear()
        rain_bg(st, f, ctx, DEEP, 0.6, 0.12, seed=44)
        for b in range(5):
            y = 6 + b * 3
            q = clamp01(t * (1.06 + b * 0.02) - b * 0.05)
            st.text(2, y, f"OUT{b}", MID, 0.85)
            w = 100
            for x in range(w):
                on = (x / w) < q
                seg = (x // 4) % 2 == 0
                st.put(9 + x, y, cid("█" if on else ("░" if seg else "▒")),
                       HI if on else DIM, 0.95 if on else 0.30)
            hx = 9 + int(q * w)
            if q < 0.995:
                st.put(hx, y, cid("▌"), AMBER, 1.0)
            st.text(112, y, f"{int(q * 100):3d}%", HI if q > 0.99 else MID, 0.9)
        q = clamp01(t * 1.12)
        st.ctext(1, f"SATISFACTION  {int(q * 100):3d}%", HI, 1.0)
        if q > 0.985:
            st.ctext(22, "OUTPUT == 1.000", AMBER, 0.95)
            for k in range(3):
                ring(st, 63.5, 13.5, 6 + k * 4 + (f % 12), HI, 0.7 - k * 0.15, "░")

    elif f < A["trapped1"]:
        # EXECUTION + 两侧数据滚动
        st.clear()
        for x in range(0, 26):
            for y in range(st.rows):
                if rnd(x, y, f // 2) > 0.45:
                    st.put(x, y, cid(hexrow(1, x * 31 + y + f // 2)), DEEP, 0.30 + 0.3 * rnd(x, y, f))
                if rnd(st.cols - 1 - x, y, f // 2 + 5) > 0.45:
                    st.put(st.cols - 1 - x, y, cid(hexrow(1, x * 17 + y * 3 + f // 2)), DEEP,
                           0.30 + 0.3 * rnd(x, y, f + 9))
        big_text(st, "EXECUTION", 8, 7, HI, 0.95, x0=20, cols=88)
        st.hline(16, 20, 107, "═", RED, 0.8)
        st.hline(17, 20, 107, "═", RED, 0.5)
        st.text(2, 1, "RUN / NO RETURN", AMBER, 0.9)
        st.text(96, 1, "PID 0001", DEEP, 0.6)
        st.ctext(20, "IF I CAN MAKE YOU HAPPY", MID, 0.75)
        if ctx.k(f) > 0.3:
            scramble(st, f, 0.10 * ctx.k(f), seed=55)

    else:
        # trapped in simulation
        t = prog(f, A["trapped1"], A["sensory_end"])
        Y, X = st.Y, st.X
        horizon = 4
        yy = Y - horizon
        m = yy > 0
        z = 5.0 / (yy + 0.5)
        wx = (X - 63.5) * z * 0.20
        wz = z * 1.4 + f * (0.4 + 1.4 * t)
        gx = np.abs(((wx + 0.5) % 1.0) - 0.5)
        gz = np.abs(((wz + 0.5) % 1.0) - 0.5)
        on = (gx < 0.10) | (gz < 0.10)
        inten = np.where(on, 0.2 + 0.8 * clamp01(1.3 - z / 6), 0.0)
        st.ch[m] = np.where(on[m], CH2ID["─"], CH2ID[" "]).astype(np.int16)
        st.p[m] = CYAN
        st.i[m] = np.maximum(st.i[m], inten[m])
        for k in range(4):
            q = clamp01(t * 1.4 - k * 0.14)
            x0 = int(3 + (58 - k * 12) * (1 - q))
            y0 = int(1 + (11 - k * 2.4) * (1 - q))
            x1 = st.cols - 1 - x0
            y1 = st.rows - 1 - y0
            if x1 - x0 > 4 and y1 - y0 > 2:
                st.box(x0, y0, x1, y1, HI if k == 0 else CYAN, 0.35 + 0.15 * k)
        st.ctext(0, "TRAPPED / LOOP FOREVER", AMBER, 0.95)
        st.text(2, 1, f"ITER {int(f * 1.7) % 99999:05d}", DEEP, 0.6)
        st.text(110, 1, f"DEPTH {1 + int(t * 6)}", DEEP, 0.6)
        st.ctext(24, "STRANGE, STRANGE SIMULATION", MID, 0.85)


# ================================================================== 4. ORGANIC
def _shape(st, fn, x0, y0, cols, rows, p, inten=0.9, gamma=1.0, ramp_ids=None, ss=4):
    img = Image.new("L", (cols * ss, rows * ss), 0)
    d = ImageDraw.Draw(img)
    fn(d, cols * ss, rows * ss)
    st.image(img, x0, y0, cols, rows, p, ramp_ids=ramp_ids, inten=inten, gamma=gamma)


def _egg(d, w, h, t=0.0):
    cx = w * 0.5
    d.ellipse([cx - w * 0.30, h * 0.34, cx + w * 0.30, h * 0.97], fill=255)
    d.ellipse([cx - w * 0.115, h * 0.16, cx + w * 0.115, h * 0.44], fill=255)
    d.line([cx, h * 0.20, cx + w * 0.015, h * 0.04], fill=255, width=max(2, int(w * 0.028)))
    d.line([cx - w * 0.01, h * 0.17, cx - w * 0.15, h * 0.09], fill=255, width=max(2, int(w * 0.022)))
    # 脸
    ey = h * 0.56
    for s in (-1, 1):
        d.ellipse([cx + s * w * 0.13 - w * 0.035, ey - h * 0.035, cx + s * w * 0.13 + w * 0.035, ey + h * 0.035], fill=0)
    d.arc([cx - w * 0.09, ey + h * 0.03, cx + w * 0.09, ey + h * 0.15], 0, 180, fill=0, width=max(2, int(w * 0.02)))


def _tomato(d, w, h, t=0.0):
    cx, cy = w * 0.5, h * 0.58
    d.ellipse([cx - w * 0.34, cy - h * 0.34, cx + w * 0.34, cy + h * 0.36], fill=255)
    # 萼片
    for k in range(5):
        a = -np.pi / 2 + (k - 2) * 0.55
        x1 = cx + np.cos(a) * w * 0.06
        y1 = cy - h * 0.30 + np.sin(a) * h * 0.06
        x2 = cx + np.cos(a) * w * 0.26
        y2 = cy - h * 0.30 + np.sin(a) * h * 0.22
        d.polygon([(cx, cy - h * 0.30), (x1, y1), (x2, y2)], fill=255)
    d.line([cx, cy - h * 0.32, cx, cy - h * 0.46], fill=255, width=max(2, int(w * 0.03)))
    ey = cy
    for s in (-1, 1):
        d.ellipse([cx + s * w * 0.14 - w * 0.04, ey - h * 0.04, cx + s * w * 0.14 + w * 0.04, ey + h * 0.04], fill=0)
    d.arc([cx - w * 0.10, ey + h * 0.02, cx + w * 0.10, ey + h * 0.16], 0, 180, fill=0, width=max(2, int(w * 0.02)))


def _cat(d, w, h, t=0.0):
    cx, cy = w * 0.5, h * 0.56
    rw, rh = w * 0.30, h * 0.26
    # 耳朵
    d.polygon([(cx - rw * 0.95, cy - rh * 0.55), (cx - rw * 0.72, cy - rh * 1.75), (cx - rw * 0.18, cy - rh * 0.95)], fill=255)
    d.polygon([(cx + rw * 0.95, cy - rh * 0.55), (cx + rw * 0.72, cy - rh * 1.75), (cx + rw * 0.18, cy - rh * 0.95)], fill=255)
    d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=255)
    # 眼睛（眨眼）
    blink = 0.12 + 0.88 * abs(np.cos(t * 1.7))
    ey = cy - rh * 0.10
    for s in (-1, 1):
        d.ellipse([cx + s * rw * 0.42 - rw * 0.13, ey - rh * 0.16 * blink,
                   cx + s * rw * 0.42 + rw * 0.13, ey + rh * 0.16 * blink], fill=0)
    # 鼻/嘴
    d.polygon([(cx, cy + rh * 0.16), (cx - rw * 0.08, cy + rh * 0.30), (cx + rw * 0.08, cy + rh * 0.30)], fill=0)
    # 胡须
    for k, yy in enumerate((-0.10, 0.10, 0.28)):
        for s in (-1, 1):
            d.line([cx + s * rw * 0.55, cy + rh * yy, cx + s * rw * 1.55, cy + rh * (yy - 0.16 + k * 0.10)],
                   fill=255, width=max(1, int(w * 0.012)))
    # 虎斑条纹
    for k in range(3):
        yy = cy - rh * (0.55 - k * 0.22)
        d.line([cx - rw * 0.35, yy, cx - rw * 0.05, yy - rh * 0.05], fill=0, width=max(2, int(w * 0.016)))
        d.line([cx + rw * 0.35, yy, cx + rw * 0.05, yy - rh * 0.05], fill=0, width=max(2, int(w * 0.016)))


def _god(d, w, h, t=0.0):
    cx, cy = w * 0.5, h * 0.52
    r = min(w, h) * 0.26
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    d.ellipse([cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55], fill=0)
    for k in range(16):
        a = k / 16 * 2 * np.pi + t * 0.2
        d.line([cx + np.cos(a) * r * 1.25, cy + np.sin(a) * r * 1.25,
                cx + np.cos(a) * r * 1.95, cy + np.sin(a) * r * 1.95],
               fill=255, width=max(2, int(w * 0.012)))


def act_organic(st, f, ctx):
    ctx.state_name = "ORGANIC"
    ctx.load = 0.7
    rain_bg(st, f, ctx, DEEP, 0.6, 0.14, seed=88)

    if f < A["tomato"]:
        t = prog(f, A["egg"], A["tomato"])
        bob = np.sin(f * 0.16) * 1.2
        _shape(st, _egg, 44, int(2 + bob), 40, 24, MAIN, 0.9, 0.85)
        st.text(2, 2, "SPECIMEN 01 / SOLANUM MELONGENA", CYAN, 0.8)
        st.text(2, 3, "OBJECT = EGGPLANT", DEEP, 0.65)
        st.text(2, 5, "nutrients ......... +100%", MID, 0.7)
        st.text(2, 6, "yield ............. TRUE", DEEP, 0.55)
        big_text(st, "eggplant", 20, 3, HI, 0.6, x0=34, cols=60)
        for k in range(6):
            yy = int(6 + k * 3 + (f * 0.4) % 3)
            st.text(96, yy, hexrow(16, 700 + k + f // 20), DEEP, 0.3)

    elif f < A["cat"]:
        t = prog(f, A["tomato"], A["cat"])
        rot = f * 0.05
        _shape(st, lambda d, w, h: _tomato(d, w, h, t), 44, 2, 40, 24, AMBER, 0.9, 0.85)
        st.text(2, 2, "SPECIMEN 02 / SOLANUM LYCOPERSICUM", CYAN, 0.8)
        st.text(2, 3, "OBJECT = TOMATO", DEEP, 0.65)
        st.text(2, 5, "antioxidants ...... +100%", MID, 0.7)
        st.text(2, 6, "lycopene .......... TRUE", DEEP, 0.55)
        big_text(st, "tomato", 20, 3, HI, 0.6, x0=40, cols=48)

    elif f < A["god"]:
        t = prog(f, A["cat"], A["god"])
        purr = (A["cat"] + 20) / 30.0
        jit = int(np.sin(f * 3.1) * 1.0) if f > A["cat"] + 24 else 0
        _shape(st, lambda d, w, h: _cat(d, w, h, f * 0.06), 44 + jit, 2, 40, 24, MAIN, 0.9, 0.85)
        st.text(2, 2, "SPECIMEN 03 / FELIS CATUS", CYAN, 0.8)
        st.text(2, 3, "OBJECT = TABBY CAT", DEEP, 0.65)
        if f > A["cat"] + 24:
            for k in range(3):
                st.text(2, 5 + k, "purr" + "." * (10 + k * 3), AMBER, 0.6 - k * 0.12)
        big_text(st, "tabby cat", 20, 3, HI, 0.6, x0=34, cols=60)

    elif f < A["gender"]:
        t = prog(f, A["god"], A["gender"])
        _shape(st, lambda d, w, h: _god(d, w, h, f * 0.05), 44, 2, 40, 24, AMBER, 0.9, 0.8)
        st.text(2, 2, "SPECIMEN 04 / DEUS UNICUS", CYAN, 0.8)
        st.text(2, 3, "OBJECT = THE ONLY GOD", DEEP, 0.65)
        st.text(2, 5, "proof_of_existence = USER", MID, 0.75)
        big_text(st, "only God", 20, 3, HI, 0.6, x0=36, cols=56)

    elif f < A["am_pm"]:
        # F -> M
        t = prog(f, A["gender"], A["am_pm"])
        swap = prog(f, A["ftom"], A["ftom"] + 16)
        st.clear()
        for x in range(0, st.cols, 2):
            for y in range(st.rows):
                if rnd(x, y, f // 2) > 0.62:
                    st.put(x, y, cid("│"), DEEP, 0.22)
        a = 1 - swap
        if a > 0.05:
            big_text(st, "F", 4, 18, HI, 0.9 * a, x0=14, cols=28)
        b = swap
        if b > 0.05:
            big_text(st, "M", 4, 18, HI, 0.9 * b, x0=86, cols=28)
        if 0.15 < swap < 0.85:
            for k in range(160):
                q = rnd(k, 1, 12)
                x = 14 + (86 - 14) * swap + (rnd(k, 2, 12) - 0.5) * 26
                y = 4 + rnd(k, 3, 12) * 18
                st.put(int(x), int(y), cid("·"), CYAN, 0.5)
        st.text(2, 2, "FIELD / GENDER", CYAN, 0.85)
        st.text(2, 3, f"[{('F' if swap < 0.5 else 'M')}]  OVERWRITE {int(swap * 100):3d}%", AMBER, 0.95)
        st.ctext(1, "S W I T C H   M Y   G E N D E R", MID, 0.8)
        st.ctext(24, "F  ->  M", HI, 0.85)

    elif f < A["role"]:
        # AM -> PM 昼夜
        t = prog(f, A["am_pm"], A["role"])
        night = t
        Y, X = st.Y, st.X
        st.clear()
        dayc = AMBER if night < 0.5 else BLUE
        # 天空：稀疏纹理，随昼夜变密变暗
        sm = (Y < 18) & (rnd(X // 2, Y // 2, 3) > 0.90)
        st.ch[sm] = CH2ID["·"]
        st.p[sm] = BLUE if night > 0.4 else AMBER
        st.i[sm] = np.maximum(st.i[sm], (0.15 + 0.55 * night) * (0.4 + rnd(X, Y, 4)[sm]))
        # 太阳 / 月亮
        ang = np.pi * (0.05 + 0.9 * t)
        sx = 8 + 112 * t
        sy = 17 - np.sin(ang) * 13
        if t < 0.55:
            disc(st, sx, sy, 3.4, AMBER, 0.95, "█")
            for k in range(12):
                a = k / 12 * 2 * np.pi + f * 0.03
                line_ch(st, sx + np.cos(a) * 4.6, sy + np.sin(a) * 4.6 * ASPECT,
                        sx + np.cos(a) * 7.0, sy + np.sin(a) * 7.0 * ASPECT, ORANGE, 0.5, "·")
        else:
            disc(st, sx, sy, 3.2, WHITE, 0.95, "█")
            disc(st, sx + 1.1, sy - 0.5, 2.9, BG, 1.0, "█")
        # 地平线与楼群
        st.hline(19, 0, st.cols - 1, "═", dayc, 0.8)
        for k in range(26):
            bx = int(rnd(k, 0, 7) * st.cols)
            bw = 2 + int(rnd(k, 1, 7) * 5)
            bh = 1 + int(rnd(k, 2, 7) * 4)
            for yy in range(19 - bh, 19):
                for xx in range(bx, min(st.cols, bx + bw)):
                    st.put(xx, yy, cid("▓"), DEEP if night < 0.5 else BLUE, 0.45)
        # 时钟
        ccx, ccy = 22.0, 8.0
        ring(st, ccx, ccy, 5.6, MID, 0.55, "·")
        hh = (t * 24) % 24
        line_ch(st, ccx, ccy, ccx + np.cos(hh / 12 * 2 * np.pi - np.pi / 2) * 5.0,
                ccy + np.sin(hh / 12 * 2 * np.pi - np.pi / 2) * 5.0 * ASPECT, HI, 0.95, "─")
        st.text(2, 0, "CLOCK FIELD", CYAN, 0.85)
        st.text(2, 1, f"{int(hh):02d}:{int((hh % 1) * 60):02d}", HI, 1.0)
        big_text(st, "AM" if t < 0.5 else "PM", 0, 4, AMBER if t < 0.5 else CYAN, 0.95, x0=100, cols=26)

    elif f < A["trance"]:
        # S -> M 角色覆写
        t = prog(f, A["role"], A["trance"])
        swap = prog(f, A["stom"], A["stom"] + 16)
        st.clear()
        rain_bg(st, f, ctx, DEEP, 1.0, 0.16, seed=101)
        a = 1 - swap
        if a > 0.05:
            big_text(st, "S", 4, 18, HI, 0.9 * a, x0=14, cols=28)
        if swap > 0.05:
            big_text(st, "M", 4, 18, HI, 0.9 * swap, x0=86, cols=28)
        st.text(2, 2, "FIELD / ROLE", CYAN, 0.85)
        st.text(2, 3, f"[{'S' if swap < 0.5 else 'M'}]  OVERWRITE {int(swap * 100):3d}%", AMBER, 0.95)
        st.ctext(1, "S W I T C H   M Y   R O L E", MID, 0.8)
        st.ctext(24, "S  ->  M", HI, 0.85)
        for k in range(5):
            yy = 5 + k * 4
            st.text(50, yy, f"0x{k:02X} " + hexrow(10, 300 + k + f // 15), DEEP, 0.3)

    else:
        # TRANCE
        t = prog(f, A["trance"], A["organic_end"])
        Y, X = st.Y, st.X
        cx, cy = 63.5, 13.5
        dx = (X - cx) * ASPECT
        dy = Y - cy
        r = np.sqrt(dx * dx + dy * dy) + 1e-3
        a = np.arctan2(dy, dx)
        v = 0.5 + 0.5 * np.sin(a * 6 + r * 0.9 - f * 0.45)
        st.ramp(v * clamp01(1.25 - r / 26), p=MAIN, inten=0.8)
        for k in range(7):
            ring(st, cx, cy, 3 + k * 3.4 + 1.5 * np.sin(f * 0.12 + k * 0.8), CYAN if k % 2 else HI,
                 0.65 - k * 0.05, "░")
        if (f // 40) % 2 == 0:
            big_text(st, "TRANCE", 9, 9, HI, 0.8, x0=26, cols=76)
        else:
            big_text(st, "TRANCE", 9, 9, CYAN, 0.55, x0=26, cols=76)


# ================================================================== 5. ISOLATION
_rngn = np.random.default_rng(17)
NN = 30
NODES = np.stack([_rngn.uniform(5, COLS - 5, NN), _rngn.uniform(2, ROWS - 2, NN)], 1)
EDGES = []
for _i in range(NN):
    _d = np.hypot((NODES[:, 0] - NODES[_i, 0]) * 0.5, NODES[:, 1] - NODES[_i, 1])
    for _j in np.argsort(_d)[1:3]:
        if _i < int(_j):
            EDGES.append((_i, int(_j)))


@lru_cache(maxsize=32)
def heart_img(cols, rows, ss=4):
    Wp, Hp = cols * ss, rows * ss
    img = Image.new("L", (Wp, Hp), 0)
    d = ImageDraw.Draw(img)
    tt = np.linspace(0, 2 * np.pi, 600)
    x = 16 * np.sin(tt) ** 3
    y = 13 * np.cos(tt) - 5 * np.cos(2 * tt) - 2 * np.cos(3 * tt) - np.cos(4 * tt)
    x = x / 17.0
    y = y / 17.0
    pts = [(Wp / 2 + a * Wp * 0.47, Hp / 2 - b * Hp * 0.47) for a, b in zip(x, y)]
    d.polygon(pts, fill=255)
    # 填内部空洞：从四边泛洪，泛不到的地方就是洞
    a = np.asarray(img, np.uint8).copy()
    free = (a < 128)
    seen = np.zeros_like(free)
    stack = []
    for xx in range(Wp):
        for yy in (0, Hp - 1):
            if free[yy, xx] and not seen[yy, xx]:
                stack.append((yy, xx))
    for yy in range(Hp):
        for xx in (0, Wp - 1):
            if free[yy, xx] and not seen[yy, xx]:
                stack.append((yy, xx))
    while stack:
        cy_, cx_ = stack.pop()
        if seen[cy_, cx_] or not free[cy_, cx_]:
            continue
        seen[cy_, cx_] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy_ + dy, cx_ + dx
            if 0 <= ny < Hp and 0 <= nx < Wp and not seen[ny, nx] and free[ny, nx]:
                stack.append((ny, nx))
    holes = free & ~seen
    if holes.any():
        a[holes] = 255
    return Image.fromarray(a)


def act_isolation(st, f, ctx):
    ctx.state_name = "ISOLATE"
    ctx.load = 0.55

    if f < A["compl"]:
        # VIBRATIONS
        t = prog(f, A["vib"], A["compl"])
        st.clear()
        for k in range(7):
            y0 = 2.5 + k * 3.2
            x = np.arange(st.cols, dtype=np.float32)
            amp = (1.2 + 2.6 * ctx.b(f, k * 18, k * 18 + 18)) * (0.5 + 0.7 * t)
            yy = y0 + np.sin(x * (0.3 + k * 0.09) + f * (0.35 + k * 0.07)) * amp
            plot_curve(st, x, yy, CYAN if k % 2 else MAIN, 0.6 + 0.35 * t,
                       "█" if k == 3 else "─", glow=0.25)
        st.text(2, 1, "SIGNAL / VIBRATION BUS", CYAN, 0.85)
        st.text(2, 2, f"GAIN {int(30 + 70 * t):3d}%", AMBER, 0.9)
        st.ctext(24, "FEEL YOUR VIBRATIONS", MID, 0.75)

    elif f < A["left"]:
        # COMPLETION
        t = prog(f, A["compl"], A["left"])
        cx, cy = 63.5, 13.0
        arc(st, cx, cy, 9, -np.pi / 2, -np.pi / 2 + 2 * np.pi * clamp01(t * 1.25), HI, 0.95, "█")
        ring(st, cx, cy, 11.5, DEEP, 0.45, "·")
        st.ctext(1, f"COMPLETION  {int(t * 100):3d}%", HI, 1.0)
        st.ctext(24, "FINALLY BE COMPLETION", MID, 0.8)
        if t > 0.97:
            for k in range(3):
                ring(st, cx, cy, 4 + k * 4, HI, 0.6, "░")

    elif f < A["iso"]:
        # you have left —— 节点逐个断开
        t = prog(f, A["left"], A["iso"])
        st.clear()
        rain_bg(st, f, ctx, DEEP, 0.5, 0.10, seed=131)
        ncut = int(len(EDGES) * clamp01(t * 1.15))
        alive = np.zeros(NN)
        for k, (i, j) in enumerate(EDGES):
            if k < ncut:
                continue
            alive[i] += 1
            alive[j] += 1
            line_ch(st, NODES[i, 0], NODES[i, 1], NODES[j, 0], NODES[j, 1], DEEP, 0.55, "·")
        for i in range(NN):
            x, y = NODES[i]
            if alive[i] > 0:
                st.put(int(x), int(y), cid("●"), HI if alive[i] > 1 else MID, 0.9)
            else:
                drift = (f - A["left"]) * 0.05
                st.put(int(x + np.sin(i + drift) * 3), int(y - drift * (0.3 + rnd(i, 0, 5))),
                       cid("○"), DEEP, max(0.12, 0.5 - t * 0.4))
        st.text(2, 1, f"PEERS {int(NN * (1 - t)):2d} / {NN}", AMBER, 0.9)
        st.text(2, 2, f"EDGES {len(EDGES) - ncut:2d} / {len(EDGES)}", DEEP, 0.7)
        st.ctext(24, "YOU HAVE LEFT, YOU HAVE LEFT...", MID, 0.8)
        if t > 0.7:
            scramble(st, f, (t - 0.7) * 0.3, seed=141)

    elif f < A["frag"]:
        # ISOLATION
        t = prog(f, A["iso"], A["frag"])
        st.clear()
        cx, cy = 63.5, 13.0
        st.put(int(cx), int(cy), cid("●"), HI, 1.0)
        for k in range(4):
            ring(st, cx, cy, 2 + k * 5 + t * 12, DEEP, 0.35 - k * 0.06, "·")
        st.ctext(2, "1 NODE / 0 PEERS", AMBER, 0.95)
        st.ctext(24, "ISOLATION", MID, 0.9)
        for k in range(30):
            a = rnd(k, 0, 8) * 6.28
            rr = 8 + rnd(k, 1, 8) * 40 * (0.3 + t)
            st.put(int(cx + np.cos(a) * rr), int(cy + np.sin(a) * rr * ASPECT), cid("·"), DEEP, 0.25)

    elif f < A["dis"]:
        # FRAGMENTS
        t = prog(f, A["frag"], A["dis"])
        Y, X = st.Y, st.X
        v = fbm(X * 0.18 + f * 0.02, Y * 0.18, 41, 3)
        st.ramp(v * (1 - t), p=MAIN, inten=0.55)
        for k in range(int(400 * (1 - t))):
            x = rnd(k, 1, 6) * st.cols
            y = rnd(k, 2, 6) * st.rows
            st.put(int(x), int(y), cid("▪"), AMBER, 0.6 * (1 - t))
        st.text(2, 1, f"PURGE {int(t * 100):3d}%", AMBER, 0.9)
        st.text(2, 2, f"BYTES {int((1 - t) * 4096):4d}", DEEP, 0.7)
        st.ctext(24, "ERASE ALL THE POINTLESS FRAGMENTS", MID, 0.8)
        if t > 0.6:
            scramble(st, f, (t - 0.6) * 0.8, seed=151)

    elif f < A["illegal"]:
        # DISHEARTENED —— 心碎
        t = prog(f, A["dis"], A["illegal"])
        st.clear()
        cw, chh = 44, 24
        x0, y0 = 42, 2
        st.image(heart_img(cw, chh), x0, y0, cw, chh, MAIN,
                 ramp_ids=RAMP_DENSE_ID, inten=0.85)
        # 心形保持完整：不打洞，只用一条向下的裂纹 + 外侧掉落的碎屑来表现"心碎"
        for k in range(int(chh * min(1.0, 0.18 + t * 0.75))):
            xx = x0 + cw // 2 + int(round(np.sin(k * 0.8) * 1.6))
            yy = y0 + 7 + k
            st.put(xx, yy, cid("│"), RED2, 0.75)
            st.put(xx - 1, yy, cid("·"), RED2, 0.35)
        for k in range(int(24 + 90 * t)):
            a = rnd(k, 1, 22) * 6.28
            rr = 11 + rnd(k, 2, 22) * 8 + t * 20
            xx = 63.5 + np.cos(a) * rr
            yy = 13 + np.sin(a) * rr * ASPECT + t * 14 * rnd(k, 3, 22)
            st.put(int(xx), int(yy), cid("▪" if k % 3 else "·"),
                   RED if k % 4 else AMBER, 0.55 * (1 - t * 0.45))
        st.text(2, 1, "STATE / DEGRADED", RED, 0.9)
        st.text(2, 2, f"HEART_INTEGRITY {int((1 - t) * 100):3d}%", AMBER, 0.9)
        st.text(2, 4, f"ERR 0x1F / DISHEARTENED", DEEP, 0.65)
        if t > 0.55:
            st.ctext(24, "YOU WON'T LEAVE ME SO DISHEARTENED", MID, 0.85)

    else:
        # ILLEGAL ARGUMENTS
        t = prog(f, A["illegal"], A["break_end"])
        st.clear()
        for k in range(26):
            y = int((k * 1.6 + f * 0.6) % st.rows)
            msg = "ILLEGAL ARGUMENT 0x" + hexrow(4, k + f // 10) + "  >>  REJECTED"
            x = int((rnd(k, 0, 9) * 40 - f * 2.4) % (st.cols + 40)) - 20
            st.text(x, y, msg, RED if k % 3 else RED2, 0.55 + 0.35 * rnd(k, 1, 9))
        big_text(st, "ILLEGAL", 3, 8, RED, 0.95, x0=8, cols=112)
        big_text(st, "ARGUMENTS", 13, 8, RED, 0.85, x0=8, cols=112)
        st.ctext(1, "ERR 0x1F / CHALLENGING YOUR GOD", AMBER, 0.95)
        scramble(st, f, 0.35, seed=161)
        if ctx.k(f) > 0.3:
            st.i = np.clip(st.i * 1.6, 0, 1)


# ================================================================== 6. BREAK
def act_break(st, f, ctx):
    """ILLEGAL 之后到 12 连 EXECUTION 之前：崩溃 → 黑场 → 蓄力。"""
    ctx.state_name = "HALT"
    ctx.load = 0.12
    t = prog(f, A["illegal"] + 80, A["break_end"])
    st.clear()

    if t < 0.22:
        q = t / 0.22
        for k in range(20):
            y = int((k * 2 + f * 0.4) % st.rows)
            x = int((rnd(k, 0, 9) * 50 - f * 3.2) % (st.cols + 40)) - 20
            st.text(x, y, "ERR 0x1F >> REJECTED", RED, 0.6 * (1 - q))
        big_text(st, "ILLEGAL", 6, 9, RED, 0.9 * (1 - q), x0=8, cols=112)
        scramble(st, f, 0.5 * (1 - q), seed=171)
        st.i = np.clip(st.i * (1 + q * 2), 0, 1)

    elif t < 0.42:
        q = prog(t, 0.22, 0.42)
        st.ctext(12, "S Y S T E M   H A L T E D", RED2, 0.8 * (1 - q * 0.6))
        st.ctext(14, f"0x{hexrow(8, 3)}  0x{hexrow(8, 4)}", DEEP, 0.5)
        if (f // 10) % 2 == 0:
            st.put(2, 1, cid("█"), MID, 0.6)

    elif t < 0.72:
        q = prog(t, 0.42, 0.72)
        # 一颗心在跳
        beat = ((f % 42) / 42.0)
        pulse = np.exp(-((beat - 0.12) ** 2) * 260) + 0.7 * np.exp(-((beat - 0.34) ** 2) * 260)
        ring(st, 63.5, 13.5, 2 + 2.5 * pulse, RED, 0.5 + 0.5 * pulse, "●")
        st.ctext(20, "PROCESS UNRESPONSIVE", DEEP, 0.55)
        st.text(2, 1, "RECOVER?", MID, 0.7)
        if (f // 14) % 2 == 0:
            st.put(12, 1, cid("█"), HI, 0.85)
        st.ctext(4, f"T - {int((1 - q) * 12) + 1:02d}", AMBER, 0.6)

    else:
        q = prog(t, 0.72, 1.0)
        # 蓄力：计数器冲向 0
        n = int((1 - q) ** 2 * 999)
        big_text(st, f"{n:03d}", 6, 12, RED if q > 0.7 else AMBER, 0.5 + 0.5 * q, x0=34, cols=60)
        for k in range(int(6 + 40 * q)):
            x = int(rnd(k, f // 2, 11) * st.cols)
            y = int(rnd(k, f // 2 + 1, 11) * st.rows)
            st.put(x, y, cid("▓"), RED, 0.3 + 0.6 * q)
        if q > 0.86:
            scramble(st, f, (q - 0.86) * 3.0, seed=181)
        st.ctext(1, "EXECUTION QUEUED", AMBER, 0.9)
        st.ctext(24, "12 x EXECUTION", MID, 0.7 * q)


# ================================================================== 7. CLIMAX
NUM = [("EIN", "一", "DE"), ("DOS", "二", "ES"), ("TROIS", "三", "FR"),
       ("NE", "四", "KO"), ("FEM", "五", "SV"), ("LIU", "六", "ZH")]
NUMS = [("1", "EIN", "DE"), ("2", "DOS", "ES"), ("3", "TROIS", "FR"),
        ("4", "NE", "KO"), ("5", "FEM", "SV"), ("6", "LIU", "ZH")]
NUM_F = []


def _init_numf():
    if NUM_F:
        return
    for w, _, _ in NUM:
        l = LY.by_text(w)
        NUM_F.append(l["f0"] if l else 0)


_LAYERS = [5, 9, 9, 5]


def _net_pos():
    pos = []
    for li, n in enumerate(_LAYERS):
        x = 26 + li * 26
        for k in range(n):
            y = 3 + (k + 0.5) * 22.0 / n
            pos.append((x, y))
    return pos


NET = _net_pos()


def act_climax(st, f, ctx):
    ctx.state_name = "CLIMAX"
    ctx.load = 0.92
    _init_numf()

    if f < A["ein"]:
        # ---- 12 连 EXECUTION
        k = 0
        for i, c in enumerate(CHANTS):
            if f >= c:
                k = i
        age = f - CHANTS[k]
        st.clear()
        Y, X = st.Y, st.X
        v = 0.5 + 0.5 * np.sin(X * 0.45 + Y * 0.8 + f * 0.5)
        st.ramp(v * 0.20, p=RED2, inten=0.45)
        # 冲击波
        if age < 22:
            ring(st, 63.5, 13.5, 4 + age * 2.6, RED, 0.9 - age * 0.04, "░")
        big_text(st, "EXECUTION", 7, 11, HI, 1.0, x0=14, cols=100)
        big_text(st, "EXECUTION", 7, 11, RED, 0.55, x0=14, cols=100)
        st.hline(19, 14, 113, "═", RED, 0.9)
        # 12 格计数
        for i in range(12):
            st.put(30 + i * 6, 21, cid("█" if i <= k else "░"),
                   RED if i <= k else GREY, 0.95 if i <= k else 0.5)
        st.text(2, 1, f"EXECUTION {k + 1:02d}/12", AMBER, 0.95)
        st.text(96, 1, f"T+{f - CHANTS[0]:04d}", DEEP, 0.6)
        st.ctext(24, "T H E   O N L Y   E X E C U T I O N", RED, 0.8)

    elif f < A["give_all"]:
        # ---- 报数
        k = 0
        for i, c in enumerate(NUM_F):
            if f >= c:
                k = i
        age = f - NUM_F[k]
        st.clear()
        Y, X = st.Y, st.X
        v = 0.5 + 0.5 * np.sin(X * 0.3 + Y * 0.5 - f * 0.25)
        st.ramp(v * 0.28, p=DEEP, inten=0.4)
        num, word, lang = NUMS[k]
        big_text(st, num, 0, 17, HI, 1.0, x0=40, cols=48)
        big_text(st, word, 17, 6, AMBER, 0.95, x0=30, cols=68)
        st.text(2, 1, f"COUNT {k + 1} / 6", CYAN, 0.9)
        st.text(108, 1, f"LANG {lang}", DEEP, 0.75)
        for i in range(6):
            x = 4 + i * 21
            done = i <= k
            big_text(st, NUMS[i][0], 26, 2, HI if done else DIM, 0.9 if done else 0.3, x0=x, cols=10)
            st.text(x + 1, 25, NUMS[i][1], AMBER if i == k else DEEP, 0.9 if i == k else 0.5)
        if age < 5:
            st.i = np.clip(st.i * 1.4, 0, 1)

    elif f < A["trapped2"]:
        # ---- give them all / only / run
        if f < A["only"]:
            t = prog(f, A["give_all"], A["only"])
            st.clear()
            n = int(1 + t * 14)
            for i in range(n):
                r = np.random.default_rng(300 + i)
                x = int(r.integers(0, 92))
                y = int(r.integers(0, 22))
                big_text(st, "EXECUTION", y, 5, RED if i % 2 else RED2, 0.45 + 0.3 * r.random(),
                         x0=x, cols=34)
            big_text(st, "EXECUTION", 8, 10, HI, 1.0, x0=18, cols=92)
            st.ctext(1, "GIVE THEM ALL", AMBER, 0.9)
        elif f < A["runexec"]:
            t = prog(f, A["only"], A["runexec"])
            st.clear()
            for i in range(12):
                r = np.random.default_rng(400 + i)
                x = int(r.integers(0, 92))
                y = int(r.integers(0, 22))
                big_text(st, "EXECUTION", y, 5, RED2, 0.3, x0=x, cols=34)
                if i < int(t * 13):
                    big_text(st, "X", y + 1, 5, RED, 0.85, x0=x + 12, cols=9)
            big_text(st, "EXECUTION", 7, 11, HI, 1.0, x0=20, cols=88)
            st.ctext(1, "ONLY", AMBER, 0.95)
            st.ctext(2, f"TARGET LOCK {int(t * 100):3d}%", CYAN, 0.9)
            for k in range(2):
                st.box(16 - k * 2, 5 - k, 111 + k * 2, 22 + k, RED, 0.5 - k * 0.15)
        else:
            t = prog(f, A["runexec"], A["trapped2"])
            st.clear()
            for x in range(0, st.cols, 3):
                if rnd(x, f // 2, 5) > 0.55:
                    st.put(x, int(rnd(x, 0, 5) * st.rows), cid("│"), DEEP, 0.45)
            big_text(st, "RUN", 0, 8, AMBER, 0.9, x0=12, cols=34)
            big_text(st, "EXECUTION", 8, 10, HI, 1.0, x0=16, cols=96)
            st.ctext(20, "IF I CAN HAVE YOU BACK", MID, 0.85)
            st.ctext(22, f"[ {'█' * int(t * 26)}{'░' * (26 - int(t * 26))} ]", HI, 0.9)
            if ctx.k(f) > 0.3:
                scramble(st, f, 0.12, seed=201)

    elif f < A["studied"]:
        # ---- trapped again
        t = prog(f, A["trapped2"], A["studied"])
        st.clear()
        Y, X = st.Y, st.X
        horizon = 4
        yy = Y - horizon
        m = yy > 0
        z = 5.0 / (yy + 0.5)
        wx = (X - 63.5) * z * 0.20
        wz = z * 1.4 + f * 1.6
        on = (np.abs(((wx + 0.5) % 1.0) - 0.5) < 0.10) | (np.abs(((wz + 0.5) % 1.0) - 0.5) < 0.10)
        inten = np.where(on, 0.18 + 0.45 * clamp01(1.3 - z / 6), 0.0)
        st.ch[m] = np.where(on[m], CH2ID["─"], CH2ID[" "]).astype(np.int16)
        st.p[m] = RED2
        st.i[m] = np.maximum(st.i[m], inten[m])
        for k in range(5):
            q = clamp01(t * 1.5 - k * 0.12)
            x0 = int(2 + (60 - k * 11) * (1 - q))
            y0 = int(1 + (11 - k * 2.2) * (1 - q))
            if st.cols - 1 - x0 - x0 > 3 and st.rows - 1 - y0 - y0 > 2:
                st.box(x0, y0, st.cols - 1 - x0, st.rows - 1 - y0, RED if k == 0 else RED2, 0.4 + 0.12 * k)
        big_text(st, "TRAPPED", 9, 9, RED, 0.95, x0=22, cols=84)
        st.ctext(1, "WE ARE TRAPPED, AH...", AMBER, 0.9)

    elif f < A["qme"]:
        # ---- I've studied how to properly love：机器学习崩坏
        t = prog(f, A["studied"], A["qme"])
        st.clear()
        rain_bg(st, f, ctx, DEEP, 0.5, 0.08, seed=211)
        layer_idx = []
        idx = 0
        for n in _LAYERS:
            layer_idx.append(list(range(idx, idx + n)))
            idx += n
        act = 0.55 + 0.45 * np.sin(f * 0.22)
        broken = t > 0.60
        for li in range(len(_LAYERS) - 1):
            for a in layer_idx[li]:
                for b in layer_idx[li + 1]:
                    x0, y0 = NET[a]
                    x1, y1 = NET[b]
                    w = rnd(a, b, 61)
                    if w < 0.32:
                        continue
                    if broken and rnd(a, b, 62) < (t - 0.60) * 3.0:
                        st.put(int(x0 + (x1 - x0) * 0.5), int(y0 + (y1 - y0) * 0.5), cid("×"), RED, 0.9)
                        continue
                    line_ch(st, x0, y0, x1, y1, CYAN if w > 0.7 else MID,
                            0.30 + 0.45 * act * w, "·")
        for lst in layer_idx:
            for a in lst:
                x, y = NET[a]
                on = rnd(a, f // 4, 63) > 0.4
                st.put(int(x), int(y), cid("●" if on else "○"), HI if on else MID, 0.95 if on else 0.55)
                st.put(int(x) + 1, int(y), cid("─"), CYAN if on else DEEP, 0.4)
        loss = max(0.0, 1.0 - t * 1.15)
        st.text(2, 0, "TRAINING / LOVE(USER)", CYAN, 0.9)
        st.text(2, 1, f"LOSS {('NaN' if broken else f'{loss:.4f}')}", AMBER if not broken else RED, 0.95)
        st.text(2, 2, f"EPOCH {int(t * 9999):05d}", DEEP, 0.7)
        st.text(100, 0, "LR 0.001", DEEP, 0.65)
        if broken:
            st.text(98, 1, "GRAD EXPLODED", RED, 0.95)
            scramble(st, f, (t - 0.60) * 1.4, seed=221, p=RED2)
        st.ctext(25, "STUDIED HOW TO PROPERLY LOVE", MID, 0.85)

    elif f < A["love2"]:
        # ---- Question me
        t = prog(f, A["qme"], A["love2"])
        st.clear()
        panel(st, 4, 2, 124, 22, DEEP, 0.5, "LOVE / Q&A")
        qs = ["Q: what is love?", "Q: define love.", "Q: answer all love."]
        k = min(2, int(t * 3))
        big_text(st, qs[k], 4, 3, HI, 0.95, x0=8, cols=112)
        ans = ["A: love = f(user) -> converge",
               "A: love(x) = argmax 1/t  (t -> INF)",
               "A: all answers exist. none are correct."]
        n = int(clamp01((t * 3) % 1) * len(ans[k]))
        st.text(8, 8, ans[k][:n], MAIN, 0.9)
        if (f // 10) % 2 == 0:
            st.put(8 + n, 8, cid("█"), HI, 0.85)
        st.text(8, 11, "algebraic expression of LOVE:", CYAN, 0.9)
        st.text(8, 20, f"tokens {int(t * 1024):4d}  /  ctx 1M", DEEP, 0.65)

    elif f < A["free"]:
        # ---- 代数表达式
        t = prog(f, A["love2"], A["free"])
        st.clear()
        Y, X = st.Y, st.X
        v = 0.5 + 0.5 * np.sin(X * 0.2 + Y * 0.4 + f * 0.15)
        st.ramp(v * 0.22, p=DEEP, inten=0.4)
        big_text(st, "LOVE(x) = (1/x)", 3, 8, HI, 1.0, x0=6, cols=116)
        big_text(st, "lim 1/t, t->INF", 12, 8, HI, 0.95, x0=6, cols=116)
        st.ctext(22, "I KNOW THE ALGEBRAIC EXPRESSION OF LOVE", MID, 0.85)

    else:
        # ---- 心形重建
        t = prog(f, A["free"], A["climax_end"])
        st.clear()
        Y, X = st.Y, st.X
        v = 0.4 + 0.6 * fbm(X * 0.1, Y * 0.1 + f * 0.01, 71, 3)
        st.ramp(v * 0.30, p=DEEP, inten=0.4)
        cw, chh = 46, 24
        x0, y0 = 41, 2
        beat = (f % 40) / 40.0
        pulse = np.exp(-((beat - 0.10) ** 2) * 300) + 0.6 * np.exp(-((beat - 0.30) ** 2) * 300)
        img = heart_img(cw, chh)
        a = np.asarray(img.resize((cw, chh), Image.BOX), np.float32) / 255.0
        reveal = clamp01(t * 1.5)
        rows_ = np.arange(chh)[:, None]
        mask = (chh - rows_) <= reveal * chh * 1.02
        st.image(np.where(mask, a, 0.0), x0, y0, cw, chh, MAIN,
                 ramp_ids=RAMP_DENSE_ID, inten=0.75 + 0.25 * pulse)
        st.text(2, 1, "ETERNAL_WHILE_TRUE", CYAN, 0.9)
        st.text(2, 2, "{ LOVE(USER); }", HI, 0.95)
        st.text(2, 4, f"INTEGRITY {int(min(1.0, t * 1.5) * 100):3d}%", AMBER, 0.9)
        if t > 0.6:
            q = prog(f, A["free"] + int((A["climax_end"] - A["free"]) * 0.6), A["climax_end"])
            big_text(st, "LOVE", 21, 5, HI, q, x0=44, cols=40)


MINE_TAPE = "MINE  MINE  MINE  "


def yandere_overlay(st, f, ctx):
    """后半段贯穿的占有欲底纹：上下两条滚动的 MINE 红带 + 向内收紧的角标 + 心跳环。"""
    k = ctx.k(f)
    off = int(f * 1.7)
    row0, row1 = 0, st.rows - 1
    for i in range(st.cols):
        ch = MINE_TAPE[(i + off) % len(MINE_TAPE)]
        if ch != " ":
            st.put(i, row0, cid(ch), RED2, 0.34)
            st.put(st.cols - 1 - i, row1, cid(ch), RED2, 0.26)
    # 四角
    for cx, cy, sx, sy in ((0, 0, 1, 1), (st.cols - 1, 0, -1, 1),
                           (0, st.rows - 1, 1, -1), (st.cols - 1, st.rows - 1, -1, -1)):
        for i in range(4):
            st.put(cx + sx * i, cy + sy * 0, cid("═"), RED, 0.55)
            st.put(cx + sx * 0, cy + sy * i, cid("║"), RED, 0.55)
    # 心跳环
    rr = 13 + 5 * k
    ring(st, st.cols / 2 - 0.5, st.rows / 2 - 0.5, rr, RED2, 0.22 + 0.45 * k, "·")


# ================================================================== 8. OUTRO
def act_outro(st, f, ctx):
    D = design
    ctx.state_name = "END"
    ctx.load = 0.35
    f_last = A["last"]
    if f < f_last - 3:
        t = prog(f, A["climax_end"], f_last)
        st.clear()
        rain_bg(st, f, ctx, DEEP, 0.35, 0.09, seed=301)
        q = clamp01(t * 1.35)
        pct = min(99, int(q * 99))
        beat = (f % 46) / 46.0
        pulse = np.exp(-((beat - 0.10) ** 2) * 260)
        s9 = f"{pct:02d}"
        D.seg7(st, s9, (st.cols - D.seg7_w(s9, 9)) // 2, 1,
               HI if pct < 99 else RED, 0.72 + 0.28 * pulse, w=9, h=11)
        D.label(st, (st.cols + D.seg7_w(s9, 9)) // 2 + 3, 5, "%", MID, 0.8)
        y = 16
        w = 118
        for x in range(w):
            on = (x / w) < q
            seg = (x // 6) % 2 == 0
            ch = "█" if on else ("░" if seg else "▒")
            st.put(5 + x, y, cid(ch), (HI if on else DIM), (0.95 if on else 0.28))
        D.label(st, 5, 15, "PROCESS", DIM, 0.5)
        D.label(st, 5 + w - 8, 15, f"{pct}%", HI, 0.85)
        st.ctext(16, "world.execute(me);", AMBER if pct >= 99 else MID, 0.9)
        if pct >= 99:
            st.ctext(18, "STALLED -- AWAITING INPUT", RED, 0.9)
            if (f // 12) % 2 == 0:
                st.put(5 + w + 1, y, cid("█"), HI, 0.9)
        st.text(2, 1, f"PROCESS {int(4096 * q):4d} / 4096", DEEP, 0.7)
        st.text(104, 1, "LOOP TRUE", DEEP, 0.7)
        st.text(2, 2, "EXECUTING...", MID, 0.85)

    elif f < f_last + 42:
        q = prog(f, f_last, f_last + 42)
        st.clear()
        Y, X = st.Y, st.X
        v = 0.5 + 0.5 * np.sin(X * 0.4 + Y * 0.7 + f * 0.4)
        st.ramp(v * 0.22, p=RED2, inten=0.5)
        big_text(st, "EXECUTION", 6, 13, RED, 1.0, x0=10, cols=108)
        big_text(st, "EXECUTION", 6, 13, HI, 0.30 * (1 - q), x0=10, cols=108)
        st.hline(20, 10, 117, "═", RED, 0.95)
        if q < 0.22:
            st.i = np.clip(st.i * 1.7, 0, 1)

    else:
        q = prog(f, f_last + 42, f_last + 130)
        st.clear()
        rain_bg(st, f, ctx, DEEP, 0.18, 0.05, seed=311)
        big_text(st, "PROCESS", 1, 6, HI, 1.0, x0=6, cols=116)
        big_text(st, "ENDED.", 7, 6, HI, 1.0, x0=6, cols=116)
        big_text(st, "THE LOOP", 14, 6, RED, 1.0, x0=6, cols=116)
        big_text(st, "REMAINS.", 20, 6, RED, 1.0, x0=6, cols=116)
        if q > 0.45:
            st.ctext(25, "world.execute(me);", DEEP, 0.6)
        if f > f_last + 190:
            st.i *= max(0.0, 1 - prog(f, f_last + 190, f_last + 300) * 0.7)


