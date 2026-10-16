// Copies the installable web build (dist/web) to docs/, which GitHub Pages serves from the main branch.
import { rmSync, cpSync, writeFileSync, existsSync } from 'node:fs';
if (!existsSync('dist/web/index.html')) throw new Error('Run npm run build first');
rmSync('docs', { recursive: true, force: true });
cpSync('dist/web', 'docs', { recursive: true });
writeFileSync('docs/.nojekyll', ''); // serve files as they are (no Jekyll processing)
console.log('docs/ ready for GitHub Pages');
