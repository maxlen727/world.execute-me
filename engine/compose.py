"""界面外壳：HUD / 双语字幕 / 底部细带频谱。"""
import numpy as np

from .core import (COLS, ROWS, Frame, cid, MAIN, HI, MID, DEEP, DIM, CYAN, BLUE,
                   AMBER, RED, GREY, WHITE, PAL, clamp01, sstep)

STAGE_Y0 = 2
STAGE_ROWS = 27
RULE1 = 29
EN_ROW = 30
CN_ROW = 32
RULE2 = 34
SPEC_ROW = 35

SPEC_CH = "▁▂▃▄▅▆▇█"

STATE_NAMES = ["INIT", "BOOT", "SIM", "MATH", "SENSE", "ORGANIC", "ISOLATE",
               "CLIMAX", "EXEC", "END"]


def hud(frame, f, ctx):
    t = f / 30.0
    sec = int(t)
    cs = int((t - sec) * 100)
    mm = sec // 60
    ss = sec % 60

    # --- 第 0 行 ---
    frame.text(1, 0, "▓▒░ ALMA//ASCII-MV", DEEP, 0.55)
    frame.text(20, 0, "─" * 26, DIM, 0.30)
    state = ctx.state_name
    frame.text(49, 0, f"STATE {state}", CYAN if ctx.alert else MID, 0.85)
    frame.text(66, 0, "─" * 14, DIM, 0.30)

    right0 = "[ SYS 0x2A ]  TRACK 03 — MILI"
    frame.text(COLS - 1 - len(right0), 0, right0, GREY, 0.7)

    # --- 第 1 行 ---
    load = 32 + int(46 * ctx.load) + int(6 * np.sin(f * 0.05))
    load = max(0, min(99, load))
    bar = "▓" * (load // 8) + "░" * (12 - load // 8)
    frame.text(1, 1, f"MEM {2048 + int(ctx.load * 512)}K", DEEP, 0.6)
    frame.text(15, 1, bar, DEEP, 0.55)
    frame.text(29, 1, f"LOAD {load:02d}%", DEEP, 0.6)
    frame.text(41, 1, f"BUF {int(ctx.buf):02d}/16", DEEP, 0.55)
    frame.text(53, 1, f"GLYPH {COLS}x{STAGE_ROWS}", DEEP, 0.5)

    right1 = f"F {f:05d}/{ctx.total}   {mm:02d}:{ss:02d}.{cs:02d}"
    frame.text(COLS - 1 - len(right1), 1, right1, GREY, 0.72)

    # --- 舞台角标 ---
    y0, y1 = STAGE_Y0, STAGE_Y0 + STAGE_ROWS - 1
    frame.put(0, y0, cid("┌"), DEEP, 0.5)
    frame.put(COLS - 1, y0, cid("┐"), DEEP, 0.5)
    frame.put(0, y1, cid("└"), DEEP, 0.5)
    frame.put(COLS - 1, y1, cid("┘"), DEEP, 0.5)

    # --- 字幕框 ---
    frame.hline(RULE1, 1, COLS - 2, "─", DIM, 0.38)
    frame.put(0, RULE1, cid("├"), DIM, 0.4)
    frame.put(COLS - 1, RULE1, cid("┤"), DIM, 0.4)
    frame.text(2, RULE1 - 0, "", DIM, 0)

    # 字幕区左右细竖线
    for y in range(EN_ROW, RULE2 + 1):
        frame.put(0, y, cid("│"), DIM, 0.26)
        frame.put(COLS - 1, y, cid("│"), DIM, 0.26)


def subtitle(frame, line, f, typed=None, prompt=False, cue=False, term=False):
    """EN 卡拉OK（2 倍字）+ CN 稳定行（2 倍字）"""
    if prompt:
        s = "> world.execute(me);"
        frame.bigtext_c(EN_ROW, s, MID, 0.62, 1 if term else 2)
        if (f // 15) % 2 == 0:
            x = (COLS - len(s) * 2) // 2 + len(s) * 2
            frame.bigtext(x, EN_ROW, "█", HI, 0.9, 2)
        frame.bigtext_c(CN_ROW, "世界.执行（我）；", DEEP, 0.45, 2, cjk=True)
        return

    if typed is not None:
        frame.bigtext_c(EN_ROW, typed, MID, 0.75, 2)
        if (f // 8) % 2 == 0:
            x = (COLS - len(typed) * 2) // 2 + len(typed) * 2
            frame.bigtext(x, EN_ROW, "█", HI, 0.85, 2)
        return

    if line is None:
        return

    ws_ = line["words"]
    s = " ".join(w for (w, a, b) in ws_) if ws_ else line["en"]
    sc = 1 if term else 2
    x0 = max(0, (COLS - len(s) * sc) // 2)

    idx = 0
    for (w, a, b) in ws_:
        fa, fb = a * 30.0, b * 30.0
        kw = w.isupper() and len(w) > 2
        if cue:
            p, it = DEEP, 0.30
        elif f >= fb:
            p, it = (HI if kw else MAIN), 0.60
        elif f >= fa:
            p, it = (AMBER if kw else HI), 1.0
        else:
            p, it = MID, 0.55
        frame.bigtext(x0 + idx * sc, EN_ROW if not term else 31, w, p, it, sc)
        idx += len(w) + 1

    cn = "" if cue else (line.get("cn") or "")
    if cn:
        frame.bigtext_c(CN_ROW if not term else 32, cn, MAIN, 0.92, 1 if term else 2, cjk=True)




def spectrum(frame, bands_row, f, kick=0.0):
    n = COLS
    v = np.asarray(bands_row, np.float32)
    if v.size != n:
        v = np.interp(np.linspace(0, 1, n), np.linspace(0, 1, v.size), v)
    v = v * (0.95 + kick * 0.22)
    v = np.clip(v / max(float(v.max()), 0.55), 0, 1) ** 2.1
    for x in range(n):
        q = float(v[x])
        lvl = int(q * (len(SPEC_CH) - 1) + 0.5)
        if lvl <= 0:
            frame.put(x, SPEC_ROW, cid("·"), DIM, 0.16)
            continue
        r = x / (n - 1)
        if r < 0.35:
            p = MAIN
        elif r < 0.62:
            p = CYAN
        elif r < 0.82:
            p = BLUE
        else:
            p = AMBER
        frame.put(x, SPEC_ROW, cid(SPEC_CH[lvl]), p, 0.30 + 0.55 * q)
