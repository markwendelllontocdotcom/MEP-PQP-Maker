import type { Project } from '../model/types';
import type { Platform } from '../gen/model';
import { esc } from './svgs';

interface Box { role: string; name: string; x: number; y: number; w: number; h: number }

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/** Project organisation chart (Annexure 8.1) drawn from Key Personnel. Units are px at 96 dpi. */
export async function orgChartSvg(p: Project, plat: Platform): Promise<{ svg: string; w: number; h: number }> {
  const fontCss = await plat.fontCss();
  const W = 820, BH = 84, GY = 46, TOP = 14;
  const nm = (x?: string) => (x || '').trim() || 'To be nominated';
  const level1: { role: string; name: string }[] = [
    { role: 'QA/QC Manager', name: nm(p.K02.name) },
    { role: 'HSE Manager / Officer', name: nm(p.K04.name) },
    { role: 'Document Controller', name: nm(p.K05.name) },
    ...p.K06.filter((x) => (x.role || x.name).trim()).map((x) => ({ role: x.role.trim() || 'Staff', name: nm(x.name) })),
  ];
  const n = level1.length;
  const gap = n > 5 ? 12 : 22;
  const bw = Math.min(200, Math.floor((W - 24 - (n - 1) * gap) / n));
  const rowW = n * bw + (n - 1) * gap;
  const x0 = Math.round((W - rowW) / 2);
  const pm: Box = { role: 'Project Manager', name: nm(p.K01.name), x: Math.round((W - 220) / 2), y: TOP, w: 220, h: BH };
  const y1 = TOP + BH + GY;
  const boxes1: Box[] = level1.map((b, i) => ({ ...b, x: x0 + i * (bw + gap), y: y1, w: bw, h: BH }));
  const qaqc = boxes1[0];
  const eng: Box = { role: 'QA/QC Engineer', name: nm(p.K03.name), x: qaqc.x, y: y1 + BH + GY, w: bw, h: BH };
  const H = eng.y + BH + TOP;

  const navy = '#002060', light = '#EEF2F8';
  const lines: string[] = [];
  const busY = pm.y + BH + GY / 2;
  lines.push(`M${pm.x + pm.w / 2},${pm.y + BH}V${busY}`);
  if (n > 1) lines.push(`M${boxes1[0].x + bw / 2},${busY}H${boxes1[n - 1].x + bw / 2}`);
  for (const b of boxes1) lines.push(`M${b.x + bw / 2},${busY}V${b.y}`);
  lines.push(`M${qaqc.x + bw / 2},${qaqc.y + BH}V${eng.y}`);

  const box = (b: Box) => {
    const chars = Math.max(10, Math.floor(b.w / 9.6));
    const role = wrap(b.role, chars), name = wrap(b.name, chars + 2);
    const bandH = role.length > 1 ? 44 : 28;
    const roleT = role.map((l, i) => `<text x="${b.x + b.w / 2}" y="${b.y + 20 + i * 17}" text-anchor="middle" font-family="Carlito" font-weight="700" font-size="17" fill="#ffffff">${esc(l)}</text>`).join('');
    const nameT = name.map((l, i) => `<text x="${b.x + b.w / 2}" y="${b.y + bandH + 24 + i * 18}" text-anchor="middle" font-family="Carlito" font-size="18" fill="#1a1a1a">${esc(l)}</text>`).join('');
    return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="${light}" stroke="${navy}" stroke-width="1.5"/>
<path d="M${b.x},${b.y + 6}a6,6 0 0 1 6,-6h${b.w - 12}a6,6 0 0 1 6,6v${bandH - 6}h${-b.w}z" fill="${navy}"/>${roleT}${nameT}`;
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontCss}</style>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<path d="${lines.join('')}" stroke="${navy}" stroke-width="1.6" fill="none"/>
${[pm, ...boxes1, eng].map(box).join('\n')}
</svg>`;
  return { svg, w: W, h: H };
}
