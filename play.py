#!/usr/bin/env python3
"""在终端里播放这支 ASCII MV（ANSI 24bit 真彩 + 半格采样）。"""
import os
import sys
import time
import argparse
import subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from engine.core import COLS, ROWS, CHARS, PAL, Frame
from engine import compose, lyrics as LY
from engine import acts
from engine.acts import A, Ctx

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
TOTAL = 6358
ESC = "\x1b["


def section(f):
    if f < A["title"]:
        return "init"
    if f < A["verse2"]:
        return "title"
    if f < A["math_end"]:
        return "math"
    if f < A["sensory_end"]:
        return "sensory"
    if f < A["organic_end"]:
        return "organic"
    if f < A["illegal"] + 84:
        return "isolation"
    if f < A["break_end"]:
        return "break"
    if f < A["climax_end"]:
        return "climax"
    return "outro"


def build(st, main, ctx, f):
    st.clear()
    sec = section(f)
    {
        "init": acts.act_init, "title": acts.act_title, "math": acts.act_math,
        "sensory": acts.act_sensory, "organic": acts.act_organic,
        "isolation": acts.act_isolation, "break": acts.act_break,
        "climax": acts.act_climax, "outro": acts.act_outro,
    }[sec](st, f, ctx)

    main.clear()
    st.blit_into(main, compose.STAGE_Y0)
    ctx.alert = sec in ("break", "climax")
    compose.hud(main, f, ctx)
    ln = LY.line_at(f)
    if sec == "outro" and f < A["last"] - 2:
        compose.subtitle(main, None, f, prompt=True, term=True)
    elif ln is not None:
        compose.subtitle(main, ln, f, term=True)
    compose.spectrum(main, ctx.bands[int(np.clip(f, 0, TOTAL - 1))], f, ctx.k(f))


def to_text(main):
    """单元格 → 行字符串（含 ANSI 真彩）。CJK / 大字层按字符覆盖。"""
    rows = main.rows
    cols = main.cols
    # 覆盖表
    cover = {}
    for (x, y, chs, p, inten) in main.cjk_items:
        cover[(y, x)] = (chs, p, inten, 2)
    for (px, py, chs, p, inten, gw, gh, cjk) in main.glyphs:
        x = px // 15
        y = py // 30
        cover[(y, x)] = (chs, p, inten, 2 if cjk else 1)
    out = []
    for y in range(rows):
        buf = []
        x = 0
        while x < cols:
            c = cover.get((y, x))
            if c:
                chs, p, inten, w = c
                r, g, b = PAL[p]
                f = min(1.0, inten)
                buf.append(f"{ESC}38;2;{int(r * f)};{int(g * f)};{int(b * f)}m{chs}")
                x += w
                continue
            i = main.i[y, x]
            if i > 0.04:
                cid_ = main.ch[y, x]
                ch = CHARS[cid_] if 0 <= cid_ < len(CHARS) else " "
                r, g, b = PAL[main.p[y, x]]
                f = min(1.0, i)
                buf.append(f"{ESC}38;2;{int(r * f)};{int(g * f)};{int(b * f)}m{ch}")
            else:
                buf.append(" ")
            x += 1
        out.append("".join(buf) + f"{ESC}0m")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=float, default=0.0, help="起始秒")
    ap.add_argument("--end", type=float, default=None, help="结束秒")
    ap.add_argument("--no-audio", action="store_true")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--loop", action="store_true")
    a = ap.parse_args()

    z = np.load(os.path.join(HERE, "data", "analysis.npz"))
    ctx = Ctx(z)
    st = Frame(compose.STAGE_ROWS, COLS)
    main_ = Frame(ROWS, COLS)

    f0 = int(a.start * FPS)
    f1 = int((a.end * FPS) if a.end else TOTAL)

    audio = None
    if not a.no_audio:
        mp3 = os.path.join(HERE, "data", "audio.mp3")
        for cmd in (["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet",
                     "-ss", str(a.start), mp3],
                    ["mpv", "--no-video", "--really-quiet", f"--start={a.start}", mp3]):
            try:
                audio = subprocess.Popen(cmd, stdout=subprocess.DEVNULL,
                                         stderr=subprocess.DEVNULL)
                break
            except FileNotFoundError:
                continue
        if audio is None:
            print("(no ffplay/mpv found — playing silent)")

    sys.stdout.write(f"{ESC}?25l{ESC}2J")
    t0 = time.time()
    try:
        for f in range(f0, f1):
            build(st, main_, ctx, f)
            lines = to_text(main_)
            sys.stdout.write(f"{ESC}H" + "\n".join(lines))
            sys.stdout.flush()
            target = (f - f0 + 1) / a.fps
            dt = target - (time.time() - t0)
            if dt > 0:
                time.sleep(dt)
    except KeyboardInterrupt:
        pass
    finally:
        sys.stdout.write(f"{ESC}0m{ESC}?25h\n")
        if audio:
            audio.terminate()


if __name__ == "__main__":
    main()
