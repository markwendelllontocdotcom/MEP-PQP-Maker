// Inlines the icons into the single-file build (it has no public folder) and names it for the app folder.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
const html = 'dist/single/index.html';
let s = readFileSync(html, 'utf8');
const b64 = (f) => readFileSync('public/' + f).toString('base64');
s = s.replace('href="./icon-32.png"', `href="data:image/png;base64,${b64('icon-32.png')}"`)
     .replace('href="./icon-180.png"', `href="data:image/png;base64,${b64('icon-180.png')}"`);
writeFileSync(html, s);
mkdirSync('dist/release', { recursive: true });
copyFileSync(html, 'dist/release/PQP Maker.html');
console.log('single file', (s.length / 1048576).toFixed(2), 'MB');
