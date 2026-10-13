/* render.js — Playwright 并行逐帧渲染（JPEG q92 + 4 页并行 + 智能帧率）
   用法：NODE_PATH=/home/z/.npm-global/lib/node_modules node render.js [并行页数] */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML = '/home/z/my-project/assets/psyche_video/index.html';
const OUT  = '/home/z/my-project/assets/psyche_video/frames';
const FPS = 30, TOTAL = 147;
const ENTRANCE = 1.3;  // 入场窗口（秒）：30fps；之后非粒子场景 15fps
const PARALLEL = parseInt(process.argv[2] || '4', 10);

(async () => {
  const RESUME = process.env.RESUME === '1';
  if (!RESUME) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars',
           '--disable-dev-shm-usage']
  });

  /* 用第一个页面读计划 */
  const p0 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  p0.on('pageerror', e => console.error('[page exception]', e.message));
  await p0.goto('file://' + HTML);
  await p0.evaluate(() => document.fonts.ready);
  await p0.waitForTimeout(500);
  const sceneTimes = await p0.evaluate(() => window.SCENE_TIMES);
  const sceneDyn   = await p0.evaluate(() => window.SCENE_DYNAMIC);
  const sceneCount = await p0.evaluate(() => window.SCENE_COUNT);
  console.log('scenes:', sceneCount, '| particle-dynamic:', sceneDyn.filter(Boolean).length);

  const plan = [];
  const EPS = 1e-6;
  const skip = [];  // 已存在的帧（续渲）
  for (let i = 0; i < sceneTimes.length; i++) {
    const t0 = sceneTimes[i];
    const t1 = (i + 1 < sceneTimes.length) ? sceneTimes[i + 1] : TOTAL;
    const dynamic = sceneDyn[i];
    let t = t0;
    while (t < t1 - EPS) {
      plan.push(Math.min(t, t1 - 1 / FPS));
      t += ((dynamic || (t - t0) < ENTRANCE)) ? 1 / FPS : 1 / (FPS / 2);
    }
  }
  plan.push(TOTAL - 1 / FPS);
  for (let n = 0; n < plan.length; n++) {
    const fp = path.join(OUT, 'f_' + String(n).padStart(6, '0') + '.jpg');
    skip.push(RESUME && fs.existsSync(fp) && fs.statSync(fp).size > 1000);
  }
  const todo = plan.filter((_, i) => !skip[i]).length;
  console.log('planned capture frames:', plan.length, '| already done:', plan.length - todo, '| parallel pages:', PARALLEL);

  /* 分块并行 */
  const chunks = [];
  const per = Math.ceil(plan.length / PARALLEL);
  for (let i = 0; i < PARALLEL; i++) chunks.push({ from: i * per, to: Math.min((i + 1) * per, plan.length) });

  const t0wall = Date.now();
  let done = 0;
  await Promise.all(chunks.map(async (ch, ci) => {
    let page = p0;
    if (ci !== 0) {
      page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      page.on('pageerror', e => console.error(`[p${ci} exception]`, e.message));
      await page.goto('file://' + HTML);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
    }
    for (let n = ch.from; n < ch.to; n++) {
      if (skip[n]) continue;
      await page.evaluate(tt => window.seek(tt), plan[n]);
      await page.screenshot({ path: path.join(OUT, 'f_' + String(n).padStart(6, '0') + '.jpg'), type: 'jpeg', quality: 92 });
      done++;
      if (done % 400 === 0) {
        const rate = done / ((Date.now() - t0wall) / 1000);
        console.log(`progress ${done}/${plan.length} (${rate.toFixed(1)} fps, ETA ${((plan.length - done) / rate / 60).toFixed(1)} min)`);
      }
    }
    if (ci !== 0) await page.close(); else await p0.close();
  }));

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ fps: FPS, total: TOTAL, times: plan }));
  await browser.close();
  console.log(`DONE: ${plan.length} frames in ${((Date.now() - t0wall) / 1000).toFixed(1)}s → ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
