// Export folder: pick once, Word and PDF exports are written into it; Use Downloads falls back to a download.
// The native folder picker is replaced by a folder in the browser's private file system.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    window.showDirectoryPicker = async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Samples', { create: true });
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  await page.goto('http://localhost:4176/');
  await page.waitForSelector('.sheet h1');
  await page.click('text=Load sample data');
  console.log('Before:', (await page.textContent('.expdir')).replace(/\s+/g, ' '));
  await page.click('.titleblock >> text=Export Word (.docx)');
  await page.waitForSelector('.dialog');
  console.log('First export asks:', await page.textContent('.dialog h2'));
  await page.screenshot({ path: OUT + '/folder-ask.png' });
  await page.click('.dialog >> text=Choose folder…');
  await page.waitForSelector('.toast:has-text("Saved to")', { timeout: 120000 });
  console.log('Toast:', await page.textContent('.toast'));
  await page.click('.titleblock >> text=Export PDF');
  await page.waitForSelector('.toast:has-text(".pdf")', { timeout: 120000 });
  console.log('Toast:', await page.textContent('.toast'));
  const files = async () => page.evaluate(async () => {
    const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('Samples');
    const out = [];
    for await (const [n, h] of d.entries()) out.push(n + ' ' + (await h.getFile()).size);
    return out;
  });
  console.log('Folder now holds:', JSON.stringify(await files()));
  await page.reload();
  await page.waitForSelector('.expdir');
  console.log('After reload:', (await page.textContent('.expdir')).replace(/\s+/g, ' '));
  await page.screenshot({ path: OUT + '/folder-panel.png', clip: { x: 1100, y: 60, width: 340, height: 420 } });
  await page.click('.expdir >> text=Use Downloads');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('.titleblock >> text=Export PDF')]);
  console.log('Use Downloads gives a download:', dl.suggestedFilename());
  // the single-file copy opened from disk
  const fp = await ctx.newPage();
  await fp.goto('file://' + path.resolve('dist/release/PQP Maker.html'));
  await fp.waitForSelector('.sheet h1');
  console.log('file:// copy: secure context', await fp.evaluate(() => isSecureContext), '| folder panel shown', !!(await fp.$('.expdir')));
  console.log('Errors:', JSON.stringify(logs));
  await browser.close();
})();
