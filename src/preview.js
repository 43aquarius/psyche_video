/* preview.js — 关键时间点抽样截图，用于人工/VLM 质检 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML = '/home/z/my-project/assets/psyche_video/index.html';
const OUT = '/home/z/my-project/assets/psyche_video/preview';
const SHOTS = [
  [1.0,  'S01_hook'],       // 冷开场
  [3.0,  'S02_questions'],  // 快问三连
  [7.5,  'S04_title'],      // 标题卡
  [9.5,  'S05_author'],     // 出处
  [11.5, 'S06_physics'],    // 热力学熵
  [19.8, 'S09_definition'], // 定义
  [22.8, 'S10_thoughts'],   // 60000 念头
  [25.8, 'S11_bandwidth'],  // 126 bit/s
  [29.0, 'S12_anxiety'],    // 焦虑
  [32.5, 'S13_procrast'],   // 拖延手机UI
  [36.0, 'S14_friction'],   // 内耗
  [39.5, 'S15_decision'],   // 决策疲劳
  [43.0, 'S16_phone'],      // 手机熵加速
  [45.8, 'S17_esm'],        // ESM
  [49.0, 'S18_flow'],       // 心流=负熵
  [53.0, 'S19_channel'],    // 心流通道图
  [57.0, 'S20_dmn'],        // DMN
  [61.0, 'S21_brain'],      // 前额叶vs边缘
  [64.5, 'S22_law1'],       // 反熵1
  [78.5, 'S26_practice'],   // 实践三件套
  [86.8, 'S28_recap'],      // 快闪总结
  [90.5, 'S29_quote'],      // 金句
  [94.0, 'S30_checklist'],  // 行动清单
  [98.5, 'S31_96pct'],      // 96%
  [103.5,'S32_onesentence'],// 一句话
  [109.5,'S33_selftest'],   // 自测
  [115.0,'S34_tags'],       // 标签
  [121.0,'S35_next'],       // 预告
  [127.0,'S36_scroll'],     // 回顾滚动
  [133.0,'S37_follow'],     // 关注
  [142.0,'S38_end'],        // 片尾
];

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page exception]', e.message));
  await page.goto('file://' + HTML);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  for (const [t, name] of SHOTS) {
    await page.evaluate(tt => window.seek(tt), t);
    await page.screenshot({ path: path.join(OUT, `${String(t.toFixed(1)).padStart(5, '0')}_${name}.png`), type: 'png' });
  }
  await browser.close();
  console.log('preview done:', SHOTS.length, 'shots');
})().catch(e => { console.error(e); process.exit(1); });
