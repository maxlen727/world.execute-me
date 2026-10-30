#!/usr/bin/env python3
"""合成 / 预览 / 导出。"""
import os, sys, argparse, subprocess, time
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.core import Frame, COLS, ROWS
from engine import crt, compose, lyrics as LY, gpu
from engine import acts
from engine.acts import A, Ctx

W, H = 1920, 1080
FPS = 30
TOTAL = 6358
HERE = os.path.dirname(os.path.abspath(__file__))


def load_ctx():
    z = np.load(os.path.join(HERE, "data", "analysis.npz"))
    return Ctx(z)


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


BASE_FX = {
    "init": 0.04, "title": 0.07, "math": 0.05, "sensory": 0.08,
    "organic": 0.05, "isolation": 0.10, "break": 0.22,
    "climax": 0.13, "outro": 0.08,
}


class Renderer:
    def __init__(self):
        self.ctx = load_ctx()
        self.st = Frame(compose.STAGE_ROWS, COLS)
        self.main = Frame(ROWS, COLS)
        self.raster = gpu.Raster()

    def frame(self, f, rng=None):
        if rng is None:
            rng = np.random.default_rng(1000 + f)
        st = self.st
        st.clear()
        sec = section(f)
        if sec == "init":
            acts.act_init(st, f, self.ctx)
        elif sec == "title":
            acts.act_title(st, f, self.ctx)
        elif sec == "math":
            acts.act_math(st, f, self.ctx)
        elif sec == "sensory":
            acts.act_sensory(st, f, self.ctx)
        elif sec == "organic":
            acts.act_organic(st, f, self.ctx)
        elif sec == "isolation":
            acts.act_isolation(st, f, self.ctx)
        elif sec == "break":
            acts.act_break(st, f, self.ctx)
        elif sec == "climax":
            acts.act_climax(st, f, self.ctx)
        else:
            acts.act_outro(st, f, self.ctx)

        if A["only"] <= f < A["last"]:
            acts.yandere_overlay(st, f, self.ctx)
        acts.density_floor(st, f, self.ctx)

        main = self.main
        main.clear()
        st.blit_into(main, compose.STAGE_Y0)

        self.ctx.alert = sec in ("break", "climax") or (sec == "isolation" and f > A["illegal"] - 40)
        compose.hud(main, f, self.ctx)

        ln = LY.line_at(f)
        if sec == "outro" and f < A["last"] - 2:
            compose.subtitle(main, None, f, prompt=True)
        elif ln is None:
            nxt = LY.next_line(f)
            if nxt is not None and nxt["f0"] - f < 90:
                compose.subtitle(main, nxt, f, cue=True)
        else:
            compose.subtitle(main, ln, f)




        g = BASE_FX.get(sec, 0.05) + 0.10 * self.ctx.k(f)
        if sec == "break":
            g += 0.35 * max(0.0, (f - A["illegal"]) / 400.0)
        if sec == "outro" and f >= A["last"]:
            g += 0.45
        fx = {
            "glitch": min(1.0, g),
            "noise": 0.055 + 0.22 * min(1.0, g),
            "aberr": 0.6 + 1.4 * min(1.0, g),
            "bright": 1.18,
            "decay": 0.50,
            "bloom": 0.66,
        }
        return self.raster.render(main, rng, fx)


# ---------------------------------------------------------------- 静态预览
def stills(frames, outdir, warm=12):
    os.makedirs(outdir, exist_ok=True)
    r = Renderer()
    want = sorted(frames)
    last = max(0, want[0] - warm)
    for g in range(last, want[0]):
        r.frame(g, np.random.default_rng(7))
    for f in want:
        for g in range(last, f + 1):
            img = r.frame(g, np.random.default_rng(7))
        last = f + 1
        p = os.path.join(outdir, f"f{f:05d}.png")
        Image.fromarray(img).save(p)
        print("wrote", p)


# ---------------------------------------------------------------- 分段渲染
ENC_NVENC = ["-c:v", "h264_nvenc", "-preset", "p7", "-tune", "hq",
             "-rc", "vbr", "-cq", "27", "-b:v", "0",
             "-spatial-aq", "1", "-temporal-aq", "1", "-aq-strength", "8",
             "-pix_fmt", "yuv420p", "-g", "60"]
ENC_X264 = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-g", "60", "-threads", "2"]


def _segment(args):
    a, b, path, warm, enc = args
    r = Renderer()
    for g in range(max(0, a - warm), a):
        r.frame(g, np.random.default_rng(7))
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-an"] + (ENC_NVENC if enc == "nvenc" else ENC_X264) + [path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    rng = np.random.default_rng(777)
    try:
        for g in range(a, b):
            img = r.frame(g, rng)
            p.stdin.write(img.tobytes())
    except BrokenPipeError:
        pass
    p.stdin.close()
    p.wait()
    return path


def video(out, workers=5, total=TOTAL, chunk=160, enc="nvenc"):
    import multiprocessing as mp
    from concurrent.futures import ProcessPoolExecutor
    tmp = os.path.join(HERE, "tmp", "segs")
    os.makedirs(tmp, exist_ok=True)
    for old in os.listdir(tmp):
        if old.endswith(".mp4") or old.endswith(".txt"):
            os.remove(os.path.join(tmp, old))
    segs = [(a, min(total, a + chunk), os.path.join(tmp, f"s{a:05d}.mp4"), 8, enc)
            for a in range(0, total, chunk)]
    t0 = time.time()
    done = 0
    ctx = mp.get_context("spawn")   # CUDA context 不能跨 fork，必须 spawn
    with ProcessPoolExecutor(max_workers=workers, mp_context=ctx) as ex:
        for path in ex.map(_segment, segs):
            done += 1
            el = time.time() - t0
            print(f"[{done}/{len(segs)}] {path}  {el:.0f}s", flush=True)
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as fh:
        for a, b, p, _, _ in segs:
            fh.write(f"file '{p}'\n")
    vo = os.path.join(HERE, "tmp", "video_only.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                    "-i", lst, "-c", "copy", vo], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vo,
                    "-i", os.path.join(HERE, "data", "audio.mp3"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    print("done", out, round(os.path.getsize(out) / 1e6, 1), "MB", f"{time.time() - t0:.0f}s")


def bench(n=40, start=1500):
    r = Renderer()
    t0 = time.time()
    for f in range(start, start + n):
        r.frame(f, np.random.default_rng(1))
    print(f"{n} frames  {(time.time() - t0) / n * 1000:.1f} ms/frame")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", type=str, default=None)
    ap.add_argument("--outdir", type=str, default=os.path.join(HERE, "tmp", "still"))
    ap.add_argument("--video", type=str, default=None)
    ap.add_argument("--workers", type=int, default=5)
    ap.add_argument("--enc", type=str, default="nvenc")
    ap.add_argument("--bench", type=int, default=0)
    a = ap.parse_args()
    if a.bench:
        bench(a.bench)
    if a.stills:
        stills([int(x) for x in a.stills.split(",")], a.outdir)
    if a.video:
        video(a.video, a.workers, enc=a.enc)
