const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1300, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  await page.goto('http://localhost:4174/');
  await page.waitForSelector('.sheet h1');
  await page.click('text=Load sample data');
  await page.click('text=Branding');
  await page.setInputFiles('#f-R09', 'public/icon-512.png');
  await page.fill('#f-R11', 'Sample Co. Quality First');
  await page.setInputFiles('#f-R12', 'public/icon-512.png');
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '/brand.png', fullPage: true });
  // switch off section 4 and 5.6 to check renumbering
  await page.click('text=PQP Sections');
  await page.click('.tree label:has-text("LIST OF ABBREVIATIONS") input');
  await page.click('.tree label:has-text("Factory Acceptance Tests Procedure") input');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('.titleblock >> text=Export PDF')]);
  await dl.saveAs(OUT + '/brand.pdf');
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('.titleblock >> text=Export Word (.docx)')]);
  await dl2.saveAs(OUT + '/brand.docx');
  console.log('ok', JSON.stringify(logs));
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
