import pdfMakeLib from 'pdfmake/build/pdfmake';
import vfsJson from '../fonts/vfs.json';
import type { Block, DocModel, Run, Row, Cell } from './model';
import { PAGE, CONTENT_W, NAVY, COVER_BOX } from './model';
import { assetDataUrl } from '../content/svgs';
import { APP_NAME } from '../version';

const pdfMake: any = (pdfMakeLib as any).default || pdfMakeLib;
export const FONTS = {
  Carlito: { normal: 'Carlito-Regular.ttf', bold: 'Carlito-Bold.ttf', italics: 'Carlito-Italic.ttf', bolditalics: 'Carlito-BoldItalic.ttf' },
  Symbols: { normal: 'Symbols.ttf', bold: 'Symbols.ttf', italics: 'Symbols.ttf', bolditalics: 'Symbols.ttf' },
};
const pt = (tw: number) => tw / 20;
/** hyphens inside words become non-breaking so justified lines do not open a gap after them */
const nbh = (t: string) => t.replace(/(?<=[A-Za-z0-9])-(?=[A-Za-z0-9])/g, '\u2011');
const W_PT = 595.28, H_PT = 841.89;
const SYMBOL_LABELS = new Set(['➢', '▪', '✓']);

function inl(r: Run, defSz: number, extra: any = {}): any {
  const o: any = { text: nbh(r.x.replace(/\t+/g, '    ')), fontSize: (r.sz || defSz) / 2, ...extra };
  if (r.b) o.bold = true;
  if (r.i) o.italics = true;
  if (r.u) o.decoration = 'underline';
  if (r.c && r.c !== 'auto') o.color = '#' + r.c;
  return o;
}
const inls = (rs: Run[], sz: number, extra: any = {}) => rs.map((r) => inl(r, sz, extra));
const plain = (rs: Run[]) => rs.map((r) => r.x).join('');

function cellNode(c: Cell, sz: number, mark = false): any {
  const stack = (c.p.length ? c.p : [{ r: [] }]).map((cp) => {
    const t = inls(cp.r.map((r) => ({ ...r, b: (r.b || c.bold ? 1 : undefined) as 1 | undefined, c: c.color || r.c })), sz);
    const node: any = { text: t.length ? t : ' ', alignment: cp.jc === 'center' ? 'center' : cp.jc === 'right' ? 'right' : cp.jc === 'both' ? 'justify' : 'left', margin: [0, 1, 0, 1] };
    if (mark) node.headlineLevel = 2;
    if (cp.li) return { columns: [{ width: 10, text: '•', fontSize: sz / 2, headlineLevel: mark ? 2 : undefined }, { width: '*', ...node }], columnGap: 2, headlineLevel: mark ? 2 : undefined };
    return node;
  });
  const o: any = { stack };
  if (mark) o.headlineLevel = 2;
  if (c.fill) o.fillColor = '#' + c.fill;
  if (c.span && c.span > 1) o.colSpan = c.span;
  return o;
}

/** Short tables (up to 15 rows) are kept on one page: the table node is level 3 and its cells level 2,
 *  so the keep-with-next rule can see a short table that would split. */
function tableNode(t: { grid: number[]; rows: Row[]; jc?: string; ind?: number; sz?: number }, borders = true): any {
  const sz = t.sz || 20;
  const small = t.rows.length <= 15;
  const body: any[][] = t.rows.map((r) => {
    const cells: any[] = [];
    for (const c of r.c) {
      cells.push(cellNode(c, sz, small));
      for (let i = 1; i < (c.span || 1); i++) cells.push({});
    }
    return cells;
  });
  const headerRows = t.rows.findIndex((r) => !r.header);
  const tbl: any = {
    headlineLevel: small ? 3 : undefined,
    table: { widths: t.grid.map((g) => pt(g) - 8.5), body, headerRows: headerRows > 0 ? headerRows : 0, dontBreakRows: !small, heights: t.rows.map((r) => (r.minH ? pt(r.minH) : 'auto')) },
    layout: borders
      ? { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#000000', vLineColor: () => '#000000', paddingLeft: () => 4.25, paddingRight: () => 4.25, paddingTop: () => 1.5, paddingBottom: () => 1.5 }
      : 'noBorders',
    margin: [0, 2, 0, 8],
  };
  const totalPt = t.grid.reduce((a, b) => a + b, 0) / 20;
  if (t.jc === 'center') tbl.margin = [Math.max(0, (pt(CONTENT_W) - totalPt) / 2), 2, 0, 8];
  else if (t.ind) tbl.margin = [pt(t.ind), 2, 0, 8];
  return tbl;
}

/** Splits "Label<tabs>(CODE)" style lines into two columns, as R1 uses tab stops for them. */
function tabbedNode(b: Extract<Block, { t: 'p' }>, sz: number): any {
  const text = plain(b.r);
  const parts = text.split(/\t+/).map((s) => s.trim()).filter((s, i) => s || i === 0);
  const left = pt(b.l);
  if (parts.length < 2) return { text: inls(b.r, sz), margin: [left, 0, 0, pt(b.after ?? 120)] };
  const bold = b.r.some((r) => r.b);
  const firstW = parts[0].length <= 4 ? 28 : 200;
  return {
    columns: [{ width: firstW, text: parts[0], bold }, { width: '*', text: parts.slice(1).join('   '), bold }],
    columnGap: 6, fontSize: sz / 2, margin: [left, 0, 0, pt(b.after ?? 120)],
  };
}

export interface PdfResult { bytes: Uint8Array; pages: Record<string, number>; pageCount: number }

export function pdfDefinition(m: DocModel, pages: Record<string, number>): any {
  // every image is embedded once and referenced by key (the header and watermark repeat on each page)
  const images: Record<string, string> = {};
  const img = (k: string) => { if (!images[k]) images[k] = assetDataUrl(m.images[k]); return k; };
  const content: any[] = [];
  const c = m.cover;

  // ---------------- cover
  content.push({ text: c.docRefLine, bold: true, fontSize: 10 });
  content.push({ text: c.revLine, bold: true, fontSize: 10, margin: [0, 0, 0, 10] });
  content.push({ text: c.title, bold: true, fontSize: 18, alignment: 'center', margin: [0, 0, 0, 8] });
  // cover photo box: 16.5 cm x exactly 11.6 cm, centred; photo stretched to 16 x 11 cm
  const boxW = pt(COVER_BOX.w), boxH = pt(COVER_BOX.h), line = 0.75;
  const innerW = boxW - 2 * line, innerH = boxH - 2 * line;
  let photo: any;
  if (c.photo) {
    const pw = pt(COVER_BOX.photoW), ph = pt(COVER_BOX.photoH);
    photo = { image: img(c.photo), width: pw, height: ph, margin: [(innerW - pw) / 2, (innerH - ph) / 2, 0, 0] };
  } else photo = { text: 'Project Cover Photo Here', alignment: 'center', fontSize: 11, margin: [0, innerH / 2 - 7, 0, 0] };
  content.push({
    table: { widths: [innerW], heights: [innerH], body: [[photo]] },
    layout: { hLineWidth: () => line, vLineWidth: () => line, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
    margin: [(pt(CONTENT_W) - boxW) / 2, 0, 0, 0],
  });
  if (c.logos.length) {
    content.push({ columns: c.logos.map((k) => ({ width: '*', stack: [{ image: img(k), fit: [180, 40], alignment: 'center' }] })), margin: [0, 6, 0, 0] });
  }
  content.push({
    table: { widths: [pt(2000) - 4, pt(340) - 4, '*'], body: c.parties.map(([k, v]) => [{ text: k, bold: true }, { text: ':', bold: true }, { text: v, bold: true }]) },
    layout: { defaultBorder: false, paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 1.5, paddingBottom: () => 1.5 },
    fontSize: 10, margin: [0, 8, 0, 0],
  });
  content.push({ text: c.statement, fontSize: 10, alignment: 'justify', margin: [0, 8, 0, 5] });
  content.push({ text: [{ text: 'Document Status: ', bold: true }, c.status || '-'], fontSize: 10, margin: [0, 0, 0, 3] });
  const H = (t: string) => ({ text: t, bold: true, color: '#FFFFFF', fillColor: '#' + NAVY, alignment: 'center' });
  const L = (t: string) => ({ text: t, bold: true, fillColor: '#F2F2F2' });
  content.push({
    table: {
      widths: [pt(1900) - 8.5, pt(2524) - 8.5, pt(2524) - 8.5, pt(2524) - 8.5],
      heights: ['auto', 'auto', 'auto', pt(760), pt(400)],
      body: [
        [H(''), ...c.signatures.map((s) => H(s.role))],
        [L('Name'), ...c.signatures.map((s) => ({ text: s.name || ' ', alignment: 'center' }))],
        [L('Designation'), ...c.signatures.map((s) => ({ text: s.desig || ' ', alignment: 'center' }))],
        [L('Signature'), ' ', ' ', ' '],
        [L('Date'), ' ', ' ', ' '],
      ],
    },
    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, paddingLeft: () => 4.25, paddingRight: () => 4.25, paddingTop: () => 2, paddingBottom: () => 2 },
    fontSize: 10,
  });

  // ---------------- table of contents
  content.push({ text: 'Table of Contents', bold: true, fontSize: 12, alignment: 'center', pageBreak: 'before', margin: [0, 0, 0, 12] });
  const heads = m.blocks.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h');
  content.push({
    table: {
      widths: [26, '*', 30],
      body: heads.map((h) => {
        const l1 = h.lvl === 1;
        return [
          { text: l1 ? h.num : '', bold: l1, fontSize: 10.5 },
          { text: l1 ? h.x : [{ text: h.num + '   ' }, { text: h.x }], bold: l1, fontSize: 10.5, margin: [l1 ? 0 : 10, 0, 0, 0] },
          { text: '', pageReference: h.id, alignment: 'right', fontSize: 10.5, bold: l1 },
        ];
      }),
    },
    layout: { defaultBorder: false, paddingTop: () => 1.6, paddingBottom: () => 1.6, paddingLeft: () => 0, paddingRight: () => 0 },
  });

  // ---------------- body
  let first = true;
  m.blocks.forEach((b, bi) => {
    const nb = m.blocks[bi + 1];
    const beforeSmallTable = !!nb && ((nb.t === 'tbl' && nb.rows.length <= 15) || nb.t === 'img');
    switch (b.t) {
      case 'h': {
        const hang = b.lvl === 1 ? pt(567) : pt(851);
        content.push({
          columns: [{ width: hang, text: b.num, bold: true, headlineLevel: 2 }, { width: '*', text: b.x, bold: true, decoration: 'underline', id: b.id, headlineLevel: 2 }],
          columnGap: 0, fontSize: 12, margin: [0, first ? 0 : 12, 0, 6], headlineLevel: 1, pageBreak: first ? 'before' : undefined,
        });
        first = false;
        break;
      }
      case 'n': {
        const lay: Record<number, [number, number]> = { 2: [851, 851], 3: [851, 851], 4: [1080, 1080], 5: [1931, 1080], 6: [2160, 1200] };
        const [l, h] = lay[b.d] || [2160, 1200];
        const keep = b.title || beforeSmallTable;
        const node: any = {
          columns: [{ width: pt(h), text: b.num, headlineLevel: keep ? 2 : undefined }, { width: '*', text: inls(b.r, b.sz), alignment: b.jc === 'left' ? 'left' : 'justify', headlineLevel: keep ? 2 : undefined }],
          columnGap: 0, fontSize: b.sz / 2, margin: [pt(l - h), b.title ? 6 : 0, 0, b.title ? 5 : 8],
        };
        if (keep) node.headlineLevel = 1;
        content.push(node);
        break;
      }
      case 'p': {
        if (b.tabs || /\t/.test(plain(b.r))) { content.push(tabbedNode(b, b.sz)); break; }
        const node: any = { text: inls(b.r, b.sz), alignment: b.jc === 'center' ? 'center' : b.jc === 'left' ? 'left' : 'justify', margin: [pt(b.l || 0), pt(b.before || 0), 0, pt(b.after ?? 120)] };
        if (b.pbBefore) node.pageBreak = 'before';
        if (b.keep || beforeSmallTable) node.headlineLevel = 1;
        content.push(node);
        break;
      }
      case 'li': {
        const sym = SYMBOL_LABELS.has(b.label);
        content.push({
          // the label line is given the same height as the text line so both move to a new page together
          columns: [{ width: pt(b.h), text: b.label, font: sym ? 'Symbols' : undefined, fontSize: sym ? (b.sz / 2) * 0.85 : b.sz / 2, lineHeight: sym ? (1.2207 * b.sz / 2) / (1.1641 * (b.sz / 2) * 0.85) : 1 }, { width: '*', text: inls(b.r, b.sz), alignment: b.jc === 'left' ? 'left' : 'justify' }],
          columnGap: 0, fontSize: b.sz / 2, margin: [pt(b.l - b.h), 0, 0, 3],
        });
        break;
      }
      case 'tbl':
        content.push(tableNode(b));
        break;
      case 'img':
        content.push({ image: img(b.key), width: pt(b.w), height: pt(b.h), alignment: 'center', margin: [0, 3, 0, 8] });
        break;
      case 'pb':
        content.push({ text: '', pageBreak: 'after' });
        break;
    }
  });

  const banner = m.images[m.banner];
  const wm = m.watermark ? m.images[m.watermark] : null;
  let wmNode: any = null;
  if (wm) {
    const maxW = 467.8, maxH = 399.15;
    let w = maxW, h = (maxW * wm.h) / wm.w;
    if (h > maxH) { h = maxH; w = (maxH * wm.w) / wm.h; }
    const cx = pt(PAGE.left) + pt(CONTENT_W) / 2, cy = pt(PAGE.top) + (H_PT - pt(PAGE.top) - pt(PAGE.bottom)) / 2;
    wmNode = { image: img(m.watermark!), width: w, height: h, absolutePosition: { x: cx - w / 2, y: cy - h / 2 } };
  }
  const bannerUrl = img(m.banner);
  const wmUrlNode = wmNode;

  return {
    pageSize: 'A4',
    pageMargins: [pt(PAGE.left), pt(PAGE.top), pt(PAGE.right), pt(PAGE.bottom)],
    info: { title: `Project Quality Plan - ${m.meta.project || ''}`, subject: m.docRef, creator: APP_NAME, producer: APP_NAME },
    defaultStyle: { font: 'Carlito', fontSize: 12, lineHeight: 1.0 },
    background: () => [
      ...(wmUrlNode ? [wmUrlNode] : []),
      { image: bannerUrl, width: 614.1, height: 81.1, absolutePosition: { x: 0, y: 13.04 } },
    ],
    // footer nodes are marked (headlineLevel 2) so the keep-with-next check ignores them
    footer: (page: number, count: number) => ({
      margin: [pt(PAGE.left), 14, pt(PAGE.right), 0], headlineLevel: 2,
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: pt(CONTENT_W), y2: 0, lineWidth: 0.5, lineColor: '#D9D9D9' }], headlineLevel: 2 },
        { columns: [{ text: m.footerLeft, width: '*', headlineLevel: 2 }, { text: `Page ${page} of ${count}`, width: 'auto', headlineLevel: 2 }], fontSize: 9, color: '#595959', margin: [0, 3, 0, 0], headlineLevel: 2 },
      ],
    }),
    content,
    images,
    pageBreakBefore: (node: any, following: any[]) => {
      if (node.id && node.startPosition) pages[node.id] = node.startPosition.pageNumber;
      // a short table that would run onto the next page starts on a new page
      if (node.headlineLevel === 3) return (node.pageNumbers || []).length > 1;
      if (node.headlineLevel !== 1) return false;
      // keep with next. pdfmake checks each node once, so a heading followed only by another
      // keep-with-next block, or by a short table that will move, counts as stranded too.
      return following.filter((f: any) => f.headlineLevel !== 2 && f.headlineLevel !== 1 && !(f.headlineLevel === 3 && (f.pageNumbers || []).length > 1)).length === 0;
    },
  };
}

export function makePdf(m: DocModel): Promise<PdfResult> {
  const pages: Record<string, number> = {};
  const def = pdfDefinition(m, pages);
  return new Promise((resolve, reject) => {
    try {
      const doc = pdfMake.createPdf(def, undefined, FONTS, vfsJson);
      doc.getBuffer((buf: any) => {
        const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        resolve({ bytes, pages: { ...pages }, pageCount: countPages(bytes) });
      });
    } catch (e) { reject(e); }
  });
}

function countPages(bytes: Uint8Array): number {
  // count "/Type /Page" objects (not /Pages)
  let n = 0;
  const s = new TextDecoder('latin1').decode(bytes);
  const re = /\/Type\s*\/Page[^s]/g;
  while (re.exec(s)) n++;
  return n;
}
