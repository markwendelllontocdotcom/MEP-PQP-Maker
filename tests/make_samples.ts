import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { buildDoc } from '../src/content/build';
import { makeDocx } from '../src/gen/docx';
import { makePdf } from '../src/gen/pdf';
import { defaultSettings, testProject } from '../src/model/defaults';
import { outputBaseName } from '../src/model/format';
import { nodePlatform } from './node-platform';

const outDir = process.argv[2] || 'samples';
mkdirSync(outDir, { recursive: true });
const s = defaultSettings();
const p = testProject(s);
// cover photo for the sample: the user's reference rendering (15 Oct 2026), to show the photo box layout
const cover = new URL('./fixtures/cover-sample.jpg', import.meta.url).pathname;
if (existsSync(cover)) p.R10 = { name: 'cover-sample.jpg', type: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,' + readFileSync(cover).toString('base64') };
const t0 = Date.now();
const model = await buildDoc(p, s, nodePlatform);
const pdf = await makePdf(model);
model.tocPages = pdf.pages;
const docx = await makeDocx(model);
const base = 'SAMPLE - ' + outputBaseName(p);
writeFileSync(`${outDir}/${base}.pdf`, pdf.bytes);
writeFileSync(`${outDir}/${base}.docx`, docx);
console.log('blocks', model.blocks.length, 'pdf pages', pdf.pageCount, 'toc pages', Object.keys(pdf.pages).length, 'ms', Date.now() - t0);
console.log(base);
