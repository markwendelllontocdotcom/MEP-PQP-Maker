// Review page and Print (headless: the print dialog is replaced by a hook; the real dialog was checked in a headed browser).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(() => {
    try { delete window.showDirectoryPicker; delete Window.prototype.showDirectoryPicker; } catch (e) {}
    window.__printed = [];
    window.__pqpPrintHook = (url) => { window.__printed.push(url); return true; };
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  await page.goto('http://localhost:4176/');
  await page.waitForSelector('.sheet h1');
  await page.click('text=Load sample data');
  await page.click('.nav >> text=Review');
  console.log('Title:', await page.textContent('#sheet-title'));
  console.log('Checks:', JSON.stringify(await page.$$eval('.rv-check', (els) => els.map((e) => e.className.split(' ')[1] + ': ' + e.querySelector('.rv-title').textContent))));
  await page.waitForSelector('iframe.rv-frame', { timeout: 60000 });
  const t0 = Date.now();
  console.log('Preview:', await page.textContent('.rv-meta'), '| src blob:', (await page.getAttribute('iframe.rv-frame', 'src')).startsWith('blob:'));
  console.log('Cards:', JSON.stringify(await page.$$eval('.rv-card h2', (els) => els.map((e) => e.textContent))));
  await page.screenshot({ path: OUT + '/review.png', fullPage: true });
  // Print from the toolbar reuses the preview's PDF
  await page.click('.actions >> text=Print');
  await page.waitForFunction(() => window.__printed.length === 1, null, { timeout: 30000 });
  const same = await page.evaluate(() => window.__printed[0] === document.querySelector('iframe.rv-frame').src.split('#')[0]);
  console.log('Print: dialog requested', '| same PDF as the preview:', same, '| ms', Date.now() - t0);
  // Export PDF right after: reuses the same PDF too
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.rv-out >> text=Export PDF')]);
  console.log('Export PDF:', dl.suggestedFilename(), '| ms', Date.now() - t0);
  // an entry that is not allowed: Review shows it, export and print buttons are off, toolbar Print explains
  await page.click('.nav >> text=1. Project Information');
  await page.fill('#f-P02', 'DXB 101');
  await page.click('.nav >> text=Review');
  await page.waitForSelector('.rv-bad');
  console.log('Bad check:', await page.textContent('.rv-bad .rv-title'), '| buttons disabled:', await page.$eval('.rv-out .btn', (b) => b.disabled));
  await page.click('.actions >> text=Print');
  console.log('Toolbar Print:', await page.textContent('.dialog h2'));
  await page.click('.dialog >> text=OK');
  // Edit link goes to the right group
  await page.click('.rv-card:has(h2:text("Document control")) >> text=Edit');
  console.log('Edit goes to:', await page.textContent('#sheet-title'));
  // narrow screen
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('.nav >> text=Review');
  await page.waitForSelector('iframe.rv-frame, .rv-wait', { timeout: 60000 });
  const hs = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('Phone: horizontal scroll', hs);
  await page.screenshot({ path: OUT + '/review-phone.png' });
  console.log('Errors:', logs);
  await browser.close();
})();
