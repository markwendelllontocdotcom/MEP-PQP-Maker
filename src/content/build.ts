import r1json from './r1.json';
import msTitles from './ms-titles.json';
import type { Project, Settings } from '../model/types';
import { AUTHORITY_NAMES, AUTHORITY_SCOPE, CERT_ORDER } from '../model/defaults';
import { docRef, revLabel, dmy, durationDays, joinAnd } from '../model/format';
import type { Block, DocModel, Run, Platform, Row, Cell, CellPara, ImgAsset } from '../gen/model';
import { CONTENT_W, NAVY } from '../gen/model';
import { orgChartSvg } from './orgchart';
import { bannerSvg, fadeSvg } from './svgs';

const r1: any = r1json;

export interface Unit { id: string; level: number; title: string; parent?: string; added?: number }

export const ANNEX_UNITS: Unit[] = [
  { id: 'annex:org-chart', level: 2, title: 'Project Organization Chart', parent: 'annex' },
  { id: 'annex:iso-certificates', level: 2, title: 'ISO Certificates', parent: 'annex' },
  { id: 'annex:forms', level: 2, title: 'List of Applicable Forms and Templates', parent: 'annex' },
  { id: 'annex:quality-policy', level: 2, title: 'Quality Policy & Quality Objectives', parent: 'annex' },
  { id: 'annex:ms-itp', level: 2, title: 'List of Method Statements and ITPs (added)', parent: 'annex', added: 1 },
];

/** Every switchable unit, in document order (Q08 checklist). */
export function sectionUnits(): Unit[] {
  return [...(r1.units as Unit[]), ...ANNEX_UNITS];
}

const BULLETS: Record<string, string> = { arrow: '➢', bullet: '•', circle: 'o', square: '▪', check: '✓' };

function letters(n: number, upper = false): string {
  let s = '';
  while (n > 0) { n--; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); }
  return upper ? s.toUpperCase() : s;
}
function roman(n: number): string {
  const m: [number, string][] = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let s = '';
  for (const [v, r] of m) while (n >= v) { s += r; n -= v; }
  return s;
}
export function listLabel(k: string, n: number): string {
  if (BULLETS[k]) return BULLETS[k];
  const suffix = k.endsWith(')') ? ')' : '.';
  const base = k.slice(0, -1);
  const v = base === 'la' ? letters(n) : base === 'ua' ? letters(n, true) : base === 'lr' ? roman(n) : base === 'ur' ? roman(n).toUpperCase() : String(n);
  return v + suffix;
}

function titleCaseCompany(s: string): string {
  return s.split(/\s+/).map((w) => (w.length <= 3 || /\./.test(w) ? w : w[0] + w.slice(1).toLowerCase())).join(' ');
}
const stripMs = (s: string) => s.replace(/^\s*M\/s\.?\s*/i, '').trim();

const txt = (x: string, extra: Partial<Run> = {}): Run => ({ x, ...extra });

export async function buildDoc(p: Project, s: Settings, plat: Platform): Promise<DocModel> {
  const ref = docRef(p);
  const rev = revLabel(p);
  const off = new Set(p.Q08off || []);
  const included = (u: string[]) => !u.some((x) => off.has(x));
  const images: Record<string, ImgAsset> = {};
  let imgN = 0;
  const addImg = (a: ImgAsset, key?: string) => { const k = key || 'img' + (++imgN); images[k] = a; return k; };

  const company = stripMs(p.R04 || s.companyName);
  const tokens: Record<string, string> = {
    CO: (s.companyShort || 'OXYPRO').trim(),
    COMPANY: titleCaseCompany(company),
    P01: p.P01.trim() || '[Project Name]',
    R01: stripMs(p.R01) || '[Client Name]',
    Q06: /^\d+$/.test(p.Q06) ? p.Q06 : '7',
  };
  const tok = (x: string) => x.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? '');
  const runs = (rs: any[]): Run[] => rs.map((r) => ({ ...r, x: tok(r.x) }));

  // ---------------- annexure numbering (for "Refer Annexure 8.x" references)
  const h1Included = (r1.blocks as any[]).filter((b) => b.t === 'h1' && included(b.u));
  const annexNo = h1Included.findIndex((b) => b.id === 'annex') + 1;
  const annexOn = ANNEX_UNITS.filter((u) => !off.has(u.id) && !off.has('annex'));
  const annexRef = (id: string) => {
    const i = annexOn.findIndex((u) => u.id === id);
    return i >= 0 && annexNo > 0 ? `${annexNo}.${i + 1}` : null;
  };
  const fixAnnexRef = (x: string) =>
    x.replace(/\s*\(Refer Annexure 8\.(\d)\)/, (_m, d) => {
      const id = d === '1' ? 'annex:org-chart' : d === '2' ? 'annex:iso-certificates' : d === '3' ? 'annex:forms' : 'annex:quality-policy';
      const r = annexRef(id);
      return r ? ` (Refer Annexure ${r})` : '';
    });

  // ---------------- numbering
  const c = [0, 0, 0, 0, 0, 0, 0];
  const numFor = (d: number) => {
    c[d]++;
    for (let k = d + 1; k < c.length; k++) c[k] = 0;
    return c.slice(1, d + 1).join('.');
  };
  const listCount: Record<string, number> = {};
  const out: Block[] = [];

  const H = (lvl: 1 | 2, x: string, id: string) => {
    const n = lvl === 1 ? numFor(1) + '.' : numFor(2);
    out.push({ t: 'h', lvl, num: n, x, id });
  };
  const N = (d: number, r: Run[], extra: { title?: boolean; jc?: string } = {}) =>
    out.push({ t: 'n', d, num: numFor(d), r, sz: 24, jc: extra.jc ?? 'both', title: extra.title });
  const P = (r: Run[], l = 851, extra: Partial<Extract<Block, { t: 'p' }>> = {}) =>
    out.push({ t: 'p', r, l, sz: 24, jc: 'both', ...extra });
  const LI = (k: string, r: Run[], l: number, num = '12') => {
    const key = num + ':0';
    listCount[key] = (listCount[key] || 0) + 1;
    out.push({ t: 'li', k, label: listLabel(k, listCount[key]), num, il: '0', l, h: 360, r, sz: 24, jc: 'left' });
  };
  const hdrCell = (x: string): Cell => ({ p: [{ r: [txt(x, { b: 1 })], jc: 'center' }], fill: NAVY, color: 'FFFFFF', bold: true, va: 'center' });
  const cell = (x: string, extra: Partial<Cell> = {}, jc?: string): Cell => ({ p: x.split('\n').map((line) => ({ r: [txt(line)], jc })), ...extra });

  for (const b of r1.blocks as any[]) {
    if (!included(b.u || [])) continue;
    switch (b.t) {
      case 'h1': H(1, b.x, b.id); break;
      case 'h2': H(2, fixAnnexRef(tok(b.x)), b.id); break;
      case 'n': N(b.d, runs(b.r), { title: !!b.title, jc: b.jc }); break;
      case 'p': out.push({ t: 'p', r: runs(b.r), l: b.l || 0, h: b.h, f: b.f, jc: b.jc || 'both', tabs: b.tabs, sz: b.sz || 24, keep: !!b.keep }); break;
      case 'li': {
        const key = b.num + ':' + b.il;
        listCount[key] = (listCount[key] || 0) + 1;
        out.push({ t: 'li', k: b.k, label: listLabel(b.k, listCount[key]), num: b.num, il: b.il, l: b.l, h: b.h, r: runs(b.r), sz: b.sz || 24, jc: b.jc || 'both' });
        break;
      }
      case 'tbl': out.push(table(b)); break;
      case 'slot': await slot(b); break;
    }
  }

  function table(b: any): Block {
    let rows: Row[] = b.rows.map((r: any) => {
      const header = r.c.every((cc: any) => cc.fill);
      return {
        header,
        c: r.c.map((cc: any): Cell => {
          let paras: CellPara[] = cc.p.map((pp: any) => ({ r: runs(pp.r), jc: pp.jc, li: pp.li }));
          while (paras.length > 1 && !paras[0].r.some((x) => x.x.trim())) paras.shift();
          const cl: Cell = { p: paras, fill: cc.fill, span: cc.span, vm: cc.vm, va: cc.va };
          if (header) { cl.color = 'FFFFFF'; cl.bold = true; cl.va = 'center'; }
          return cl;
        }),
      };
    });
    if (b.id === 'ext_origin') rows = extOrigin(rows);
    return { t: 'tbl', grid: b.grid, rows, jc: b.jc || (b.ind ? undefined : 'center'), ind: b.ind };
  }

  function extOrigin(rows: Row[]): Row[] {
    const out: Row[] = [rows[0]];
    const auth = authorityList(true);
    const codes = codeList();
    rows.slice(1).forEach((row, i) => {
      const r = { ...row, c: row.c.map((x) => ({ ...x, p: [...x.p] })) };
      const body = r.c[1];
      if (i === 0 && auth.length) body.p.push({ r: [txt('(' + auth.join(', ') + ')', { i: 1 })] });
      if (i === 1 && codes.length) body.p.push({ r: [txt('(' + codes.join(', ') + ')', { i: 1 })] });
      // rows 3-4 (ISO standards) stay exactly as in R1
      out.push(r);
    });
    out.slice(1).forEach((r, i) => { r.c[0] = { ...r.c[0], p: [{ r: [txt(String(i + 1))], jc: 'center' }] }; });
    return out;
  }

  function authorityList(short = false): string[] {
    const a = p.R06.filter((x) => x !== 'Other').map((x) => (short ? x : AUTHORITY_NAMES[x] || x));
    if (p.R06.includes('Other') && p.R06other.trim()) a.push(...p.R06other.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean));
    return a;
  }
  function codeList(): string[] {
    const a = p.Q07.filter((x) => x !== 'Other');
    if (p.Q07.includes('Other') && p.Q07other.trim()) a.push(...p.Q07other.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean));
    return a;
  }

  async function slot(b: any) {
    switch (b.id) {
      case 'intro_qms': {
        const sys: string[] = [];
        if (p.Q01.includes('ISO 9001:2015') || !p.Q01.length) sys.push('Quality Management System (ISO 9001: 2015 QMS requirements)');
        if (p.Q01.includes('ISO/IEC 27001:2022')) sys.push('Information Security Management System (ISO/IEC 27001:2022 ISMS requirements)');
        if (p.Q01.includes('ISO 14001:2015')) sys.push('Environmental Management System (ISO 14001:2015 EMS requirements)');
        if (p.Q01.includes('ISO 45001:2018')) sys.push('Occupational Health and Safety Management System (ISO 45001:2018 OH&S requirements)');
        const isms = p.Q01.includes('ISO/IEC 27001:2022');
        const x = `This project quality plan is in line with the organisation's ${joinAnd(sys)} designed to ensure consistent working practices adhering to all applicable legal and contractual requirements, in delivering our services to our clients, vendors and shareholders thereby ensuring complete satisfaction at all levels through continual improvement${isms ? ' and preserving Confidentiality (C), Integrity (I) and Availability (A) of information' : ''}.`;
        P([txt(x)], b.base?.l ?? 567);
        break;
      }
      case 'scope': {
        const base = b.base;
        P(runs(base.r), base.l ?? 567);
        const summary = p.P07.trim();
        if (summary) {
          P([txt('Summary of Works', { b: 1, u: 1 })], 567, { keep: true, jc: 'left' });
          summary.split(/\n+/).forEach((line) => P([txt(line.trim())], 567));
        }
        const disc = p.P08;
        if (disc.length) {
          P([txt('Disciplines covered by this Project Quality Plan', { b: 1, u: 1 })], 567, { keep: true, jc: 'left' });
          disc.forEach((d) => LI('bullet', [txt(d)], 1134));
        }
        P([txt('Project Information', { b: 1, u: 1 })], 567, { keep: true, jc: 'left' });
        const loc = [p.P05.trim(), p.P04, 'UAE'].filter(Boolean).join(', ');
        const info: [string, string][] = [
          ['Project', p.P01 || '[Project Name]'],
          ['Project Number', /^\d+$/.test(p.P02) ? 'P' + p.P02 : p.P02 || '[XXX]'],
          ['Location', loc],
          ['Project Type', (p.P06 || []).join(', ')],
          ['Contract Type', p.P09],
          ['Our Role', p.R05],
          ['Building Configuration / Description', p.P13.trim()],
          ['Approving Authorities', authorityList(true).join(', ')],
        ];
        const rows: Row[] = info.filter(([, v]) => v).map(([k, v]) => ({ c: [cell(k, { bold: true, fill: 'F2F2F2' }), cell(v)] }));
        out.push({ t: 'tbl', grid: [3000, CONTENT_W - 567 - 3000], rows, ind: 567 });
        break;
      }
      case 'q05':
        if (/^\d+$/.test(p.Q05)) N(4, [txt(`The Consultant\u2019s review period for submittals is ${p.Q05} days from the date of submission, unless otherwise stated in the contract.`)]);
        break;
      case 'q04':
        if (/^\d+$/.test(p.Q04)) N(3, [txt(`Inspection requests (WIR / MIR) are submitted to the Consultant at least ${p.Q04} hours before the planned inspection time.`)]);
        break;
      case 'kpi': {
        if (off.has('proc:quality-kpis')) break;
        N(3, [txt('Quality KPIs', { u: 1 })], { title: true, jc: 'left' });
        N(4, [txt('The QA/QC Manager monitors the following quality KPIs every month and reports them to the Projects Head:')]);
        const q06 = tokens.Q06;
        const kpis: [string, string][] = [
          ['WIR approved at first inspection', '≥ 90%'],
          ['MIR approved at first inspection', '≥ 90%'],
          ['Material submittals approved at first submission', '≥ 85%'],
          [`NCRs closed within ${q06} working days`, '100%'],
          [`Open SORs older than ${q06} working days`, '0'],
          ['Measuring instruments in use with valid calibration', '100%'],
          ['Internal audits held as scheduled', '100%'],
        ];
        const rows: Row[] = [
          { header: true, c: [hdrCell('Sl.No.'), hdrCell('Quality KPI'), hdrCell('Target')] },
          ...kpis.map(([k, v], i) => ({ c: [cell(String(i + 1), {}, 'center'), cell(k), cell(v, {}, 'center')] })),
        ];
        out.push({ t: 'tbl', grid: [800, 5600, 1800], rows, ind: 1080 });
        N(4, [txt('Where a KPI falls below its target, the cause is reviewed and corrective action is agreed with the Project Manager.')]);
        break;
      }
      case 'auth': {
        H(2, 'Authority Requirements', 'proc:authority-requirements');
        const list = p.R06.filter((x) => x !== 'Other');
        const others = p.R06.includes('Other') ? p.R06other.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean) : [];
        if (!list.length && !others.length) {
          N(3, [txt('The applicable authorities are to be confirmed.')]);
          break;
        }
        N(3, [txt('The following authorities are applicable to this project. Their requirements are incorporated in the shop drawings, material submittals, inspections, testing and commissioning:')]);
        const rows: Row[] = [
          { header: true, c: [hdrCell('Sl.No.'), hdrCell('Authority'), hdrCell('Approvals and inspections')] },
          ...[...list.map((a) => [AUTHORITY_NAMES[a] || a, AUTHORITY_SCOPE[a] || 'Approvals and inspections as applicable']), ...others.map((o) => [o, 'Approvals and inspections as applicable'])]
            .map(([a, sc], i) => ({ c: [cell(String(i + 1), {}, 'center'), cell(a), cell(sc)] })),
        ];
        out.push({ t: 'tbl', grid: [800, 3300, 4300], rows, ind: 851 });
        N(3, [txt('Authority submissions are planned in the Authority Submission Chart and tracked by the Document Controller in the project registers.')]);
        N(3, [txt('Authority inspections are requested only after the related internal inspection and the Consultant\u2019s inspection have been passed.')]);
        N(3, [txt('Authority approvals, NOCs and completion certificates are kept in the project file and handed over with the project close-out documents.')]);
        break;
      }
      case 'amend': {
        const rows: Row[] = [
          { header: true, c: ['Project Quality Plan Ref. No.', 'Rev. No.', 'Revision Date', 'Particulars of Revision'].map((x) => ({ p: [{ r: [txt(x, { b: 1 })], jc: 'center' }], va: 'center', bold: true })) },
          ...p.H01.map((h) => ({ c: [cell(ref, {}, 'center'), cell(h.rev, {}, 'center'), cell(dmy(h.date), {}, 'center'), cell(h.desc)] })),
          ...[0, 1].map(() => ({ c: [cell(''), cell(''), cell(''), cell('')], minH: 340 })),
        ];
        out.push({ t: 'tbl', grid: [2943, 1161, 1701, 2694], rows, jc: 'center' });
        break;
      }
      case 'annex':
        await annexures();
        break;
    }
  }

  async function annexures() {
    for (const u of annexOn) {
      const title = u.title.replace(' (added)', '');
      N(2, [txt(title, { b: 1 })], { title: true, jc: 'left' });
      if (u.id === 'annex:org-chart') {
        const svg = await orgChartSvg(p, plat);
        const png = await plat.svgToPng(svg.svg, svg.w * 2, svg.h * 2);
        const wTw = Math.min(CONTENT_W - 300, Math.round(svg.w * 15));
        out.push({ t: 'img', key: addImg(png), w: wTw, h: Math.round((wTw * svg.h) / svg.w), jc: 'center' });
        const ppl = people(p);
        const withContacts = ppl.some((x) => x.email || x.phone);
        const head = withContacts ? ['Role', 'Name', 'Email', 'Phone'] : ['Role', 'Name'];
        const rows: Row[] = [
          { header: true, c: head.map(hdrCell) },
          ...ppl.map((x) => ({ c: (withContacts ? [x.role, x.name, x.email, x.phone] : [x.role, x.name]).map((v) => cell(v)) })),
        ];
        if (ppl.length) out.push({ t: 'tbl', grid: withContacts ? [2400, 2300, 2800, 1900] : [4000, 4400], rows, jc: 'center' });
      }
      if (u.id === 'annex:iso-certificates') {
        // the certificate of every standard ticked under QMS / ISMS Standards
        const ticked = CERT_ORDER.filter((std) => p.Q01.includes(std)).map((std) => (p.CERTS || []).find((c) => c.std === std) || { std, no: '', body: '', expiry: '', image: null });
        if (ticked.length) {
          const rows: Row[] = [
            { header: true, c: [hdrCell('Sl.No.'), hdrCell('Standard'), hdrCell('Certificate No.'), hdrCell('Certifying Body'), hdrCell('Valid until')] },
            ...ticked.map((c, i) => ({ c: [cell(String(i + 1), {}, 'center'), cell(c.std), cell(c.no || '\u2014', {}, 'center'), cell(c.body || '\u2014'), cell(dmy(c.expiry) || '\u2014', {}, 'center')] })),
          ];
          out.push({ t: 'tbl', grid: [700, 2000, 1500, 2900, 1500], rows, ind: 851 });
        }
        const scans: { c: typeof ticked[number]; a: ImgAsset }[] = [];
        const missing: string[] = [];
        for (const c of ticked) {
          const a = c.image ? await plat.dataUrlToAsset(c.image.dataUrl) : await plat.cert(c.std);
          if (a) scans.push({ c, a }); else missing.push(c.std);
        }
        if (missing.length) P([txt(`Certificate${missing.length > 1 ? 's' : ''} for ${joinAnd(missing)} to be attached.`, { i: 1 })], 851);
        for (const { c, a } of scans) {
          P([txt(`${c.std} Certificate${c.no ? ` (${c.no})` : ''}`, { b: 1 })], 0, { jc: 'center', keep: true, pbBefore: true, after: 120 });
          certImage(a);
        }
        for (const im of p.A01) {
          P([txt(im.name.replace(/\.[a-z0-9]+$/i, ''), { b: 1 })], 0, { jc: 'center', keep: true, pbBefore: true, after: 120 });
          certImage(await plat.dataUrlToAsset(im.dataUrl));
        }
        if (!ticked.length && !p.A01.length) P([txt('ISO certificates to be attached.', { i: 1 })], 851);
      }
      if (u.id === 'annex:forms') {
        const rows: Row[] = [
          { header: true, c: [hdrCell('Sl.No.'), hdrCell('Form / Register / Template'), hdrCell('Code')] },
          ...p.A02.filter((f) => f.code || f.title).map((f, i) => ({ c: [cell(String(i + 1), {}, 'center'), cell(f.title), cell(f.code)] })),
        ];
        out.push({ t: 'tbl', grid: [800, 5000, 2800], rows, ind: 851 });
      }
      if (u.id === 'annex:quality-policy') {
        if (p.A03.length) for (const im of p.A03) await pageImage(im.dataUrl);
        else if (p.A03text.trim()) p.A03text.trim().split(/\n+/).forEach((line) => P([txt(line.trim())], 851));
        else P([txt('Quality Policy & Quality Objectives to be attached.', { i: 1 })], 851);
      }
      if (u.id === 'annex:ms-itp') {
        const list = msList(p.P08);
        if (!list.length) { P([txt('No MEP discipline is selected, so no Method Statements are listed.', { i: 1 })], 851); continue; }
        P([txt('The Method Statements below are planned for this project. Each Method Statement includes its Inspection and Test Plan.')], 851);
        const rows: Row[] = [
          { header: true, c: [hdrCell('Sl.No.'), hdrCell('Discipline'), hdrCell('Method Statement (with ITP)'), hdrCell('Stage')] },
          ...list.map((m, i) => ({ c: [cell(String(i + 1), {}, 'center'), cell(m.disc), cell(m.title), cell(m.stage, {}, 'center')] })),
        ];
        out.push({ t: 'tbl', grid: [700, 1700, 4900, 1300], rows, ind: 851 });
      }
    }
  }

  /** a certificate scan sized to fill one page under its caption */
  function certImage(a: ImgAsset) {
    const maxW = CONTENT_W - 300, maxH = 12100;
    let w = maxW, h = Math.round((maxW * a.h) / a.w);
    if (h > maxH) { h = maxH; w = Math.round((maxH * a.w) / a.h); }
    out.push({ t: 'img', key: addImg(a), w, h, jc: 'center' });
  }

  async function pageImage(dataUrl: string) {
    const a = await plat.dataUrlToAsset(dataUrl);
    const maxW = CONTENT_W - 851, maxH = 11500;
    let w = maxW, h = Math.round((maxW * a.h) / a.w);
    if (h > maxH) { h = maxH; w = Math.round((maxH * a.w) / a.h); }
    out.push({ t: 'img', key: addImg(a), w, h, jc: 'center' });
  }

  // ---------------- branding images
  const defaultBrand = !p.R09 && (p.R11 || '').trim() === 'THE COMPLETE SOLUTION FOR BUILDING SERVICES';
  let banner: ImgAsset;
  if (defaultBrand) banner = await plat.asset('banner');
  else {
    const logo = p.R09 ? await plat.dataUrlToAsset(p.R09.dataUrl) : await plat.asset('logo');
    const svg = await bannerSvg(logo, p.R11 || '', s.brandColor || '#D72025', plat);
    banner = await plat.svgToPng(svg, 1637, 216);
  }
  addImg(banner, 'banner');
  let watermark: string | null = null;
  if (p.R12on) {
    if (p.R12) {
      const src = await plat.dataUrlToAsset(p.R12.dataUrl);
      const svg = fadeSvg(src, s.watermarkOpacity || 0.08);
      watermark = addImg(await plat.svgToPng(svg.svg, svg.w, svg.h), 'watermark');
    } else watermark = addImg(await plat.asset('watermark'), 'watermark');
  }

  // ---------------- cover
  const photo = p.R10 ? addImg(await plat.dataUrlToAsset(p.R10.dataUrl), 'cover') : null;
  const logos: string[] = [];
  for (const im of [p.R07, p.R08]) if (im) logos.push(addImg(await plat.dataUrlToAsset(im.dataUrl)));
  const ms = (x: string, ph: string) => 'M/s. ' + (stripMs(x) || ph);
  const cover = {
    docRefLine: `Doc Ref: ${ref}`,
    revLine: `${rev}, Dated. ${dmy(p.D04) || '[DD.MM.YYYY]'}`,
    title: 'Project Quality Plan',
    photo, logos,
    parties: [
      ['Project', p.P01.trim() || '[PROJECT NAME]'],
      ['Location', [p.P05.trim(), p.P04, 'UAE'].filter(Boolean).join(', ') || '[PROJECT LOCATION]'],
      ['Client', ms(p.R01, '[CLIENT NAME]')],
      ['Consultant', ms(p.R02, '[CONSULTANT NAME]')],
      ['Main Contractor', ms(p.R03, '[MAIN CONTRACTOR NAME]')],
      ['MEP Contractor', ms(p.R04 || s.companyName, '[MEP CONTRACTOR NAME]')],
    ] as [string, string][],
    statement: 'This Project Quality Plan sets out the organization structure and operating procedures applicable to this project and as such has been reviewed for adequacy and is approved for implementation.',
    status: p.D05,
    signatures: [
      { role: 'Prepared By', name: p.D06, desig: p.D07 },
      { role: 'Reviewed By', name: p.D08, desig: p.D09 },
      { role: 'Approved By', name: p.D10, desig: p.D11 },
    ],
  };

  return {
    docRef: ref, rev, footerLeft: `${ref}  |  ${rev}`, title: 'Project Quality Plan',
    cover, banner: 'banner', watermark, blocks: out, images,
    meta: { project: p.P01, company, created: new Date().toISOString() },
  };
}

export function people(p: Project): { role: string; name: string; email: string; phone: string }[] {
  const list = [
    { role: 'Project Manager', ...p.K01 },
    { role: 'QA/QC Manager', ...p.K02 },
    { role: 'QA/QC Engineer', ...p.K03 },
    { role: 'HSE Manager / Officer', ...p.K04 },
    { role: 'Document Controller', ...p.K05 },
    ...p.K06,
  ];
  return list.filter((x) => x.name && x.name.trim()).map((x) => ({ role: x.role, name: x.name.trim(), email: (x.email || '').trim(), phone: (x.phone || '').trim() }));
}

const DISC_MAP: Record<string, { disc: string; pick?: (id: string) => boolean }[]> = {
  HVAC: [{ disc: 'MEC' }],
  'Plumbing & Drainage': [{ disc: 'PLU' }],
  Electrical: [{ disc: 'ELE', pick: (id) => id !== 'ELE-15' && id !== 'ELE-21' }],
  'Fire Alarm': [{ disc: 'ELE', pick: (id) => id === 'ELE-15' || id === 'ELE-21' }],
  'Fire Fighting': [{ disc: 'FF' }],
  ELV: [{ disc: 'ELV' }],
  LPG: [{ disc: 'LPG' }],
};
const DISC_LABEL: Record<string, string> = { MEC: 'HVAC', PLU: 'Plumbing & Drainage', ELE: 'Electrical', FF: 'Fire Fighting', ELV: 'ELV', LPG: 'LPG', MEP: 'MEP (General)' };

export function msList(disciplines: string[]): { disc: string; title: string; stage: string }[] {
  const out: { disc: string; title: string; stage: string; id: string }[] = [];
  const seen = new Set<string>();
  for (const d of disciplines) {
    for (const rule of DISC_MAP[d] || []) {
      for (const m of msTitles as any[]) {
        if (m.disc !== rule.disc || (rule.pick && !rule.pick(m.id)) || seen.has(m.id)) continue;
        seen.add(m.id);
        out.push({ id: m.id, disc: d === 'Fire Alarm' ? 'Fire Alarm' : DISC_LABEL[m.disc], title: m.title.replace(/'/g, '\u2019'), stage: m.stage === 'TC' ? 'T&C' : 'Installation' });
      }
    }
  }
  if (out.length) for (const m of msTitles as any[]) if (m.disc === 'MEP') out.push({ id: m.id, disc: DISC_LABEL.MEP, title: m.title.replace(/'/g, '\u2019'), stage: m.stage === 'TC' ? 'T&C' : 'Installation' });
  return out;
}
