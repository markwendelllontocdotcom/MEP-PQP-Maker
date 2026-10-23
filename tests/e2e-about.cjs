// About PQP Maker panel: slides in over the app from the side menu and the footer; the form underneath keeps its place;
// closes with the X button, Esc or a click outside; links inside close it and open the input group.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  await page.goto('http://localhost:4176/');
  await page.waitForSelector('.sheet h1');
  await page.click('.nav >> text=4. Key Personnel');
  await page.click('.nav >> text=About PQP Maker');
  await page.waitForSelector('.panel .about');
  await page.waitForTimeout(400); // slide-in
  const box = await page.$eval('.panel', (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) }; });
  console.log('Panel:', await page.textContent('#about-title'), '|', await page.textContent('.about-ver'), '| box', JSON.stringify(box), '| page behind still:', await page.textContent('.sheet h1'));
  console.log('Focus on close button:', await page.evaluate(() => document.activeElement?.classList.contains('panel-close')));
  console.log('Sections:', JSON.stringify(await page.$$eval('.about h2', (e) => e.map((x) => x.textContent))));
  await page.screenshot({ path: OUT + '/about-panel.png' });
  // the panel scrolls on its own
  await page.$eval('.panel-body', (e) => e.scrollTo(0, 99999));
  console.log('Panel scrolls:', await page.$eval('.panel-body', (e) => e.scrollTop > 0), '| page scroll locked:', await page.evaluate(() => document.body.style.overflow === 'hidden'));
  await page.keyboard.press('Escape');
  console.log('Esc closes:', !(await page.$('.panel')), '| still on:', await page.textContent('.sheet h1'), '| scroll unlocked:', await page.evaluate(() => document.body.style.overflow === ''));
  await page.click('.credit >> text=About');
  await page.waitForSelector('.panel');
  await page.mouse.click(200, 450); // outside the panel
  console.log('Footer opens, click outside closes:', !(await page.$('.panel')));
  await page.click('.nav >> text=About PQP Maker');
  await page.click('.panel-close');
  console.log('X closes:', !(await page.$('.panel')));
  await page.click('.nav >> text=About PQP Maker');
  await page.click('.about >> text=PQP Sections');
  console.log('Link closes the panel:', !(await page.$('.panel')), '| goes to:', await page.textContent('.sheet h1'));
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto('http://localhost:4176/');
  await mp.waitForSelector('.sheet h1');
  await mp.click('.nav >> text=About PQP Maker');
  await mp.waitForSelector('.panel .about');
  await mp.waitForTimeout(400);
  const pw = await mp.$eval('.panel', (e) => Math.round(e.getBoundingClientRect().width));
  const over = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('Phone: panel width', pw, '| horizontal scroll', over);
  await mp.screenshot({ path: OUT + '/about-phone.png' });
  console.log('Errors:', JSON.stringify(logs));
  await browser.close();
})();
