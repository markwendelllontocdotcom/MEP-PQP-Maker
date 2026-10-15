import { render } from 'preact';
import { App } from './app';
import './ui/styles.css';
import vfs from './fonts/vfs.json';

// interface font: Carlito (same metrics as the document's Calibri)
try {
  const v: any = vfs;
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'Carlito';font-weight:400;font-display:swap;src:url(data:font/ttf;base64,${v['Carlito-Regular.ttf']}) format('truetype');}@font-face{font-family:'Carlito';font-weight:700;font-display:swap;src:url(data:font/ttf;base64,${v['Carlito-Bold.ttf']}) format('truetype');}`;
  document.head.appendChild(style);
} catch { /* system font fallback */ }

render(<App />, document.getElementById('app')!);

// offline support when served over http(s); the double-click offline copy runs from file:// without it
if (import.meta.env.MODE !== 'single' && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
}
