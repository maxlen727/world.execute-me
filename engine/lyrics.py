"""歌词时间轴：以官方双语 LRC 为准（已用音频人声谱验证）。"""
import re
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
LRC = os.path.join(_HERE, "..", "data", "lyrics.lrc")

FPS = 30
TOTAL = 6358

_raw = []
_pat = re.compile(r"\[(\d+):(\d+\.\d+)\](.*)")
for ln in open(LRC, encoding="utf-8"):
    m = _pat.match(ln.strip())
    if m:
        t = int(m.group(1)) * 60 + float(m.group(2))
        _raw.append((t, m.group(3).strip()))

# EN / CN 交替
_items = []
i = 0
while i < len(_raw):
    t, s = _raw[i]
    if i + 1 < len(_raw) and abs(_raw[i + 1][0] - t) < 0.02 and re.search(r"[\u4e00-\u9fff]", _raw[i + 1][1]):
        _items.append((t, s, _raw[i + 1][1]))
        i += 2
    else:
        _items.append((t, s, ""))
        i += 1

# 合并同一时间戳（12 连 EXECUTION 之类的重复）
SECS = [
    (0.0, 13.891, "init"),
    (13.891, 16.0, "init"),
    (16.0, 29.709, "title"),
    (29.709, 44.452, "math"),
    (44.452, 74.045, "sensory"),
    (74.045, 103.489, "organic"),
    (103.489, 131.224, "isolation"),
    (131.224, 147.660, "break"),
    (147.660, 191.356, "climax"),
    (191.356, 999, "outro"),
]


def _sec(t):
    for a, b, s in SECS:
        if a <= t < b:
            return s
    return "outro"


def _wsplit(en, t0, t1):
    """词级：按音节权重在 [t0,t1] 内分配"""
    ws = [w for w in en.split(" ") if w]
    if not ws:
        return []
    wt = []
    for w in ws:
        core = re.sub(r"[^A-Za-z]", "", w)
        v = max(1, len(re.findall(r"[aeiouyAEIOUY]+", core)) or 1)
        wt.append(v * 1.0 + 0.6)
    tot = sum(wt)
    out = []
    cur = t0
    for w, k in zip(ws, wt):
        d = (t1 - t0) * k / tot
        out.append((w, cur, cur + d))
        cur += d
    return out


LINES = []
for idx, (t, en, cn) in enumerate(_items):
    t1 = _items[idx + 1][0] if idx + 1 < len(_items) else TOTAL / FPS
    t1 = max(t1, t + 0.25)
    if t1 - t > 4.0:
        t1 = t + 1.8          # 长空白：本句自己收尾
    LINES.append({
        "i": idx,
        "t0": t, "t1": t1,
        "f0": int(round(t * FPS)), "f1": int(round(t1 * FPS)),
        "en": en, "cn": cn,
        "sec": _sec(t),
        "words": _wsplit(en, t, t1),
    })

for _k, _l in enumerate(LINES):
    _l["n"] = _k

BY_FRAME = LINES


def line_at(f):
    for l in LINES:
        if l["f0"] <= f < l["f1"]:
            return l
    return None


def sec_at(f):
    t = f / FPS
    return _sec(t)


def sec_bounds(name):
    t0, t1 = None, None
    for l in LINES:
        if l["sec"] == name:
            t0 = l["f0"] if t0 is None else min(t0, l["f0"])
            t1 = l["f1"] if t1 is None else max(t1, l["f1"])
    for a, b, s in SECS:
        if s == name:
            t0 = int(a * FPS)
            t1 = int(b * FPS) if b < 999 else TOTAL
    return t0, t1


def by_text(sub):
    lo = sub.strip().lower()
    for l in LINES:
        if l["en"].strip().lower() == lo:
            return l
    for l in LINES:
        if lo in l["en"].lower():
            return l
    return None


def fidx(sub):
    l = by_text(sub)
    return l["f0"] if l else 0


# 关键锚点（帧）
A = {
    "title": 480,            # 16.000 world.execute(me);
    "verse2": 891,           # 29.709 If I'm a set of points
    "math_end": 1333,        # 44.452
    "sensory_end": 2221,     # 74.045
    "organic_end": 3104,     # 103.489
    "iso_end": 3936,         # 131.224
    "break_end": 4429,       # 147.660
    "chant_end": 4740,       # 158.000
    "climax_end": 5740,      # 191.356
    "last_exec": 6174,       # 205.811
    "end": TOTAL,
}


def next_line(f):
    for l in LINES:
        if l["f0"] > f:
            return l
    return None
