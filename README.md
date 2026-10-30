# WORLD.EXECUTE(ME); — ASCII 终端 MV

Mili《world.execute (me) ;》的 ASCII 字符动画 MV。

128×36 字符网格，全部画面由字符拼成；CRT 后处理（扫描线 / 辉光 / 色散 / 撕裂 / 残影）；中英双语字幕按官方 LRC 逐句对轴；1920×1080 / 30fps / 3:32。

```
████ ██ █ ████ ███ ██ █ ███████ ████
```

它不是"把画面降采样成字符"的滤镜，是从格子上长出来的一支片子：
每个格子的字符、调色板索引、亮度，都是逐帧算出来的。

## 看

```bash
# 在终端里直接播（ANSI 24bit 真彩，需要 kitty / foot / alacritty / wezterm）
python3 play.py
python3 play.py --start 147      # 从 2:27 的 12 连 EXECUTION 开始
python3 play.py --no-audio       # 不开音频
```

## 导出

```bash
# 一次性准备（音频不入库，见下）
cp "/path/to/Mili - world.execute (me) ;.mp3" data/audio.mp3
python3 prep_audio.py            # 生成 data/analysis.npz（频谱 / RMS / 起音）

# 整片（显卡路线，约 45 秒）
python3 render.py --video out/world-execute-me-ascii.mp4 --workers 3

# 纯 CPU 兜底（没有 cupy 时自动走这条，慢 3 倍）
python3 render.py --video out/world-execute-me-ascii.mp4 --workers 6 --enc x264

# 单帧预览
python3 render.py --stills 520,1900,5680 --outdir tmp/still
```

依赖：Python 3.11+、numpy、Pillow、ffmpeg。可选 `cupy-cuda12x`（GPU 路线，见下）。

```bash
python3 -m venv --system-site-packages ~/.local/share/ascii-mv/venv
~/.local/share/ascii-mv/venv/bin/pip install cupy-cuda12x
```

## 设计约定

**一套配色。** 荧光绿五阶 + 白 + 灰；**红只给"处决 / 病娇"**，别处一个红点都没有。
要换整体色调，只改 `engine/core.py` 里的 `PAL` 一张表。

**字符拼的字。** 大字不是位图重采样 —— 在 8 行高的位置上笔画会落在格子之间，一平均就散。
`engine/design.py` 里手写了一套 5×5 点阵字（46 个字形），放大整数倍，笔画永远落在格子上。
数字统一走七段数码管，也是字符拼的。

**版式。** 0-1 行 HUD / 2-28 行舞台（27 行）/ 29 行发丝线 / 30-31 英文字幕 / 32-33 中文字幕 /
34 行发丝线 / 35 行留白。安全区、字距标签、引导点、点阵底都在 `design.py` 里，所有场景往同一套度量上排。

## 性能

| | 单帧 | 整片 |
|---|---|---|
| 初版（PIL 往返 + 16 进程） | ~1200 ms | ~1 小时 |
| 合并 pass + 预分配缓冲 | 50 ms | 4 分钟 |
| **栅格化 + 后处理全上显卡** | **6.8 ms** | **45 秒** |

关键一步是把栅格化也搬上显卡：单元格是 36×128 的规则网格、每格固定 15×30 像素，
所以"把字形贴上去"不是 scatter，是一次广播加 ——

```
canvas(36,30,128,15,3) += 字形(36,128,30,15) × 颜色×强度(36,128,3)
```

CPU 每帧只上传 4608 个格子（约 90 KB），不再生成 25 MB 位图。
中文字形预先切成左右两半塞进同一张图集，走同一条路径。后处理全程留在显存里，只把最终的
uint8 拉回来（6.2 MB）。

注意：CUDA context 不能跨 fork，多进程必须用 `spawn`，否则 worker 里一调 cupy 就
`cudaErrorInitializationError`。

## 代码结构

```
engine/core.py       单元格帧缓冲、字形图集、绘制原语、值噪声
engine/design.py     版式系统：安全区 / 字距标签 / 发丝线 / 5×5 点阵字 / 七段数码管
engine/crt.py        CRT 后处理（CPU 实现 + 兜底）
engine/gpu.py        GPU 管线：单元格 → 位图 → CRT → uint8
engine/compose.py    HUD / 双语字幕 / 版式外框
engine/acts.py       全部分镜（开场 / 数学 / 感官 / 标本 / 隔离 / 高潮 / 尾声）
engine/lyrics.py     解析 LRC，生成 129 条短语级字幕
render.py            合成、静态预览、分段并行导出
play.py              终端播放器（ANSI 真彩）
prep_audio.py        音频分析：128 条对数频带 / RMS / 起音
```

## 关于音频

Mili 的原曲**没有**放进这个仓库。请自行准备音频文件放到 `data/audio.mp3`。
歌词时间轴来自官方双语 LRC（`data/lyrics.lrc`），这是**另一种发行版本的时间**，
和某些音源会有几秒偏差 —— 换音源时可能需要重新对齐。

## 致谢

- 音乐：**Mili — world.execute (me);**
- 对轴的双语歌词、以及最初的 AI prompt 思路：
  **[yym8224961/world.execute-me-ascii](https://github.com/yym8224961/world.execute-me-ascii)**
  —— 这份 LRC 和"让 AI 逐句翻译成画面动作"的写法是从那来的，这条支线的起点在那里。

同一首歌的其他版本在本仓库的其他分支：
`main`（Vite 动力排版版）、`remotion-treatise`（Remotion 铜版书版）。

## License

代码 MIT。音乐版权归 Mili / 原发行方所有，本仓库不包含音频。
