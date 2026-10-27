// Send to PQP Maker from the Oxypro Project Library: #library= links create the PQP or update the open one.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const { deflateRawSync } = require('node:zlib');
const OUT = process.argv[2];
const link = (project, photo) => 'http://localhost:4176/#library=' + deflateRawSync(Buffer.from(JSON.stringify({ format: 'pqp-maker-project', version: 1, source: { library: 'P122', ...(photo ? { photo: 'clipboard' } : {}) }, project })))
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const borough = { P01: 'The Borough', P02: 'DXB-243', P04: 'Dubai', P05: 'Plot No. JVC17TCP001B, Jumeirah Village Circle, Al Barsha South Fourth', P06: ['Residential', 'Commercial'],
  P07: 'All MEP Scope of Works', P13: 'B+G+5P+17F+Roof', R01: 'MIRFA | ICONIC', R02: 'Federal Engineering Consultants', R03: 'IndoGulf Contracting Company Llc' };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  const state = () => page.evaluate(() => ({ h1: document.querySelector('.sheet h1')?.textContent, hash: location.hash, dialog: document.querySelector('.dialog h2')?.textContent || '',
    ref: document.body.innerText.match(/OPEM-[A-Z0-9-]+-QM-PQP-001/)?.[0] }));
  await page.goto(link(borough)); await page.waitForSelector('.sheet h1'); await page.waitForTimeout(1500);
  let s = await state();
  console.log('Blank app: opens on', s.h1, '| Doc Ref', s.ref, '| address cleaned:', s.hash === '');
  await page.click('text=1. Project Information');
  await page.fill('#f-P07', 'Supply, installation, testing and commissioning of MEP works.');
  await page.waitForTimeout(1500);
  await page.goto(link({ ...borough, P07: undefined, P13: 'B+G+5P+18F+Roof' })); await page.waitForSelector('.sheet h1'); await page.waitForTimeout(800);
  s = await state(); console.log('Same code: dialog', JSON.stringify(s.dialog));
  await page.click('.dialog button:has-text("Update this PQP")'); await page.waitForTimeout(800);
  await page.click('text=1. Project Information');
  console.log('Update keeps typed scope:', (await page.inputValue('#f-P07')).startsWith('Supply'), '| building updated:', await page.inputValue('#f-P13'));
  await page.goto(link({ P01: 'Other Project', P02: 'P120' })); await page.waitForSelector('.sheet h1'); await page.waitForTimeout(800);
  s = await state(); console.log('Other code: dialog', JSON.stringify(s.dialog), '| buttons:', await page.$$eval('.dialog button', (b) => b.map((x) => x.textContent).join(' / ')));
  await page.click('.dialog button:has-text("Cancel")'); await page.waitForTimeout(300);
  console.log('Cancel keeps:', await page.inputValue('#f-P01'));
  // cover photo waiting on the clipboard: the app asks, Ctrl+V adds it
  await page.goto(link({ ...borough, P02: 'DXB-999', P01: 'Photo Test' }, true)); await page.waitForSelector('.sheet h1'); await page.waitForTimeout(800);
  await page.click('.dialog button:has-text("Create the PQP")'); await page.waitForTimeout(600);
  s = await state(); console.log('Photo: dialog', JSON.stringify(s.dialog));
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#3a6'; g.fillRect(0, 0, 320, 200);
    const b = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer(); dt.items.add(new File([b], 'photo.png', { type: 'image/png' }));
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(800);
  console.log('Photo pasted:', JSON.stringify(await page.evaluate(() => document.querySelector('.toast')?.textContent)), '| dialog closed:', !(await state()).dialog);
  await page.click('text=2. Project Parties'); await page.waitForTimeout(400);
  console.log('Cover photo field has the image:', await page.evaluate(() => !!document.querySelector('#row-R10 img')));
  await page.goto('http://localhost:4176/#library=broken'); await page.waitForSelector('.sheet h1'); await page.waitForTimeout(800);
  console.log('Broken link:', JSON.stringify((await state()).dialog));
  await page.screenshot({ path: OUT + '/e2e-library.png' });
  console.log('Errors:', JSON.stringify(logs));
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
