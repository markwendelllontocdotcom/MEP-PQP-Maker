const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  await page.goto('file://' + process.cwd() + '/dist/release/PQP%20Maker.html');
  await page.waitForSelector('.sheet h1');
  await page.click('text=Load sample data');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('.titleblock >> text=Export PDF')]);
  await dl.saveAs(OUT + '/file-mode.pdf');
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForSelector('.sheet h1');
  console.log('file:// mode ok | after reload:', await page.textContent('.tb-wide .v'), '| errors:', JSON.stringify(logs));
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
