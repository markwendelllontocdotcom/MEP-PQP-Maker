// My PQPs: list of every PQP in this browser (as My HSE Plans in HSE Plan Maker).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  await ctx.addInitScript(() => {
    try { delete window.showDirectoryPicker; delete Window.prototype.showDirectoryPicker; } catch (e) {}
    window.__printed = []; window.__pqpPrintHook = (url) => { window.__printed.push(url); return true; };
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  const count = () => page.textContent('.navplans .navcount');
  const names = () => page.$$eval('.plan-name', (e) => e.map((x) => x.textContent));
  await page.goto('http://localhost:4176/');
  await page.waitForSelector('.sheet h1');
  console.log('First start opens on:', await page.textContent('#sheet-title'), '| My PQPs count:', await count());
  // one PQP from the sample, one typed by hand
  await page.click('.actions >> text=Load sample data'); await page.waitForTimeout(1500);
  await page.click('.actions >> text=New'); await page.waitForTimeout(300);
  await page.fill('#f-P01', 'Harbour View Offices'); await page.fill('#f-P02', 'dxb-310'); await page.waitForTimeout(1600);
  console.log('Menu label (open now):', await page.textContent('.navlabel'), '| header:', await page.textContent('.filestate span'));
  await page.click('.navplans');
  console.log('List:', JSON.stringify(await names()), '| count:', await count(), '| open now marked:', await page.textContent('.plan.current .plan-name'));
  console.log('Line:', (await page.textContent('.plan.current .plan-meta')).replace(/Edited.*?(AM|PM)/, 'Edited …'));
  // a blank New is not listed; leaving it removes it
  await page.click('.plans-bar >> text=New PQP'); await page.waitForTimeout(300);
  await page.click('.navplans');
  console.log('Blank new PQP listed while open:', (await names()).length, '| title:', await page.textContent('#sheet-title'));
  await page.click('.plan-name:text("Harbour View Offices")'); await page.waitForTimeout(1500);
  await page.click('.navplans');
  console.log('After leaving the blank one:', JSON.stringify(await names()));
  await page.screenshot({ path: OUT + '/plans.png' });
  // Preview of the sample (not the open one) builds its PDF
  await page.click('.plan:has(.plan-name:text("Sample Residential Tower (G+20)")) >> text=Preview');
  await page.waitForSelector('.preview iframe.pv-frame', { timeout: 60000 });
  console.log('Preview:', await page.textContent('#pv-title'), '|', await page.textContent('.pv-head .rv-meta'));
  await page.screenshot({ path: OUT + '/plans-preview.png' });
  await page.keyboard.press('Escape');
  console.log('Esc closes preview:', !(await page.$('.preview')));
  // PDF and Word of a PQP that is not open
  let [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.plan:has(.plan-name:text("Sample Residential Tower (G+20)")) >> button:text-is("PDF")')]);
  console.log('PDF from the list:', dl.suggestedFilename());
  [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.plan:has(.plan-name:text("Sample Residential Tower (G+20)")) >> button:text-is("Word")')]);
  console.log('Word from the list:', dl.suggestedFilename(), '| still open:', await page.textContent('.navlabel'));
  // Print from the list
  await page.click('.plan:has(.plan-name:text("Sample Residential Tower (G+20)")) >> button:text-is("Print")');
  await page.waitForFunction(() => window.__printed.length === 1, null, { timeout: 30000 });
  console.log('Print from the list: dialog requested');
  // the typed one has empty required fields: Word asks first and names the PQP
  await page.click('.plan:has(.plan-name:text("Harbour View Offices")) >> button:text-is("Word")');
  console.log('Empty fields:', await page.textContent('.dialog h2'));
  await page.click('.dialog >> text=Go back');
  // Duplicate and Delete
  await page.click('.plan:has(.plan-name:text("Sample Residential Tower (G+20)")) >> text=More ▾');
  await page.click('.more-menu >> text=Duplicate'); await page.waitForTimeout(500);
  console.log('After duplicate:', JSON.stringify(await names()), '| count:', await count());
  await page.click('.plan:has(.plan-name:text("Sample Residential Tower (G+20) (copy)")) >> text=More ▾');
  await page.click('.more-menu >> text=Delete…');
  console.log('Delete asks:', await page.textContent('.dialog h2'));
  await page.click('.dialog >> button:text-is("Delete")'); await page.waitForTimeout(500);
  console.log('After delete:', JSON.stringify(await names()), '| count:', await count());
  // open from the list, then reload: the app opens on My PQPs again with both
  await page.click('.plan-name:text("Sample Residential Tower (G+20)")'); await page.waitForTimeout(400);
  console.log('Opened from the list:', await page.textContent('#sheet-title'), '|', await page.inputValue('#f-P01'));
  await page.waitForTimeout(1500);
  await page.reload(); await page.waitForSelector('.sheet h1');
  console.log('After reload opens on:', await page.textContent('#sheet-title'), '| list:', JSON.stringify(await names()), '| open now:', await page.textContent('.plan.current .plan-name'));
  // HSE plans left in the shared browser database by HSE Plan Maker 1.0.5 are not listed
  await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('keyval-store');
    r.onsuccess = () => { const db = r.result; const tx = db.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put({ id: 'hse1', P01: 'An HSE plan', POL: [], S01: [], T02: '', OFF: [], modified: new Date().toISOString() }, 'proj:hse1'); tx.oncomplete = () => res(); };
  }));
  await page.reload(); await page.waitForSelector('.plan-name');
  console.log('HSE plan left out:', !(await names()).includes('An HSE plan'), '| count:', await count());
  // phone
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  console.log('Phone: horizontal scroll', await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
  await page.screenshot({ path: OUT + '/plans-phone.png' });
  console.log('Errors:', JSON.stringify(logs));
  await browser.close();
})();
