import { useEffect, useState } from 'preact/hooks';
import type { Project, Settings } from '../model/types';
import type { PqpInfo } from '../storage';
import type { PdfEntry } from '../exporter';
import { newProject, migrate } from '../model/defaults';
import { docRef, projectCode, dmy } from '../model/format';
import { isBlankProject } from '../library';
import { isIOS } from '../print';

/** A saved project as it opens in the app (older records brought up to date), for the list and for exports. */
export function upToDate(raw: any, s: Settings): Project {
  return migrate({ ...newProject(s), ...raw, id: raw.id, created: raw.created, modified: raw.modified });
}

/** One line of My PQP Plans, from a saved project. */
export function toInfo(raw: any, s: Settings): PqpInfo {
  const p = upToDate(raw, s);
  return {
    id: p.id, name: p.P01.trim(), code: projectCode(p) || p.P02.trim(), docRef: docRef(p),
    rev: /^\d{2}$/.test(p.D03) ? p.D03 : '', date: dmy(p.D04), status: p.D05 || '',
    modified: String(raw.modified || ''), created: String(raw.created || ''), blank: isBlankProject(p),
  };
}

const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(+d) ? '' : d.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export interface PqpsProps {
  plans: PqpInfo[];
  currentId: string;
  busyId: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onOpenFile: () => void;
  onSample: () => void;
  onPreview: (id: string) => void;
  onWord: (id: string) => void;
  onPdf: (id: string) => void;
  onPrint: (id: string) => void;
  onSaveFile: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** My PQP Plans: every PQP created in this browser, each with Preview, Word, PDF and Print (as My HSE Plans in HSE Plan Maker). */
export function MyPqps(props: PqpsProps) {
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState('');
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu('');
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [menu]);
  const act = (fn: (id: string) => void, id: string) => () => { setMenu(''); fn(id); };
  const needle = q.trim().toLowerCase();
  const list = props.plans.filter((x) => !needle || `${x.name} ${x.code} ${x.docRef} ${x.status}`.toLowerCase().includes(needle));
  return (
    <div class="plans">
      <p class="lead">Every PQP created in this browser. Open one to edit it, or get its Preview, Word file or PDF straight from here.</p>
      <div class="plans-bar">
        <button class="btn primary" onClick={props.onNew}>New PQP</button>
        <button class="btn" onClick={props.onOpenFile}>Open PQP file…</button>
        <button class="btn ghost" onClick={props.onSample}>Load sample data</button>
        {props.plans.length > 4 && <input class="plans-search" type="search" placeholder="Search by name, code or Doc Ref" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} aria-label="Search PQPs" />}
      </div>
      {list.length === 0 ? (
        <div class="plans-empty">{props.plans.length ? 'No PQP matches the search.' : 'No PQPs yet. Start a new PQP, open a .pqp file or send a project from the Oxypro Project Library.'}</div>
      ) : (
        <ul class="plan-list">
          {list.map((x) => {
            const busy = props.busyId === x.id;
            const cur = x.id === props.currentId;
            return (
              <li key={x.id} class={'plan' + (cur ? ' current' : '')}>
                <div class="plan-main">
                  <button class="plan-name linkbtn" onClick={() => props.onOpen(x.id)} title="Open to edit">{x.name || 'Untitled project'}</button>
                  <div class="plan-meta">
                    {x.code && <span class="tag">{x.code}</span>}
                    <span class="plan-ref">{x.docRef}</span>
                    <span>Rev {x.rev || '–'}</span>
                    {x.date && <span>Dated {x.date}</span>}
                    {x.status && <span class="plan-status">{x.status}</span>}
                    <span class="muted">Edited {when(x.modified)}</span>
                    {cur && <span class="pill on">Open now</span>}
                  </div>
                </div>
                <div class="plan-acts">
                  <button class="btn small" disabled={busy} onClick={() => props.onPreview(x.id)}>Preview</button>
                  <button class="btn small primary" disabled={busy} onClick={() => props.onWord(x.id)}>Word</button>
                  <button class="btn small primary" disabled={busy} onClick={() => props.onPdf(x.id)}>PDF</button>
                  <button class="btn small" disabled={busy} onClick={() => props.onPrint(x.id)}>Print</button>
                  <div class="more">
                    <button class="btn small ghost" aria-haspopup="menu" aria-expanded={menu === x.id} onClick={() => setMenu(menu === x.id ? '' : x.id)}>More ▾</button>
                    {menu === x.id && (
                      <div class="more-menu" role="menu">
                        <button role="menuitem" class="btn small ghost" onClick={act(props.onOpen, x.id)}>Open to edit</button>
                        <button role="menuitem" class="btn small ghost" onClick={act(props.onDuplicate, x.id)}>Duplicate</button>
                        <button role="menuitem" class="btn small ghost" onClick={act(props.onSaveFile, x.id)}>Save as .pqp file…</button>
                        <button role="menuitem" class="btn small ghost danger" onClick={act(props.onDelete, x.id)}>Delete…</button>
                      </div>
                    )}
                  </div>
                  {busy && <span class="plan-busy" role="status">Working…</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p class="help plans-note">PQPs are kept in this browser on this device. The web version and the double-click copy (PQP Maker.html) keep separate lists, so save a .pqp file to move a PQP between them or to keep a copy with the project records.</p>
    </div>
  );
}

/** Full-screen preview of any PQP, with its downloads. */
export function PreviewModal(props: { plan: Project; pdf: PdfEntry | null; failed: string; onClose: () => void; onWord: () => void; onPdf: () => void; onPrint: () => void; onOpen: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pv-title" onClick={props.onClose}>
      <div class="preview" onClick={(e) => e.stopPropagation()}>
        <header class="pv-head">
          <div>
            <h2 id="pv-title">{props.plan.P01.trim() || 'Untitled project'}</h2>
            <span class="rv-meta">{docRef(props.plan)}{props.pdf ? ` · ${props.pdf.pages} pages` : props.failed ? '' : ' · building the preview…'}</span>
          </div>
          <div class="pv-acts">
            <button class="btn small" onClick={props.onOpen}>Open to edit</button>
            <button class="btn small primary" onClick={props.onWord} disabled={!props.pdf}>Word</button>
            <button class="btn small primary" onClick={props.onPdf} disabled={!props.pdf}>PDF</button>
            <button class="btn small" onClick={props.onPrint} disabled={!props.pdf}>Print</button>
            {props.pdf && <a class="btn small" href={props.pdf.url} target="_blank" rel="noopener">New tab</a>}
            <button class="panel-close" aria-label="Close preview" title="Close (Esc)" onClick={props.onClose}>✕</button>
          </div>
        </header>
        {props.failed ? <div class="rv-frame rv-wait rv-fail" role="alert">The preview could not be built: {props.failed}</div>
          : props.pdf ? <iframe class="pv-frame" src={props.pdf.url + '#view=FitH'} title="PQP preview" />
          : <div class="rv-frame rv-wait" role="status">Building the preview. This takes a few seconds for a full PQP.</div>}
        {isIOS && props.pdf && <p class="help">On iPhone and iPad tap New tab to scroll through every page.</p>}
      </div>
    </div>
  );
}
