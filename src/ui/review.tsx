import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Project, Settings } from '../model/types';
import type { FieldSpec } from '../model/fields';
import { CERT_ORDER, BUNDLED_CERTS } from '../model/defaults';
import { docRef, revLabel, dmy, todayISO, projectCode, joinAnd } from '../model/format';
import { people, msList } from '../content/build';
import { cachedPdf, pdfFor, type PdfEntry } from '../exporter';
import { isIOS } from '../print';

type Issue = { f: FieldSpec; msg: string };
type Level = 'ok' | 'bad' | 'warn' | 'info';

export interface ReviewProps {
  p: Project;
  s: Settings;
  errors: Issue[];
  missing: FieldSpec[];
  leftOut: string[]; // titles of the sections switched off under PQP Sections
  fileName: string;
  dirtyFile: boolean;
  onGo: (group: string) => void;
  goTo: (f: FieldSpec) => void;
  onExport: (kind: 'word' | 'pdf') => void;
  onPrint: () => void;
  onSave: () => void;
}

/** Review: what still needs attention, the key details and the PQP itself, before exporting or printing. */
export function Review(props: ReviewProps) {
  const { p, s } = props;
  const [pdf, setPdf] = useState<PdfEntry | null>(cachedPdf(p));
  const [building, setBuilding] = useState(!cachedPdf(p));
  const [failed, setFailed] = useState('');
  const run = useRef(0);

  const build = async () => {
    const n = ++run.current;
    setBuilding(true);
    setFailed('');
    await new Promise((r) => setTimeout(r, 60)); // let "Building the preview" show first
    try {
      const r = await pdfFor(p, s);
      if (n === run.current) setPdf(r);
    } catch (e: any) {
      console.error(e);
      if (n === run.current) setFailed(e?.message || String(e));
    } finally {
      if (n === run.current) setBuilding(false);
    }
  };
  // build when the page opens and again if the project changes while it is open (New, Open, sample data)
  useEffect(() => { if (!cachedPdf(p)) build(); else { setPdf(cachedPdf(p)); setBuilding(false); } }, [p.id, p.modified]);

  const off = new Set(p.Q08off);
  const fieldLink = (f: FieldSpec) => <button class="linkbtn" onClick={() => props.goTo(f)}>{f.label}</button>;

  // ---------- checks
  const checks: { level: Level; title: string; body?: ComponentChildren }[] = [];
  if (props.errors.length) {
    checks.push({ level: 'bad', title: `${props.errors.length} ${props.errors.length === 1 ? 'entry needs' : 'entries need'} fixing before you can export or print`,
      body: <ul>{props.errors.map((e) => <li>{fieldLink(e.f)}: {e.msg}</li>)}</ul> });
  }
  if (props.missing.length) {
    checks.push({ level: 'warn', title: `${props.missing.length} required ${props.missing.length === 1 ? 'field is' : 'fields are'} empty. They print as placeholders such as [Project Name]`,
      body: <ul class="rv-inline">{props.missing.map((f) => <li>{fieldLink(f)}</li>)}</ul> });
  }
  if (!props.errors.length && !props.missing.length) checks.push({ level: 'ok', title: 'All required fields are complete and every entry is allowed' });

  if (!off.has('annex') && !off.has('annex:iso-certificates')) {
    const today = todayISO();
    const soon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const ticked = CERT_ORDER.filter((std) => p.Q01.includes(std));
    const certIssues: ComponentChildren[] = [];
    let worst: Level = 'ok';
    for (const std of ticked) {
      const c = p.CERTS.find((x) => x.std === std);
      const scan = !!c?.image || BUNDLED_CERTS.includes(std);
      if (!scan) { certIssues.push(<li>{std}: no certificate scan yet, so Annexure 8.2 says it is to be attached.</li>); if (worst === 'ok') worst = 'info'; }
      if (c?.expiry && c.expiry < today) { certIssues.push(<li>{std}: expired on {dmy(c.expiry)}.</li>); worst = 'bad'; }
      else if (c?.expiry && c.expiry <= soon) { certIssues.push(<li>{std}: expires on {dmy(c.expiry)}.</li>); if (worst !== 'bad') worst = 'warn'; }
    }
    checks.push(certIssues.length
      ? { level: worst, title: 'ISO certificates (Annexure 8.2)', body: <><ul>{certIssues}</ul><button class="linkbtn" onClick={() => props.onGo('quality')}>Open 5. Quality System</button></> }
      : { level: 'ok', title: `ISO certificates: ${ticked.length ? joinAnd(ticked) + ' printed, all valid' : 'none ticked'}` });
  }
  checks.push(props.leftOut.length
    ? { level: 'info', title: `${props.leftOut.length} ${props.leftOut.length === 1 ? 'section is' : 'sections are'} left out`,
        body: <><ul class="rv-inline">{props.leftOut.map((t) => <li>{t}</li>)}</ul><button class="linkbtn" onClick={() => props.onGo('sections')}>Open PQP Sections</button></> }
    : { level: 'ok', title: 'Every PQP section is included' });
  checks.push(props.fileName
    ? { level: props.dirtyFile ? 'warn' : 'ok', title: props.dirtyFile ? `${props.fileName} has changes that are not saved to the file yet` : `Saved as ${props.fileName}`,
        body: props.dirtyFile ? <button class="linkbtn" onClick={props.onSave}>Save now</button> : undefined }
    : { level: 'warn', title: 'Not saved to a project file yet. The browser keeps it, but save a .pqp file for the project records',
        body: <button class="linkbtn" onClick={props.onSave}>Save now</button> });

  // ---------- key details
  const dash = (v: string | undefined | null, required = false) => (v && v.trim() ? v : <span class={required ? 'rv-missing' : 'rv-empty'}>{required ? 'Missing' : '—'}</span>);
  const signer = (name: string, des: string) => (name.trim() ? `${name}${des.trim() ? ' – ' + des : ''}` : '');
  const last = p.H01[p.H01.length - 1];
  const team = people(p);
  const ms = msList(p.P08);
  const policy = p.A03.length ? `${p.A03.length} scanned ${p.A03.length === 1 ? 'page' : 'pages'}` : p.A03text.trim() ? 'Typed text' : '';
  const annex = (id: string, v: ComponentChildren) => (off.has('annex') || off.has(id) ? <span class="rv-empty">Left out</span> : v);
  const blocks: { title: string; group: string; rows: [string, ComponentChildren][] }[] = [
    { title: 'Cover', group: 'project', rows: [
      ['Project', dash(p.P01, true)],
      ['Project Code & Number', dash(projectCode(p), true)],
      ['Location', dash([p.P05.trim(), p.P04, 'UAE'].filter(Boolean).join(', '))],
      ['Client', dash(p.R01, true)],
      ['Consultant', dash(p.R02, true)],
      ['Main Contractor', dash(p.R03, true)],
      ['MEP Contractor', dash(p.R04, true)],
      ['Cover photo', p.R10 ? 'Added' : <span class="rv-empty">Not added: the cover shows the photo box</span>],
    ] },
    { title: 'Document control', group: 'doc', rows: [
      ['Doc Ref', <strong>{docRef(p)}</strong>],
      ['Revision', revLabel(p)],
      ['Issue date', dash(dmy(p.D04), true)],
      ['Status', dash(p.D05, true)],
      ['Prepared by', dash(signer(p.D06, p.D07), true)],
      ['Reviewed by', dash(signer(p.D08, p.D09), true)],
      ['Approved by', dash(signer(p.D10, p.D11), true)],
      ['Last amendment', last ? `Rev ${last.rev}, ${dmy(last.date) || 'no date'}${last.desc ? ', ' + last.desc : ''}` : <span class="rv-missing">Missing</span>],
    ] },
    { title: 'Scope and quality', group: 'project', rows: [
      ['Our Role', dash(p.R05, true)],
      ['Disciplines', dash(p.P08.join(', '), true)],
      ['Approving authorities', dash([...p.R06.filter((a) => a !== 'Other'), p.R06.includes('Other') ? p.R06other.trim() : ''].filter(Boolean).join(', '), true)],
      ['Standards', dash(p.Q01.join(', '), true)],
      ['Codes & standards', dash([...p.Q07.filter((c) => c !== 'Other'), p.Q07.includes('Other') ? p.Q07other.trim() : ''].filter(Boolean).join(', '), true)],
      ['Inspection notice', p.Q04 ? `${p.Q04} hours` : <span class="rv-missing">Missing</span>],
      ['Submittal review', p.Q05 ? `${p.Q05} days` : <span class="rv-missing">Missing</span>],
    ] },
    { title: 'Key personnel (Annexure 8.1)', group: 'people', rows: team.map((x) => [x.role, dash(x.name)] as [string, ComponentChildren]) },
    { title: 'Annexures', group: 'annex', rows: [
      ['Organization chart', annex('annex:org-chart', `${team.filter((x) => x.name.trim()).length} named people`)],
      ['ISO certificates', annex('annex:iso-certificates', dash(p.Q01.join(', ')))],
      ['Other certificates', p.A01.length ? `${p.A01.length} ${p.A01.length === 1 ? 'scan' : 'scans'}` : <span class="rv-empty">None</span>],
      ['Forms and templates', annex('annex:forms', `${p.A02.length} listed`)],
      ['Quality Policy', annex('annex:quality-policy', dash(policy))],
      ['Method Statements', annex('annex:ms-itp', ms.length ? `${ms.length} titles for ${joinAnd(p.P08)}` : <span class="rv-empty">No disciplines selected</span>)],
    ] },
  ];

  const ready = !props.errors.length;
  return (
    <div class="review">
      <p class="lead">Check the PQP here before you export or print it. The preview is the PDF exactly as Export PDF saves it; the Word file has the same content.</p>

      <section class="rv-checks" aria-label="Checks">
        {checks.map((c) => (
          <div class={'rv-check rv-' + c.level}>
            <span class="rv-mark" aria-hidden="true">{c.level === 'ok' ? '✓' : c.level === 'bad' ? '✕' : c.level === 'warn' ? '!' : 'i'}</span>
            <div><div class="rv-title">{c.title}</div>{c.body && <div class="rv-body">{c.body}</div>}</div>
          </div>
        ))}
      </section>

      <section class="rv-preview" aria-label="Preview">
        <div class="rv-bar">
          <div>
            <h2>Preview</h2>
            <span class="rv-meta">{building ? 'Building…' : pdf ? `${pdf.pages} pages · built ${pdf.built.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
          </div>
          <div class="rv-acts">
            {pdf && !building && <a class="btn small" href={pdf.url} target="_blank" rel="noopener">Open in new tab</a>}
            <button class="btn small" onClick={build} disabled={building}>Refresh</button>
          </div>
        </div>
        {building ? (
          <div class="rv-frame rv-wait" role="status">Building the preview. This takes a few seconds for a full PQP.</div>
        ) : failed ? (
          <div class="rv-frame rv-wait rv-fail" role="alert">The preview could not be built: {failed}</div>
        ) : pdf ? (
          <iframe class="rv-frame" src={pdf.url + '#view=FitH'} title="PQP preview" />
        ) : null}
        {isIOS && pdf && !building && <p class="help">On iPhone and iPad the preview may show only the first page. Tap Open in new tab to scroll through every page.</p>}
        <div class="rv-out">
          <button class="btn primary" onClick={() => props.onExport('word')} disabled={!ready}>Export Word (.docx)</button>
          <button class="btn" onClick={() => props.onExport('pdf')} disabled={!ready}>Export PDF</button>
          <button class="btn" onClick={props.onPrint} disabled={!ready}>Print</button>
          {!ready && <span class="rv-note">Fix the entries listed above first.</span>}
        </div>
      </section>

      <section class="rv-details" aria-label="Key details">
        {blocks.map((b) => (
          <div class="rv-card">
            <div class="rv-cardhead"><h2>{b.title}</h2><button class="linkbtn" onClick={() => props.onGo(b.group)}>Edit</button></div>
            <dl>{b.rows.map(([k, v]) => <><dt>{k}</dt><dd>{v}</dd></>)}</dl>
          </div>
        ))}
      </section>
    </div>
  );
}
