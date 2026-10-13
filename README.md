# psyche_video · 心理学科普视频生产线

用「代码逐帧渲染」方式制作抖音风格的心理学科普短视频。第 1 期：**心理熵 Psychic Entropy**（147 秒，快节奏版）。

## 成品

| 文件 | 说明 |
|------|------|
| `video/心理熵科普_快节奏版_147s.mp4` | 正片：1920x1080 / 30fps / h264+aac / 147s / ~22MB |
| `covers/封面_竖屏_1080x1920.png` | 抖音竖版封面 |
| `covers/封面_横屏_1920x1080.png` | 横版封面（主页/合集用） |

## 内容结构（38 场景 · 平均 4.3 秒/景）

1. **钩子区（0-10s）**：大脑变乱警告 → 快问三连 → 「这是物理定律」→ 标题卡
2. **概念区（10-27.6s）**：热力学熵回顾 → 熵增定律 → 心理熵定义（Csikszentmihalyi）→ 60000 念头/天 → 126 bit/s 带宽
3. **症状区（27.6-44.2s）**：焦虑 / 拖延（手机待办 UI）/ 内耗（自我打架）/ 决策疲劳 / 手机=熵加速器
4. **证据区（44.2-63s）**：体验取样法 ESM → 心流=负熵 → 心流通道图 → DMN → 前额叶 vs 边缘系统
5. **方法区（63-85.1s）**：反熵四律（目标清晰/即时反馈/难度匹配/单点专注）→ 运动·冥想·写作
6. **收尾区（85.1-147s）**：快闪总结 → 金句「你要么熵增，要么进化」→ 行动清单 → 96% 警示 → 一句话记住 → 自测 3 题 → 话题标签 → 下期预告（心流）→ 回顾滚动 → 关注引导 → 片尾

## 重建管线

```bash
# 0) 依赖：Node + Playwright（npm i -g playwright && playwright install chromium）
#    中文字体：Noto Sans SC（Regular/Medium/Bold/Black）

# 1) 预览关键画面（人工/VLM 质检）
NODE_PATH=$(npm root -g) node src/preview.js     # → preview/*.png

# 2) 全量逐帧渲染（4 页并行 JPEG，~2 分钟）
NODE_PATH=$(npm root -g) node src/render.js 4     # → frames/f_*.jpg + manifest.json

# 3) 展开为恒定 30fps 序列
python3 scripts/expand_frames.py                  # → seq/s_*.jpg（4410 帧）

# 4) 合成（音乐取自 assets/original_audio.m4a）
ffmpeg -framerate 30 -i seq/s_%06d.jpg -i assets/original_audio.m4a \
  -c:v libx264 -pix_fmt yuv420p -crf 23 -preset superfast \
  -c:a aac -b:a 192k -t 147.0 -movflags +faststart out.mp4

# 5) 封面
NODE_PATH=$(npm root -g) node src/render_cover.js # → 两张 PNG
```

## 技术要点

- **seek 驱动动画引擎**：`src/index.html` 内 38 个场景全部由 `window.seek(t)` 纯函数式驱动，无 CSS animation / setInterval —— 截图渲染 100% 确定性、可断点续渲
- **智能帧率**：入场窗口（1.3s）与粒子场景 30fps，静态尾段 15fps，采集 3244 帧展开为 4410 帧
- **音乐对齐**：场景切换锚定原声 onsets `[2.0, 3.0, 4.1, 6.4, 7.5, 8.7, 10.1, 18.4, 25.9, 27.6, 44.2, 45.9, 85.1, 86.5, 88.8, 89.9, 91.1, 92.5, 100.8]`
- **设计语言**：#0B0D17 深空黑 / 思源黑体 Black / 故障艺术标题（红蓝双色 text-shadow 错位）/ 胶囊进度条（绿→黄→红）/ 手机待办 UI 模拟 / 粒子布朗运动
- **快节奏规范**：入场动画 0.2-0.3s 完成、逐条 stagger ≤0.16s、每场景至少两层信息

## 目录

```
├── video/     成片
├── covers/    封面（竖屏 + 横屏）
├── src/       动画引擎 index.html + 渲染/预览/封面脚本
├── scripts/   expand_frames.py（时隙映射展开）
├── assets/    original_audio.m4a（原声音乐）
└── docs/      工作日志与音乐分析
```
