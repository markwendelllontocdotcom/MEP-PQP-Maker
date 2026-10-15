import JSZip from 'jszip';
import partsJson from '../content/docx-parts.json';
import type { Block, DocModel, Run, Row, Cell, CellPara } from './model';
import { PAGE, CONTENT_W, NAVY } from './model';
import { APP_NAME, APP_VERSION } from '../version';

const parts: any = partsJson;
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const EMU = 635; // per twip
const HNUM = 900; // numbering id for the section hierarchy

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

function rPr(r: Partial<Run>, extra = ''): string {
  let s = '';
  if (r.b) s += '<w:b/><w:bCs/>';
  if (r.i) s += '<w:i/><w:iCs/>';
  if (r.c) s += `<w:color w:val="${r.c}"/>`;
  if (r.sz) s += `<w:sz w:val="${r.sz}"/><w:szCs w:val="${r.sz}"/>`;
  if (r.u) s += '<w:u w:val="single"/>';
  s += extra;
  return s ? `<w:rPr>${s}</w:rPr>` : '';
}

function run(r: Run, defSz?: number): string {
  const props = rPr({ ...r, sz: r.sz || defSz });
  const pieces = r.x.split(/(\t|\n)/);
  return pieces
    .filter((p) => p !== '')
    .map((p) => (p === '\t' ? `<w:r>${props}<w:tab/></w:r>` : p === '\n' ? `<w:r>${props}<w:br/></w:r>` : `<w:r>${props}<w:t xml:space="preserve">${x(p)}</w:t></w:r>`))
    .join('');
}
const runs = (rs: Run[], sz?: number) => rs.map((r) => run(r, sz)).join('');

interface PP {
  style?: string; keepNext?: boolean; num?: [string | number, string | number]; tabs?: string; before?: number; after?: number; line?: number;
  ind?: { l?: number; h?: number; f?: number; r?: number }; ctx0?: boolean; jc?: string; pbBefore?: boolean; border?: string;
}
function pPr(o: PP): string {
  let s = '';
  if (o.style) s += `<w:pStyle w:val="${o.style}"/>`;
  if (o.keepNext) s += '<w:keepNext/>';
  if (o.pbBefore) s += '<w:pageBreakBefore/>';
  if (o.num) s += `<w:numPr><w:ilvl w:val="${o.num[1]}"/><w:numId w:val="${o.num[0]}"/></w:numPr>`;
  if (o.border) s += o.border;
  if (o.tabs) s += `<w:tabs>${o.tabs}</w:tabs>`;
  if (o.before != null || o.after != null || o.line != null)
    s += `<w:spacing${o.before != null ? ` w:before="${o.before}"` : ''}${o.after != null ? ` w:after="${o.after}"` : ''}${o.line != null ? ` w:line="${o.line}" w:lineRule="auto"` : ''}/>`;
  if (o.ind) {
    const i = o.ind;
    s += `<w:ind${i.l != null ? ` w:left="${i.l}"` : ''}${i.r != null ? ` w:right="${i.r}"` : ''}${i.h ? ` w:hanging="${i.h}"` : ''}${!i.h && i.f ? ` w:firstLine="${i.f}"` : ''}/>`;
  }
  if (o.ctx0) s += '<w:contextualSpacing w:val="0"/>';
  if (o.jc) s += `<w:jc w:val="${o.jc}"/>`;
  return s ? `<w:pPr>${s}</w:pPr>` : '';
}
const para = (o: PP, content: string) => `<w:p>${pPr(o)}${content}</w:p>`;

// ------------------------------------------------------------------ images
class Media {
  items: { rid: string; file: string; bytes: Uint8Array }[] = [];
  byKey: Record<string, string> = {};
  private n = 0;
  constructor(private m: DocModel, private prefix: string) {}
  rid(key: string): string {
    if (this.byKey[key]) return this.byKey[key];
    const a = this.m.images[key];
    this.n++;
    const rid = `${this.prefix}${this.n}`;
    this.items.push({ rid, file: `${this.prefix.toLowerCase()}${this.n}.${a.type === 'png' ? 'png' : 'jpeg'}`, bytes: a.bytes });
    this.byKey[key] = rid;
    return rid;
  }
}
let docPrId = 100;
function graphic(rid: string, cx: number, cy: number, name: string) {
  return `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${x(name)}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>`;
}
function inlineImg(rid: string, wTw: number, hTw: number, name = 'Picture') {
  docPrId++;
  const cx = Math.round(wTw * EMU), cy = Math.round(hTw * EMU);
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${docPrId}" name="${x(name)} ${docPrId}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>${graphic(rid, cx, cy, name)}</wp:inline></w:drawing></w:r>`;
}
function anchorImg(rid: string, cx: number, cy: number, pos: string, behind: boolean, name: string) {
  docPrId++;
  return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${behind ? 251650000 : 251658240}" behindDoc="${behind ? 1 : 0}" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/>${pos}<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${docPrId}" name="${x(name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>${graphic(rid, cx, cy, name)}</wp:anchor></w:drawing></w:r>`;
}

// ------------------------------------------------------------------ tables
const BORDERS = '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders>';
const NOBORDERS = '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';

function cellPara(cp: CellPara, cl: Cell, sz: number, keep = false): string {
  const rs = cp.r.map((r) => ({ ...r, b: (r.b || cl.bold ? 1 : undefined) as 1 | undefined, c: cl.color || r.c }));
  const o: PP = { after: 20, before: 20, jc: cp.jc || 'left', keepNext: keep };
  if (cp.li) { o.num = ['12', '0']; o.ind = { l: 284, h: 284 }; o.style = 'ListParagraph'; o.ctx0 = true; }
  return para(o, runs(rs, sz));
}
function table(t: { grid: number[]; rows: Row[]; jc?: string; ind?: number; sz?: number }, opts: { borders?: boolean } = {}): string {
  const total = t.grid.reduce((a, b) => a + b, 0);
  const sz = t.sz || 20;
  let s = `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${t.jc ? `<w:jc w:val="${t.jc}"/>` : ''}${!t.jc && t.ind ? `<w:tblInd w:w="${t.ind}" w:type="dxa"/>` : ''}${opts.borders === false ? NOBORDERS : BORDERS}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="85" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${t.grid.map((g) => `<w:gridCol w:w="${g}"/>`).join('')}</w:tblGrid>`;
  const small = t.rows.length <= 15;
  t.rows.forEach((r, ri) => {
    const keep = small && ri < t.rows.length - 1;
    s += `<w:tr><w:trPr><w:cantSplit/>${r.minH ? `<w:trHeight w:val="${r.minH}"/>` : ''}${r.header ? '<w:tblHeader/>' : ''}</w:trPr>`;
    let col = 0;
    for (const c of r.c) {
      const span = c.span || 1;
      const w = t.grid.slice(col, col + span).reduce((a, b) => a + b, 0);
      col += span;
      s += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${c.vm ? `<w:vMerge${c.vm === 'restart' ? ' w:val="restart"' : ''}/>` : ''}${c.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${c.fill}"/>` : ''}<w:vAlign w:val="${c.va || 'top'}"/></w:tcPr>`;
      s += (c.p.length ? c.p : [{ r: [] }]).map((cp) => cellPara(cp, c, sz, keep)).join('');
      s += '</w:tc>';
    }
    s += '</w:tr>';
  });
  return s + '</w:tbl>';
}

// ------------------------------------------------------------------ fields
const fld = (instr: string, shown: string, rp = '') =>
  `<w:r>${rp}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rp}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r>${rp}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rp}<w:t>${shown}</w:t></w:r><w:r>${rp}<w:fldChar w:fldCharType="end"/></w:r>`;

// ------------------------------------------------------------------ document
export async function makeDocx(m: DocModel): Promise<Uint8Array> {
  docPrId = 100;
  const body = new Media(m, 'rIdImg');
  const hdr = new Media(m, 'rIdH');
  const out: string[] = [];
  const c = m.cover;

  // ---- cover
  const b10 = (t: string) => run({ x: t, b: 1, sz: 20 });
  out.push(para({ after: 0 }, b10(c.docRefLine)));
  out.push(para({ after: 0 }, b10(c.revLine)));
  out.push(para({ after: 120 }, ''));
  out.push(para({ jc: 'center', after: 200 }, run({ x: c.title, b: 1, sz: 36 })));
  // photo box
  const boxW = 9325, boxH = 5330;
  let photoCell: string;
  if (c.photo) {
    const a = m.images[c.photo];
    let w = boxW - 200, h = Math.round((w * a.h) / a.w);
    if (h > boxH - 200) { h = boxH - 200; w = Math.round((h * a.w) / a.h); }
    photoCell = para({ jc: 'center', after: 0 }, inlineImg(body.rid(c.photo), w, h, 'Cover photo'));
  } else photoCell = para({ jc: 'center', after: 0 }, run({ x: 'Project Cover Photo Here', sz: 22 }));
  out.push(`<w:tbl><w:tblPr><w:tblW w:w="${boxW}" w:type="dxa"/><w:jc w:val="center"/>${BORDERS}<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="${boxW}"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="${boxH}" w:hRule="exact"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="${boxW}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${photoCell}</w:tc></w:tr></w:tbl>`);
  if (c.logos.length) {
    const cells = c.logos.map((k) => {
      const a = m.images[k];
      const h = 800, w = Math.min(3600, Math.round((h * a.w) / a.h));
      return `<w:tc><w:tcPr><w:tcW w:w="${Math.floor(boxW / c.logos.length)}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${para({ jc: 'center', before: 120, after: 0 }, inlineImg(body.rid(k), w, Math.round((w * a.h) / a.w), 'Logo'))}</w:tc>`;
    });
    out.push(`<w:tbl><w:tblPr><w:tblW w:w="${boxW}" w:type="dxa"/><w:jc w:val="center"/>${NOBORDERS}<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${c.logos.map(() => `<w:gridCol w:w="${Math.floor(boxW / c.logos.length)}"/>`).join('')}</w:tblGrid><w:tr>${cells.join('')}</w:tr></w:tbl>`);
  }
  out.push(para({ after: 80 }, ''));
  out.push(table({
    grid: [2000, 340, CONTENT_W - 2340],
    rows: c.parties.map(([k, v]) => ({ c: [{ p: [{ r: [{ x: k, b: 1 }] }] }, { p: [{ r: [{ x: ':', b: 1 }] }] }, { p: [{ r: [{ x: v, b: 1 }] }] }] })),
    sz: 20,
  }, { borders: false }));
  out.push(para({ before: 240, after: 120, jc: 'both' }, run({ x: c.statement, sz: 20 })));
  out.push(para({ after: 60 }, run({ x: 'Document Status: ', b: 1, sz: 20 }) + run({ x: c.status || '-', sz: 20 })));
  const sigHead = (t: string): Cell => ({ p: [{ r: [{ x: t, b: 1 }], jc: 'center' }], fill: NAVY, color: 'FFFFFF', va: 'center' });
  const lab = (t: string): Cell => ({ p: [{ r: [{ x: t, b: 1 }] }], fill: 'F2F2F2', va: 'center' });
  out.push(table({
    grid: [1900, 2524, 2524, 2524],
    rows: [
      { header: true, c: [sigHead(''), ...c.signatures.map((s) => sigHead(s.role))] },
      { c: [lab('Name'), ...c.signatures.map((s) => ({ p: [{ r: [{ x: s.name }], jc: 'center' }], va: 'center' } as Cell))] },
      { c: [lab('Designation'), ...c.signatures.map((s) => ({ p: [{ r: [{ x: s.desig }], jc: 'center' }], va: 'center' } as Cell))] },
      { c: [lab('Signature'), { p: [{ r: [] }] }, { p: [{ r: [] }] }, { p: [{ r: [] }] }], minH: 760 },
      { c: [lab('Date'), { p: [{ r: [] }] }, { p: [{ r: [] }] }, { p: [{ r: [] }] }], minH: 400 },
    ],
    jc: 'center', sz: 20,
  }));

  // ---- table of contents (Word field, pre-filled with the PDF page numbers)
  out.push(para({ pbBefore: true, jc: 'center', after: 240 }, run({ x: 'Table of Contents', b: 1, sz: 24 })));
  const heads = m.blocks.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h');
  heads.forEach((h, i) => {
    const lvl1 = h.lvl === 1;
    const tabs = lvl1 ? `<w:tab w:val="left" w:pos="440"/><w:tab w:val="right" w:leader="dot" w:pos="${CONTENT_W - 10}"/>` : `<w:tab w:val="clear" w:pos="880"/><w:tab w:val="clear" w:pos="9628"/><w:tab w:val="left" w:pos="1000"/><w:tab w:val="right" w:leader="dot" w:pos="${CONTENT_W - 10}"/>`;
    const begin = i === 0 ? `<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>` : '';
    const pg = m.tocPages?.[h.id];
    const rr: Run = { x: '', b: lvl1 ? 1 : undefined, sz: 22 };
    out.push(para({ style: lvl1 ? 'TOC1' : 'TOC2', tabs, after: 80 }, begin + run({ ...rr, x: h.num }) + run({ ...rr, x: '\t' + h.x + '\t' + (pg != null ? String(pg) : '') })));
  });
  out.push(para({ after: 0 }, '<w:r><w:fldChar w:fldCharType="end"/></w:r>'));

  // ---- body
  let first = true;
  m.blocks.forEach((b, bi) => {
    const nb = m.blocks[bi + 1];
    const beforeSmallTable = !!nb && ((nb.t === 'tbl' && nb.rows.length <= 15) || nb.t === 'img');
    switch (b.t) {
      case 'h': {
        const r: Run = { x: b.x, b: 1, u: 1, sz: 24, c: 'auto' as any };
        out.push(para({ style: b.lvl === 1 ? 'Heading1' : 'Heading2', num: [HNUM, b.lvl - 1], pbBefore: first, keepNext: true }, run(r)));
        first = false;
        break;
      }
      case 'n':
        out.push(para({ style: 'ListParagraph', num: [HNUM, b.d - 1], keepNext: b.title || beforeSmallTable, before: b.title ? 120 : 0, after: b.title ? 100 : 160, ctx0: true, jc: b.jc || 'both' }, runs(b.r, b.sz)));
        break;
      case 'p': {
        const tabs = b.tabs ? b.tabs.map((t) => `<w:tab w:val="${t.v}"${t.ld ? ` w:leader="${t.ld}"` : ''} w:pos="${t.p}"/>`).join('') : undefined;
        out.push(para({ keepNext: b.keep || beforeSmallTable, pbBefore: b.pbBefore, tabs, before: b.before, after: b.after ?? 120, ind: { l: b.l, h: b.h, f: b.f }, jc: b.jc || 'both' }, runs(b.r, b.sz)));
        break;
      }
      case 'li':
        out.push(para({ style: 'ListParagraph', num: [b.num, b.il], after: 60, ind: { l: b.l, h: b.h }, ctx0: true, jc: b.jc || 'both' }, runs(b.r, b.sz)));
        break;
      case 'tbl':
        out.push(table(b));
        out.push(para({ after: 120 }, ''));
        break;
      case 'img':
        out.push(para({ jc: b.jc || 'center', after: 120, before: 60 }, inlineImg(body.rid(b.key), b.w, b.h, 'Image')));
        break;
      case 'pb':
        out.push(para({}, '<w:r><w:br w:type="page"/></w:r>'));
        break;
    }
  });

  // ---- header (banner + watermark) and footer
  const bannerRid = hdr.rid(m.banner);
  let hdrRuns = anchorImg(bannerRid, 7799070, 1029970, '<wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>165574</wp:posOffset></wp:positionV>', false, 'Header banner');
  if (m.watermark) {
    const a = m.images[m.watermark];
    const maxW = 5941060, maxH = 5069205;
    let cx = maxW, cy = Math.round((maxW * a.h) / a.w);
    if (cy > maxH) { cy = maxH; cx = Math.round((maxH * a.w) / a.h); }
    hdrRuns += anchorImg(hdr.rid(m.watermark), cx, cy, '<wp:positionH relativeFrom="margin"><wp:align>center</wp:align></wp:positionH><wp:positionV relativeFrom="margin"><wp:align>center</wp:align></wp:positionV>', true, 'Watermark');
  }
  const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${para({ style: 'Header' }, hdrRuns)}</w:hdr>`;
  const grey = '<w:rPr><w:color w:val="595959"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>';
  const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}>${para({
    style: 'Footer',
    border: '<w:pBdr><w:top w:val="single" w:sz="4" w:space="1" w:color="D9D9D9"/></w:pBdr>',
    tabs: `<w:tab w:val="clear" w:pos="4680"/><w:tab w:val="clear" w:pos="9360"/><w:tab w:val="right" w:pos="${CONTENT_W}"/>`,
    jc: 'left',
  }, `<w:r>${grey}<w:t xml:space="preserve">${x(m.footerLeft)}</w:t></w:r><w:r>${grey}<w:tab/></w:r><w:r>${grey}<w:t xml:space="preserve">Page </w:t></w:r>${fld('PAGE', '1', grey)}<w:r>${grey}<w:t xml:space="preserve"> of </w:t></w:r>${fld('NUMPAGES', '1', grey)}`)}</w:ftr>`;

  const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr1"/><w:footerReference w:type="default" r:id="rIdFtr1"/><w:pgSz w:w="${PAGE.w}" w:h="${PAGE.h}" w:code="9"/><w:pgMar w:top="${PAGE.top}" w:right="${PAGE.right}" w:bottom="${PAGE.bottom}" w:left="${PAGE.left}" w:header="${PAGE.header}" w:footer="${PAGE.footer}" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${out.join('')}${sect}</w:body></w:document>`;

  // ---- numbering: R1 lists + the section hierarchy
  const lv = (i: number, text: string, left: number, hang: number, bold: boolean) =>
    `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${left}" w:hanging="${hang}"/></w:pPr><w:rPr>${bold ? '<w:b/><w:bCs/>' : ''}<w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:u w:val="none"/></w:rPr></w:lvl>`;
  const hier = `<w:abstractNum w:abstractNumId="${HNUM}"><w:multiLevelType w:val="multilevel"/>${[
    lv(0, '%1.', 567, 567, true), lv(1, '%1.%2', 851, 851, true), lv(2, '%1.%2.%3', 851, 851, false), lv(3, '%1.%2.%3.%4', 1080, 1080, false),
    lv(4, '%1.%2.%3.%4.%5', 1931, 1080, false), lv(5, '%1.%2.%3.%4.%5.%6', 2160, 1200, false), lv(6, '%1.%2.%3.%4.%5.%6.%7', 2520, 1440, false),
    lv(7, '%1.%2.%3.%4.%5.%6.%7.%8', 2880, 1440, false), lv(8, '%1.%2.%3.%4.%5.%6.%7.%8.%9', 3240, 1800, false)].join('')}</w:abstractNum>`;
  let numbering: string = parts.numbering;
  const firstNum = numbering.indexOf('<w:num ');
  numbering = numbering.slice(0, firstNum) + hier + numbering.slice(firstNum);
  const cleanup = numbering.indexOf('<w:numIdMacAtCleanup');
  const insertAt = cleanup >= 0 ? cleanup : numbering.lastIndexOf('</w:numbering>');
  numbering = numbering.slice(0, insertAt) + `<w:num w:numId="${HNUM}"><w:abstractNumId w:val="${HNUM}"/></w:num>` + numbering.slice(insertAt);

  const settings = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:updateFields w:val="true"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat><w:themeFontLang w:val="en-GB"/><w:clrSchemeMapping w:bg1="light1" w:t1="dark1" w:bg2="light2" w:t2="dark2" w:accent1="accent1" w:accent2="accent2" w:accent3="accent3" w:accent4="accent4" w:accent5="accent5" w:accent6="accent6" w:hyperlink="hyperlink" w:followedHyperlink="followedHyperlink"/><w:decimalSymbol w:val="."/><w:listSeparator w:val=","/></w:settings>`;

  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(`Project Quality Plan - ${m.meta.project || ''}`)}</dc:title><dc:subject>${x(m.docRef)}</dc:subject><dc:creator>${x(APP_NAME)}</dc:creator><cp:lastModifiedBy>${x(APP_NAME)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>${x(APP_NAME)} ${APP_VERSION}</Application><Company>${x(m.meta.company)}</Company></Properties>`;

  const rel = (id: string, type: string, target: string) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${[
    rel('rIdStyles', 'styles', 'styles.xml'), rel('rIdNum', 'numbering', 'numbering.xml'), rel('rIdSet', 'settings', 'settings.xml'),
    rel('rIdTheme', 'theme', 'theme/theme1.xml'), rel('rIdFont', 'fontTable', 'fontTable.xml'),
    rel('rIdHdr1', 'header', 'header1.xml'), rel('rIdFtr1', 'footer', 'footer1.xml'),
    ...body.items.map((i) => rel(i.rid, 'image', 'media/' + i.file)),
  ].join('')}</Relationships>`;
  const hdrRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hdr.items.map((i) => rel(i.rid, 'image', 'media/' + i.file)).join('')}</Relationships>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', ct);
  zip.file('_rels/.rels', rootRels);
  zip.file('docProps/core.xml', core);
  zip.file('docProps/app.xml', app);
  zip.file('word/document.xml', document);
  zip.file('word/styles.xml', parts.styles);
  zip.file('word/numbering.xml', numbering);
  zip.file('word/settings.xml', settings);
  zip.file('word/theme/theme1.xml', parts.theme);
  zip.file('word/fontTable.xml', parts.fontTable);
  zip.file('word/header1.xml', header);
  zip.file('word/footer1.xml', footer);
  zip.file('word/_rels/document.xml.rels', docRels);
  zip.file('word/_rels/header1.xml.rels', hdrRels);
  for (const i of [...body.items, ...hdr.items]) zip.file('word/media/' + i.file, i.bytes);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
