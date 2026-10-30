#!/usr/bin/env python3
"""音频分析：频谱带 / RMS / 起音强度 / 尾段事件。结果存 data/analysis.npz"""
import json, subprocess, sys
import numpy as np

SR = 44100
FPS = 30
HOP = SR // FPS  # 1470
NFFT = 2048
NFRAMES = 6358

WAV = "data/audio.wav"

subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "data/audio.mp3",
                "-ac", "1", "-ar", str(SR), "-f", "wav", WAV], check=True)

import wave
with wave.open(WAV) as w:
    n = w.getnframes()
    raw = w.readframes(n)
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
print("samples", len(x), "dur", len(x) / SR)

# --- STFT ---
win = np.hanning(NFFT).astype(np.float32)
pad = np.concatenate([np.zeros(NFFT // 2, np.float32), x, np.zeros(NFFT, np.float32)])
frames = np.lib.stride_tricks.sliding_window_view(pad, NFFT)[::HOP]
frames = frames[:NFRAMES]
print("stft frames", frames.shape)
spec = np.abs(np.fft.rfft(frames * win, axis=1)).astype(np.float32)  # (T, 1025)
freqs = np.fft.rfftfreq(NFFT, 1 / SR)

# --- 128 条对数频带 40Hz..16kHz ---
edges = np.geomspace(40, 16000, 129)
bands = np.zeros((spec.shape[0], 128), np.float32)
for i in range(128):
    m = (freqs >= edges[i]) & (freqs < edges[i + 1])
    if m.sum() == 0:
        m = np.argmin(np.abs(freqs - edges[i]))[None]
    bands[:, i] = spec[:, m].mean(axis=1)

# 对数压缩 + 自适应归一
b = np.log1p(bands * 60.0)
b -= b.min()
b /= np.percentile(b, 99.5) + 1e-6
b = np.clip(b, 0, 1)

# 时间平滑（快起慢落）
sm = np.zeros_like(b)
prev = np.zeros(128, np.float32)
for t in range(b.shape[0]):
    prev = np.maximum(b[t], prev * 0.82)
    sm[t] = prev
bands = sm

# --- RMS ---
rms = np.sqrt((frames ** 2).mean(axis=1))
rms_db = 20 * np.log10(rms + 1e-7)
rms_n = np.clip((rms_db + 45) / 45, 0, 1)
# 平滑包络
env = np.zeros_like(rms_n)
p = 0.0
for t in range(len(rms_n)):
    p = max(rms_n[t], p * 0.9)
    env[t] = p

# --- 低频（kick）能量 & 起音 ---
low = spec[:, freqs < 150].sum(axis=1)
low = low / (low.max() + 1e-9)
d = np.diff(np.concatenate([[0], low]))
onset_low = np.clip(d * 6, 0, 1)
# 全带谱通量
flux = np.diff(np.concatenate([np.zeros((1, spec.shape[1]), np.float32), np.log1p(spec * 40)], axis=0), axis=0)
flux = np.maximum(flux, 0).mean(axis=1)
flux = flux / (np.percentile(flux, 99) + 1e-9)
flux = np.clip(flux, 0, 1)

# --- 人声带 200-4k（用于判断尾段有没有唱） ---
vocal = spec[:, (freqs > 250) & (freqs < 4000)].sum(axis=1)
vocal = vocal / (vocal.max() + 1e-9)

np.savez_compressed("data/analysis.npz", bands=bands.astype(np.float32),
                    rms=env.astype(np.float32), rms_raw=rms_n.astype(np.float32),
                    low=low.astype(np.float32), onset_low=onset_low.astype(np.float32),
                    flux=flux.astype(np.float32), vocal=vocal.astype(np.float32))
print("saved", bands.shape)

# --- 尾段报告 ---
print("\n=== TAIL 190s-212s ===")
for t in range(int(190 * FPS), min(len(rms), NFRAMES), 15):
    print(f"{t/FPS:7.2f}s f{t:5d} rms={env[t]:.2f} low={low[t]:.2f} flux={flux[t]:.2f} voc={vocal[t]:.2f}")
