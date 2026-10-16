// Inlines the icons into the single-file build (it has no public folder) and names it for the app folder.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
const html = 'dist/single/index.html';
let s = readFileSync(html, 'utf8');
const b64 = (f) => readFileSync('public/' + f).toString('base64');
// tab and home-screen icons, inlined (the links carry a ?v= cache-buster in index.html)
const inline = (file, mime) => { s = s.replace(new RegExp(`href="\\./${file.replace('.', '\\.')}(\\?v=\\w+)?"`), `href="data:${mime};base64,${b64(file)}"`); };
inline('favicon.ico', 'image/x-icon');
inline('favicon-32.png', 'image/png');
inline('favicon-16.png', 'image/png');
inline('icon-180.png', 'image/png');
if (/href="\.\/(favicon|icon-)/.test(s)) throw new Error('an icon link was not inlined');
writeFileSync(html, s);
mkdirSync('dist/release', { recursive: true });
copyFileSync(html, 'dist/release/PQP Maker.html');
copyFileSync('release/README.txt', 'dist/release/README.txt'); // user guide for the app folder
console.log('single file', (s.length / 1048576).toFixed(2), 'MB');
