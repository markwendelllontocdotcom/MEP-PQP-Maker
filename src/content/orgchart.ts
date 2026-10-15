import type { Project } from '../model/types';
import type { Platform } from '../gen/model';
import { esc } from './svgs';

/**
 * Annexure 8.1 organisation chart, drawn to the Oxypro "QA/QC Department Organization Chart":
 * QA/QC Manager (functional line to the Projects Director), QA/QC Engineers, Document Controller
 * and the Construction Team (Projects Director, Project Manager, Construction Managers & Senior
 * Engineers, Project Engineers). Boxes carry the role titles; names go in the table under the chart.
 * Units are px at 96 dpi.
 */
export const QE_MAX = 3;

const NAVY = '#002060';
const INK = '#1a1a1a';
const FONT = "Carlito, Calibri, 'Segoe UI', Arial, sans-serif";

interface Box { x: number; y: number; w: number; h: number; lines: string[]; fill: boolean; tag: string }

export function qaqcEngineerCount(p: Project): number {
  const n = Array.isArray(p.K03) ? p.K03.length : 1;
  return Math.min(QE_MAX, Math.max(1, n));
}

/** Builds the chart. fontCss embeds Carlito (exports); tags adds the input ids beside each box (app preview). */
export function orgChart(p: Project, fontCss: string | null, tags = false): { svg: string; w: number; h: number } {
  const M = 10;
  const n = qaqcEngineerCount(p);
  const BH = 54;
  const EW = n === 3 ? 176 : 196;            // QA/QC Engineer boxes
  const EG = n === 3 ? 34 : 64;
  const MW = 214;                            // QA/QC Manager
  const DW = 250;                            // Document Controller
  const CW = 220;                            // Construction Team boxes
  const GP = 16;                             // padding inside the Construction Team frame
  const leftW = Math.max(n * EW + (n - 1) * EG, 300);
  const cx = M + leftW / 2;
  const gx = M + leftW + 70;                 // Construction Team frame
  const colX = gx + GP;
  const colCx = colX + CW / 2;
  const W = gx + CW + 2 * GP + M;

  const yTop = 112;
  const pd: Box = { x: colX, y: yTop, w: CW, h: BH, lines: ['PROJECTS DIRECTOR'], fill: true, tag: 'K07' };
  const pm: Box = { x: colX, y: pd.y + BH + 20, w: CW, h: BH, lines: ['PROJECT MANAGER'], fill: true, tag: 'K01' };
  const linkY = pm.y + BH + 28;
  const cm: Box = { x: colX, y: pm.y + BH + 56, w: CW, h: BH, lines: ['CONSTRUCTION MANAGERS', '& SENIOR ENGINEERS'], fill: true, tag: 'K08' };
  const pe: Box = { x: colX, y: cm.y + BH + 20, w: CW, h: BH, lines: ['PROJECT ENGINEERS'], fill: false, tag: 'K09' };
  const gTop = yTop - 24, gBot = pe.y + BH + 28;

  const qm: Box = { x: cx - MW / 2, y: yTop, w: MW, h: BH, lines: ['QA/QC MANAGER'], fill: true, tag: 'K02' };
  const busY = linkY + 34;
  const eTop = busY + 62;
  const rowW = n * EW + (n - 1) * EG;
  const engs: Box[] = Array.from({ length: n }, (_, i) => ({ x: cx - rowW / 2 + i * (EW + EG), y: eTop, w: EW, h: BH, lines: ['QA/QC ENGINEER'], fill: false, tag: 'K03' }));
  const barY = eTop + BH + 46;
  const dc: Box = { x: cx - DW / 2, y: barY + 46, w: DW, h: 50, lines: ['DOCUMENT CONTROLLER'], fill: false, tag: 'K05' };
  const H = dc.y + dc.h + M + 4;

  // connectors (solid = direct reporting, dashed = functional reporting)
  const solid: string[] = [];
  const mid = (b: Box) => b.x + b.w / 2;
  solid.push(`M${colCx},${pd.y + BH}V${pm.y}`, `M${colCx},${pm.y + BH}V${cm.y}`, `M${colCx},${cm.y + BH}V${pe.y}`);
  solid.push(`M${cx},${qm.y + BH}V${busY}`, `M${cx},${linkY}H${colCx}`);
  if (n > 1) solid.push(`M${mid(engs[0])},${busY}H${mid(engs[n - 1])}`);
  for (const e of engs) solid.push(`M${mid(e)},${busY}V${e.y}`, `M${mid(e)},${e.y + BH}V${barY}`);
  if (n > 1) solid.push(`M${mid(engs[0])},${barY}H${mid(engs[n - 1])}`);
  solid.push(`M${cx},${barY}V${dc.y}`);
  const dashed = `M${qm.x + MW},${yTop + BH / 2}H${colX}`;

  const box = (b: Box) => {
    const size = b.fill ? 15.5 : 17;
    const lh = size * 1.25;
    const y0 = b.y + b.h / 2 - ((b.lines.length - 1) * lh) / 2 + size * 0.35;
    const text = b.lines
      .map((l, i) => `<text x="${b.x + b.w / 2}" y="${(y0 + i * lh).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${size}" fill="${b.fill ? '#ffffff' : INK}">${esc(l)}</text>`)
      .join('');
    const rect = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${b.fill ? NAVY : '#ffffff'}" stroke="${NAVY}" stroke-width="1.3"/>`;
    const tag = tags
      ? `<rect x="${b.x + b.w - 34}" y="${b.y - 9}" width="38" height="18" rx="9" fill="#D72025"/><text x="${b.x + b.w - 15}" y="${b.y + 4.5}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="12" fill="#ffffff">${b.tag}</text>`
      : '';
    return rect + text + tag;
  };

  // legend (top right) and title
  const lx = W - M - 196;
  const legend = `<path d="M${lx},58H${lx + 62}" stroke="${INK}" stroke-width="1.1" stroke-dasharray="3 2.5"/><text x="${lx + 76}" y="62" font-family="${FONT}" font-size="12.5" fill="${INK}">Functional Reporting</text>
<path d="M${lx},80H${lx + 62}" stroke="${INK}" stroke-width="1.1"/><text x="${lx + 76}" y="84" font-family="${FONT}" font-size="12.5" fill="${INK}">Direct Reporting</text>`;
  const title = `<text x="${W / 2}" y="30" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="20" fill="${NAVY}">QA/QC DEPARTMENT ORGANIZATION CHART</text>`;
  const label = 'Construction Team';
  const lw = 112;
  const frame = `<rect x="${gx}" y="${gTop}" width="${CW + 2 * GP}" height="${gBot - gTop}" rx="28" fill="none" stroke="#A6A6A6" stroke-width="1.2"/>
<rect x="${colCx - lw / 2}" y="${gBot - 8}" width="${lw}" height="16" fill="#ffffff"/><text x="${colCx}" y="${gBot + 4.5}" text-anchor="middle" font-family="${FONT}" font-size="13" fill="${INK}">${label}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${fontCss ? `<style>${fontCss}</style>` : ''}
<rect width="${W}" height="${H}" fill="#ffffff"/>
${title}
${legend}
${frame}
<path d="${solid.join('')}" stroke="${INK}" stroke-width="1.2" fill="none"/>
<path d="${dashed}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>
${[qm, pd, pm, cm, pe, ...engs, dc].map(box).join('\n')}
</svg>`;
  return { svg, w: W, h: H };
}

export async function orgChartSvg(p: Project, plat: Platform): Promise<{ svg: string; w: number; h: number }> {
  return orgChart(p, await plat.fontCss());
}
