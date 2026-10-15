const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  await page.goto('http://localhost:4175/');
  await page.waitForSelector('.sheet h1');
  await page.screenshot({ path: OUT + '/01-empty.png' });
  // sample data
  await page.click('text=Load sample data');
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/02-sample.png' });
  const ref = await page.textContent('.tb .ref');
  const dur = await page.textContent('#row-P12 .calc span');
  console.log('DocRef:', ref, '| Duration:', dur);
  // validation: bad project number, completion before commencement, Q04 out of range
  await page.fill('#f-P02', '1234');
  await page.fill('#f-P11', '2026-10-01');
  await page.click('text=5. Quality System');
  await page.fill('#f-Q04', '80');
  await page.click('text=1. Project Information');
  const errs = await page.$$eval('.err', (els) => els.map((e) => e.textContent));
  console.log('Errors shown:', JSON.stringify(errs));
  await page.click('.titleblock >> text=Export Word (.docx)');
  await page.waitForSelector('.dialog');
  console.log('Export blocked dialog:', await page.textContent('.dialog h2'));
  await page.screenshot({ path: OUT + '/03-blocked.png' });
  await page.click('.dialog >> text=OK');
  // fix entries
  await page.fill('#f-P02', '101');
  await page.fill('#f-P11', '2027-12-31');
  await page.click('text=5. Quality System');
  await page.fill('#f-Q04', '24');
  await page.screenshot({ path: OUT + '/04-quality.png', fullPage: true });
  // exports
  for (const kind of ['Export Word (.docx)', 'Export PDF']) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('.titleblock >> text=' + kind)]);
    const p = OUT + '/' + dl.suggestedFilename();
    await dl.saveAs(p);
    console.log('Downloaded:', dl.suggestedFilename(), fs.statSync(p).size, 'bytes');
  }
  // sections panel
  await page.click('text=PQP Sections');
  await page.screenshot({ path: OUT + '/05-sections.png', fullPage: true });
  // autosave then reload
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForSelector('.sheet h1');
  console.log('After reload project name:', await page.textContent('.tb-wide .v'));
  // offline reload (service worker)
  await page.waitForTimeout(1500);
  const sw = await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.sheet h1', { timeout: 10000 });
  console.log('Service worker:', sw, '| Offline reload OK, title:', await page.textContent('.appname'));
  // phone layout
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto('http://localhost:4175/');
  await mp.waitForSelector('.sheet h1');
  await mp.click('text=Load sample data');
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: OUT + '/06-phone.png', fullPage: false });
  console.log('Console errors:', JSON.stringify(logs));
  await browser.close();
})().catch((e) => { console.error('E2E FAILED', e); process.exit(1); });
