"""版式系统：安全区、字距标签、发丝线、点阵底、对位刻度。

整个片子只用这一套度量，所有场景都往它上面排。
"""
import numpy as np

from .core import (cid, CH2ID, RAMP_ID, clamp01, rnd,
                   DIM, DEEP, MID, MAIN, HI, RED, RED2, GREY, PAL_NP, COLS)

# ---- 安全区（舞台是 27 行 × 128 列）------------------------------------
L = 3
R = 124
T = 2
B = 25

# ---- 字号（单元格）------------------------------------------------------
CAP = 1      # 说明文字
DIS = 2      # 小标题
HEAD = 3     # 大标题
HERO = 6     # 主视觉


def label(st, x, y, text, p=DIM, inten=0.55, track=1, upper=True):
    """加字距的大写标签，返回结束列。"""
    if upper:
        text = text.upper()
    cx = x
    for ch in text:
        if ch == " ":
            cx += 3 + track
            continue
        st.put(cx, y, cid(ch), p, inten)
        cx += 1 + track
    return cx


def label_w(text, track=1):
    n = sum(3 + track if ch == " " else 1 + track for ch in text)
    return n - 1


def rule(st, y, x0=L, x1=R, p=DIM, inten=0.34, cap=False):
    st.hline(y, x0, x1, "─", p, inten)
    if cap:
        st.put(x0, y, cid("├"), p, inten)
        st.put(x1, y, cid("┤"), p, inten)


def dotgrid(st, inten=0.09, sx=4, sy=2, p=DIM, y0=T, y1=B):
    """极淡的点阵：给画面一个"纸"的底，但不抢戏。"""
    for y in range(y0, y1 + 1, sy):
        for x in range(L + 1, R, sx):
            st.put(x, y, cid("·"), p, inten)


def corner_marks(st, inten=0.30, p=DIM, n=2):
    for x0, y0, dx, dy in ((L - 1, T - 1, 1, 1), (R + 1, T - 1, -1, 1),
                           (L - 1, B + 1, 1, -1), (R + 1, B + 1, -1, -1)):
        for i in range(n):
            st.put(x0 + dx * i, y0, cid("─"), p, inten)
            st.put(x0, y0 + dy * i, cid("│"), p, inten)


def leader(st, x0, x1, y, p=DIM, inten=0.30):
    """引导点：把左右两栏连起来"""
    for x in range(x0, x1 + 1, 2):
        st.put(x, y, cid("·"), p, inten)


def kv_row(st, y, key, val, x_key=L, x_val=R, p_key=MID, p_val=HI,
           ik=0.75, iv=0.95, track=0):
    label(st, x_key, y, key, p_key, ik, track)
    for i, ch in enumerate(val):
        st.put(x_val - (len(val) - 1 - i), y, cid(ch), p_val, iv)


def meter(st, y, x0, x1, q, p=MID, p_hi=MAIN, inten=0.75, ch="▓", bg="░"):
    n = x1 - x0 + 1
    for i in range(n):
        on = (i / n) < q
        st.put(x0 + i, y, cid(ch if on else bg), p_hi if on else DIM, inten if on else 0.20)


def cross(st, x, y, r=1, p=MID, inten=0.6):
    st.put(x, y, cid("+"), p, inten)
    for i in range(1, r + 1):
        st.put(x - i, y, cid("─"), p, inten * 0.6)
        st.put(x + i, y, cid("─"), p, inten * 0.6)
        st.put(x, y - i, cid("│"), p, inten * 0.6)
        st.put(x, y + i, cid("│"), p, inten * 0.6)


def track_text(st, x, y, s, p, inten, track=1):
    cx = x
    for ch in s:
        st.put(cx, y, cid(ch), p, inten)
        cx += 1 + track
    return cx


def fade_edges(st, k=0.0):
    """把画面上下两端压暗，给版式一个呼吸的边。"""
    if k <= 0:
        return
    for y in range(st.rows):
        d = min(y, st.rows - 1 - y)
        if d < 2:
            st.i[y] *= (1 - k * (1 - d / 2.0))


# ---------------------------------------------------------------- 像素大字
from PIL import Image as _Im, ImageDraw as _Dr, ImageFont as _Fo
from .core import CW, CH, FONT_MONO_B, cjk_mask, FONT_CJK, CJK_INDEX
import os
FONT_BLACK = '/usr/share/fonts/TTF/JetBrainsMonoNerdFont-ExtraBold.ttf'
if not os.path.exists(FONT_BLACK):
    FONT_BLACK = FONT_MONO_B

_BIG_CACHE = {}
_BLK = " .:-=+*#%@"


def _big_cells(s, scale, cjk=False):
    """把一个字符拆成 scale×scale 个格子的覆盖率（0..1）。"""
    key = (s, scale, cjk)
    got = _BIG_CACHE.get(key)
    if got is not None:
        return got
    # 一个等宽字的宽高比是 15:30，所以 scale 行高的字要占 2*scale 列，
    # 否则字形会被横向压扁（之前"实心块"的字就是被压扁的）。
    gw, gh = 2 * CW * scale, CH * scale
    if cjk:
        a = cjk_mask(s)
        a = np.asarray(_Im.fromarray((a * 255).astype(np.uint8)).resize((scale * 2, scale), _Im.BOX), np.float32) / 255.0
    else:
        font = _Fo.truetype(FONT_BLACK, int(gh * 0.92))
        img = _Im.new("L", (gw, gh), 0)
        d = _Dr.Draw(img)
        try:
            d.text((1, int(gh * 0.90)), s, font=font, fill=255, anchor="ls")
        except Exception:
            d.text((1, int(gh * 0.90)), s, font=font, fill=255)
        a = np.asarray(_Im.fromarray(np.asarray(img)).resize(
            (2 * scale, scale), _Im.BOX), np.float32) / 255.0
    _BIG_CACHE[key] = a
    return a


def bigtype(st, s, x0, y0, scale, p, inten=1.0, ramp=None, min_cov=0.12):
    """大字：字形当骨架，笔画内部是同一档字符堆出来的。

    ASCII 大字要能读，关键是**笔画里的字符密度一致**——所以主体只用一档字（#），
    边缘才降到 + / :，而不是每个格子随机换字（那样字就散了）。
    """
    BODY, EDGE, HALO = "#", "+", ":"
    for k, ch in enumerate(s):
        if ch == " ":
            continue
        a = _big_cells(ch, scale)
        h, w = a.shape
        for yy in range(h):
            for xx in range(w):
                c = float(a[yy, xx])
                if c < min_cov:
                    continue
                if c >= 0.34:
                    g = "#%@" [(xx + yy * 3 + k * 5) % 3]
                else:
                    continue
                st.put(x0 + k * 2 * scale + xx, y0 + yy, cid(g), p, inten)


def bigtype_w(s, scale):
    return len(s) * 2 * scale


def bigtype_c(st, s, y0, scale, p, inten=1.0, ramp=None, min_cov=0.12):
    x = max(0, (st.cols - bigtype_w(s, scale)) // 2)
    bigtype(st, s, x, y0, scale, p, inten, ramp, min_cov)
    return x


def bigtype_cells(s, x0, y0, scale, min_cov=0.42):
    """返回 [(x, y, cov)]，给粒子重组用——和 bigtype 画出来的是同一批格子。"""
    out = []
    for k, ch in enumerate(s):
        if ch == " ":
            continue
        a = _big_cells(ch, scale)
        h, w = a.shape
        for yy in range(h):
            for xx in range(w):
                if a[yy, xx] >= min_cov:
                    out.append((x0 + k * scale + xx, y0 + yy, float(a[yy, xx])))
    return out


# ---------------------------------------------------------------- 七段数码管
_SEG = {
    "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
    "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcfgd",
    "-": "g", " ": "",
}


def seg7(st, s, x0, y0, p, inten=1.0, w=5, h=7, ch="#", ghost=None):
    """七段数码管。整片的数字都用它，机器感统一。"""
    hw = w // 2
    mid = h // 2
    for k, dgt in enumerate(s):
        segs = _SEG.get(dgt, "")
        ox = x0 + k * (w + 1)
        lit = set()
        for sg in segs:
            if sg == "a":
                lit.update((ox + i, y0) for i in range(1, w - 1))
            elif sg == "d":
                lit.update((ox + i, y0 + h - 1) for i in range(1, w - 1))
            elif sg == "g":
                lit.update((ox + i, y0 + mid) for i in range(1, w - 1))
            elif sg == "f":
                lit.update((ox, y0 + i) for i in range(1, mid))
            elif sg == "b":
                lit.update((ox + w - 1, y0 + i) for i in range(1, mid))
            elif sg == "e":
                lit.update((ox, y0 + i) for i in range(mid + 1, h - 1))
            elif sg == "c":
                lit.update((ox + w - 1, y0 + i) for i in range(mid + 1, h - 1))
        if ghost is not None:
            for i in range(w):
                for j in range(h):
                    if (ox + i, y0 + j) not in lit:
                        st.put(ox + i, y0 + j, cid("·"), ghost, 0.22)
        for (xx, yy) in lit:
            st.put(xx, yy, cid(ch), p, inten)


def seg7_w(s, w=5):
    return len(s) * (w + 1) - 1


# ---------------------------------------------------------------- 5×5 点阵字
# 自己画的，不用字体重采样：笔画直接落在格子上，放大 N 倍还是硬的。
_F5 = {
    "A": ".###.|#...#|#####|#...#|#...#",
    "B": "####.|#...#|####.|#...#|####.",
    "C": ".###.|#....|#....|#....|.###.",
    "D": "####.|#...#|#...#|#...#|####.",
    "E": "#####|#....|####.|#....|#####",
    "F": "#####|#....|####.|#....|#....",
    "G": ".###.|#....|#.###|#...#|.###.",
    "H": "#...#|#...#|#####|#...#|#...#",
    "I": "#####|..#..|..#..|..#..|#####",
    "J": "....#|....#|....#|#...#|.###.",
    "K": "#...#|#..#.|###..|#..#.|#...#",
    "L": "#....|#....|#....|#....|#####",
    "M": "#...#|##.##|#.#.#|#...#|#...#",
    "N": "#...#|##..#|#.#.#|#..##|#...#",
    "O": ".###.|#...#|#...#|#...#|.###.",
    "P": "####.|#...#|####.|#....|#....",
    "Q": ".###.|#...#|#.#.#|#..#.|.##.#",
    "R": "####.|#...#|####.|#..#.|#...#",
    "S": ".####|#....|.###.|....#|####.",
    "T": "#####|..#..|..#..|..#..|..#..",
    "U": "#...#|#...#|#...#|#...#|.###.",
    "V": "#...#|#...#|#...#|.#.#.|..#..",
    "W": "#...#|#...#|#.#.#|##.##|#...#",
    "X": "#...#|.#.#.|..#..|.#.#.|#...#",
    "Y": "#...#|.#.#.|..#..|..#..|..#..",
    "Z": "#####|...#.|..#..|.#...|#####",
    "0": ".###.|#..##|#.#.#|##..#|.###.",
    "1": "..#..|.##..|..#..|..#..|.###.",
    "2": ".###.|#...#|..##.|.#...|#####",
    "3": "####.|....#|.###.|....#|####.",
    "4": "#..#.|#..#.|#####|...#.|...#.",
    "5": "#####|#....|####.|....#|####.",
    "6": ".###.|#....|####.|#...#|.###.",
    "7": "#####|....#|...#.|..#..|..#..",
    "8": ".###.|#...#|.###.|#...#|.###.",
    "9": ".###.|#...#|.####|....#|.###.",
    ".": ".....|.....|.....|.....|..#..",
    ",": ".....|.....|.....|..#..|.#...",
    ":": ".....|..#..|.....|..#..|.....",
    ";": ".....|..#..|.....|..#..|.#...",
    "(": "...#.|..#..|..#..|..#..|...#.",
    ")": ".#...|..#..|..#..|..#..|.#...",
    "-": ".....|.....|#####|.....|.....",
    "_": ".....|.....|.....|.....|#####",
    "/": "....#|...#.|..#..|.#...|#....",
    "+": ".....|..#..|.###.|..#..|.....",
    "!": "..#..|..#..|..#..|.....|..#..",
    "?": ".###.|#...#|..##.|.....|..#..",
    " ": ".....|.....|.....|.....|.....",
}
_F5 = {k: [[1 if c == "#" else 0 for c in row] for row in v.split("|")] for k, v in _F5.items()}


def pixw(s, S=2, gap=1):
    return max(0, len(s) * (5 * S + gap) - gap)


def pixfont(st, s, x0, y0, S, p, inten=1.0, gap=1, fill=None):
    """5×5 点阵字放大 S 倍。fill 可按位置换字，做出字符纹理。"""
    cx = x0
    for k, ch in enumerate(s):
        g = _F5.get(ch.upper())
        if g is None:
            cx += 5 * S + gap
            continue
        for ry in range(5):
            for rx in range(5):
                if not g[ry][rx]:
                    continue
                gch = "#" if fill is None else fill(int((cx + rx * S) / max(1, S)), ry, k)
                for dy in range(S):
                    for dx in range(S):
                        st.put(cx + rx * S + dx, y0 + ry * S + dy, cid(gch), p, inten)
        cx += 5 * S + gap
    return cx


def pixfont_c(st, s, y0, S, p, inten=1.0, gap=1, fill=None):
    x = max(0, (st.cols - pixw(s, S, gap)) // 2)
    pixfont(st, s, x, y0, S, p, inten, gap, fill)
    return x


def pixcells(s, x0, y0, S, gap=1):
    out = []
    cx = x0
    for ch in s:
        g = _F5.get(ch.upper())
        if g is None:
            cx += 5 * S + gap
            continue
        for ry in range(5):
            for rx in range(5):
                if g[ry][rx]:
                    for dy in range(S):
                        for dx in range(S):
                            out.append((cx + rx * S + dx, y0 + ry * S + dy, 1.0))
        cx += 5 * S + gap
    return out
