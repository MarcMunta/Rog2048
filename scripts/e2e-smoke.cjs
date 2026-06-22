const { chromium } = require('playwright');

const url = process.env.E2E_URL ?? 'http://127.0.0.1:4173/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const bad = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') bad.push(`error: ${text}`);
    if (msg.type() === 'warning' && !text.includes('CONTEXT_LOST_WEBGL')) bad.push(`warning: ${text}`);
  });
  page.on('pageerror', (error) => bad.push(`pageerror: ${error.message}`));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#new-run').click();
  await page.locator('.class-card').first().click();
  await page.locator('.map-node.available').first().click();
  await page.waitForSelector('.combat-shell', { timeout: 10000 });
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(700);

  const result = {
    hud: await page.locator('.combat-shell').count(),
    skills: await page.locator('.skill-button').count(),
    canvas: await page.locator('canvas').count(),
    title: await page.title()
  };

  await browser.close();
  if (bad.length) throw new Error(bad.join('\n'));
  if (!result.hud || result.skills < 2 || !result.canvas || result.title !== 'Rog2048') {
    throw new Error(`E2E smoke failed: ${JSON.stringify(result)}`);
  }
  console.log(`E2E smoke passed: ${JSON.stringify(result)}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
