/* render_cover.js — 渲染竖屏 + 横屏封面 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] });

  /* 竖屏 1080x1920 */
  const pv = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pv.goto('file:///home/z/my-project/assets/psyche_video/cover.html?mode=v');
  await pv.evaluate(() => document.fonts.ready);
  await pv.waitForTimeout(500);
  await pv.screenshot({ path: '/home/z/my-project/download/封面_竖屏_1080x1920.png', type: 'png' });
  await pv.close();

  /* 横屏 1920x1080 */
  const ph = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await ph.goto('file:///home/z/my-project/assets/psyche_video/cover.html?mode=h');
  await ph.evaluate(() => document.fonts.ready);
  await ph.waitForTimeout(500);
  await ph.screenshot({ path: '/home/z/my-project/download/封面_横屏_1920x1080.png', type: 'png' });
  await ph.close();

  await browser.close();
  console.log('covers done');
})().catch(e => { console.error(e); process.exit(1); });
