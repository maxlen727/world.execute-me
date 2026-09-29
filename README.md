# world.execute(me); × DeepSeek-chan (深度求索娘) // Interactive Web MV

> **"world.execute(me);" by Mili** 遇见 **DeepSeek-chan（深度求索娘）**
> 一个由现代前端技术（Vite + TypeScript + Three.js + Web Audio API + Canvas 2D）驱动的沉浸式交互 3D 音乐视频 (MV)。

---

## 🌟 核心特色与设计亮点

### 1. 严格毫秒级歌词轴与双语代码字幕
* 精确对齐原曲 **3分32秒** 的 58 行歌词断句与节奏鼓点。
* 每句歌词配有对应的**可执行代码实现**（如 `me.dimension.giveTo(you);`、`you.sitOn(me.getTangents());`）。
* **Live Offset 实时对齐校准工具**：HUD 底部提供 `[-100ms]`, `[-20ms]`, `[+20ms]`, `[+100ms]` 毫秒级微调按钮，一键校准任何 MP3 片头静音差异，并自动持久化至 `localStorage`。

### 2. DeepSeek 娘（深度求索娘）动态赛博形象
* **发饰**：标志性**小蓝鲸发饰（Little Blue Whale Hairpin）**，带有呼吸灯与重低音共振脉冲。
* **发型与容姿**：海蓝渐变赛博长发与发丝动力学摆动，深蓝与青色数字瞳孔，带有视线跟随与动态眨眼。
* **Audio-Reactive 嘴型同步**：通过 Web Audio API 实时提取 Cassie Wei 的人声能量，动态开合嘴型与口型变换。
* **状态演进**：
  * `BOOTING`：系统唤醒，面部数据纹路激活
  * `SINGING`：随歌声起伏动态歌唱
  * `CAT_MODE`：唱到 *"If I'm a tabby cat"* 时唤出全息荧光猫耳
  * `OVERCLOCK`：高潮递归阶段面部发光与着色器故障撕裂
  * `DISSOLVING`：尾声 *"world.execute(me);"* 缓缓化为蓝光粒子星座

### 3. 3D 赛博空间与小蓝鲸（Three.js）
* **3D 赛博小蓝鲸 (Little Blue Whale)**：具有流体尾鳍摆动与双鳍波浪动态，在副歌与高潮时游弋穿梭于 3D 向量空间，尾部拖拽二进制泡泡尾迹。
* **分镜视效系统**：
  * **Chapter 1 (Boot)**：CRT 显像管开机、BIOS 内存检测、实体方块构建。
  * **Chapter 2 (Geometry)**：三维笛卡尔坐标系、正弦波动态切线滑动 $y - y_0 = \cos(x_0)(x - x_0)$ 与渐近极限。
  * **Chapter 3 (Oscilloscope)**：双通道示波器，实时波形在交流电 (AC 正弦) 与直流电 (DC 阶跃) 间高速翻转。
  * **Chapter 4 (Execution)**：小蓝鲸破浪而出，Assembly 汇编流，重低音冲击波。
  * **Chapter 5 (OOP)**：面向对象类继承图谱，茄子、番茄、低模猫咪与神圣正二十面体。
  * **Chapter 6 (Trial)**：战斗锁定准星，文字粒子子弹轨迹（`STAR`, `CARBIDE` 等），红字代码违规告警。
  * **Chapter 7 (Memory & GC)**：十六进制内存矩阵，指针箭头链接，垃圾回收器 Mark-and-Sweep 激光雷达扫描净化负面记忆。
  * **Chapter 8 (Climax)**：递归调用栈爆炸（Stack Overflow），强力 Bloom 辉光与屏幕震颤。
  * **Chapter 9 (Outro)**：纯净深空，光标闪烁：`[Process completed with exit code 0]`。

### 4. `<think>` 思考链控制台 (DeepSeek-R1 CoT)
* 左上角半透明悬浮控制台，实时以高频 token 吐字流渲染 DeepSeek-chan 的内心思考日志与情感测算。
* 支持折叠与展开，包含实时 Token 计数统计。

---

## 🚀 启动与音频加载

开发服务器已启动在本地：
👉 **http://localhost:5173/**

### 如何加载原曲音频：
1. **拖拽加载（最方便）**：直接把您的 `world.execute(me);.mp3`（或任意格式音频）拖拽入浏览器窗口即可开始播放！
2. **点击上传**：点击底部工具栏的 **`📂 LOAD MP3`** 按钮选择本地音频。
3. **放置到 public**：把 MP3 放置在项目的 `public/` 目录下（命名为 `audio.mp3` 或 `world.execute(me);.mp3`），刷新页面即可全自动加载。
4. **内置合成器演示**：即使尚未放入音频，应用内置的 140 BPM 8-bit/Chiptune 合成器也会驱动全套视效与嘴型律动，方便即开即玩。

---

## 🎮 控制与快捷功能

| 功能按键 | 说明 |
| :--- | :--- |
| **▶ PLAY / ⏸ PAUSE** | 播放 / 暂停 |
| **进度滑块** | 随时跳转至任意章节（如跳到 01:11 副歌或 02:57 高潮） |
| **CALIBRATE AXIS** | `[-100ms]`, `[-20ms]`, `[+20ms]`, `[+100ms]` 实时对准歌词轴 |
| **🎥 CINEMATIC** | 切换为电影级全自动运镜，或切换为鼠标自由 3D 旋转视角 |
| **📺 CRT ON/OFF** | 切换 CRT 显像管扫描线与暗角滤镜 |
| **⛶ FULLSCREEN** | 全屏沉浸体验 |
