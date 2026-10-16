import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Project, Settings } from './model/types';
import { FIELDS, GROUPS, fieldError, allErrors, missingMandatory, type FieldSpec } from './model/fields';
import { defaultSettings, newProject, testProject, migrate } from './model/defaults';
import { docRef, revLabel, dmy, durationDays, DOC_REF_FORMAT } from './model/format';
import { sectionUnits } from './content/build';
import { store } from './storage';
import { saveProjectFile, openProjectFile, type Handle } from './files';
import { exportWord, exportPdf } from './exporter';
import { canPickFolder, loadExportDir, chooseExportDir, forgetExportDir, ensureWritable, wasAsked, markAsked } from './exportdir';
import { ASSET_URLS } from './platform-browser';
import { Row, TextInput, TextArea, Select, Multi, Toggle, ImagePick, Images, PersonInput, People, Persons, Revisions, Forms, Calc, Certs } from './ui/controls';
import { OrgPreview } from './ui/orgpreview';
import { About } from './ui/about';
import { QE_MAX } from './content/orgchart';
import { APP_NAME, APP_VERSION, CREDIT } from './version';
import iconUrl from './assets/icon-app.png?inline';

type Dialog = { title: string; body: ComponentChildren; actions: { label: string; primary?: boolean; run: () => void }[] } | null;

const UNITS = sectionUnits();

/** Role prompts for the people lists in Key Personnel. */
const PEOPLE_HINTS: Record<string, { rolePlaceholder: string; defaultRole?: string }> = {
  K08: { rolePlaceholder: 'e.g. Construction Manager', defaultRole: 'Construction Manager' },
  K09: { rolePlaceholder: 'e.g. Project Engineer – Electrical', defaultRole: 'Project Engineer' },
  K06: { rolePlaceholder: 'e.g. HSE Manager' },
};

function numberedUnits(off: Set<string>, short: string) {
  const c = [0, 0, 0, 0];
  return UNITS.map((u) => {
    const parentOff = !!u.parent && (off.has(u.parent) || (u.parent.includes(':') && off.has(u.parent.split(':')[0])));
    const on = !off.has(u.id) && !parentOff;
    let num = '';
    if (on) {
      c[u.level]++;
      for (let k = u.level + 1; k < c.length; k++) c[k] = 0;
      num = c.slice(1, u.level + 1).join('.') + (u.level === 1 ? '.' : '');
      if (u.id === 'proc:quality-kpis') num = c.slice(1, 3).join('.') + '.6';
    }
    return { ...u, title: u.title.replace(/\{\{CO\}\}/g, short), on, parentOff, num };
  });
}

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [p, setP] = useState<Project | null>(null);
  const [group, setGroup] = useState('project');
  const [handle, setHandle] = useState<Handle | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dirtyFile, setDirtyFile] = useState(false);
  const [autosaved, setAutosaved] = useState<string>('');
  const [busy, setBusy] = useState<string>('');
  const [toast, setToast] = useState<string>('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [exportDir, setExportDir] = useState<any>(null); // folder every export is saved into (Edge / Chrome)
  const [askedFolder, setAskedFolder] = useState(true);
  const lastSnap = useRef(0);
  const first = useRef(true);

  // ---------------- load
  useEffect(() => {
    (async () => {
      const s = { ...defaultSettings(), ...((await store.loadSettings()) || {}) };
      if (s.docRefPrefix === 'OPEM-E') s.docRefPrefix = 'OPEM'; // Doc Ref format of 16 Oct 2026
      setSettings(s);
      const id = await store.loadCurrentId();
      const saved = id ? await store.loadProject(id) : undefined;
      setP(saved ? migrate({ ...newProject(s), ...saved }) : newProject(s));
      store.persist();
      setExportDir(await loadExportDir());
      setAskedFolder(await wasAsked());
    })();
  }, []);

  // ---------------- autosave (about 1 s after the last change)
  useEffect(() => {
    if (!p) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(async () => {
      await store.saveProject(p);
      await store.touchRecent(p);
      if (Date.now() - lastSnap.current > 120000) { lastSnap.current = Date.now(); await store.snapshot(p); }
      setAutosaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearTimeout(t);
  }, [p]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const errors = useMemo(() => (p ? allErrors(p) : []), [p]);
  const missing = useMemo(() => (p ? missingMandatory(p) : []), [p]);

  if (!p) return <div class="boot">Loading…</div>;

  // ---------------- updates with the linked-field rules
  const set = (id: string, v: any) => {
    setP((old) => {
      if (!old) return old;
      const n: any = { ...old, [id]: v, modified: new Date().toISOString() };
      // K03 is a list: the first QA/QC Engineer follows Prepared By
      const nameOf = (src: any, k: string) => { const x = src[k]; return ((Array.isArray(x) ? x[0]?.name : x?.name) || '') as string; };
      const follow = (dKey: string, kKey: string) => {
        if (!old[dKey as keyof Project] || old[dKey as keyof Project] === nameOf(old, kKey)) n[dKey] = nameOf(n, kKey);
      };
      if (id === 'K01') follow('D10', 'K01');
      if (id === 'K02') follow('D08', 'K02');
      if (id === 'K03') follow('D06', 'K03');
      if (id === 'R05' && v === 'Main Contractor' && !old.R03.trim()) n.R03 = old.R04;
      if (id === 'D04' && old.P03 === (old.D04 || '').slice(2, 4) && /^\d{4}-/.test(v)) n.P03 = v.slice(2, 4);
      if (id === 'D03' && n.H01.length && n.H01[n.H01.length - 1].rev === old.D03) n.H01 = n.H01.map((r: any, i: number) => (i === n.H01.length - 1 ? { ...r, rev: v } : r));
      if (id === 'D04' && n.H01.length && n.H01[n.H01.length - 1].date === old.D04) n.H01 = n.H01.map((r: any, i: number) => (i === n.H01.length - 1 ? { ...r, date: v } : r));
      if (id === 'H01' && v.length) n.D03 = v[v.length - 1].rev;
      return n;
    });
    setDirtyFile(true);
  };
  const showError = (m: string) => setDialog({ title: 'Image not added', body: <p>{m}</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });

  // ---------------- file actions
  const confirmDiscard = (then: () => void) => {
    if (!dirtyFile) return then();
    setDialog({
      title: 'Unsaved changes',
      body: <p>This project has changes that are not saved to a file yet. They stay in this browser, but the .pqp file will not have them.</p>,
      actions: [
        { label: 'Cancel', run: () => setDialog(null) },
        { label: 'Continue', primary: true, run: () => { setDialog(null); then(); } },
      ],
    });
  };
  const doNew = () => confirmDiscard(() => { const n = newProject(settings); setP(n); setHandle(null); setFileName(''); setDirtyFile(false); setGroup('project'); store.saveProject(n); setToast('New project started'); });
  const doSample = () => confirmDiscard(() => { const n = testProject(settings); setP(n); setHandle(null); setFileName(''); setDirtyFile(true); setGroup('project'); store.saveProject(n); setToast('Sample data loaded (column J of the fields sheet)'); });
  const doOpen = () => confirmDiscard(async () => {
    try {
      const r = await openProjectFile();
      if (!r) return;
      const merged = migrate({ ...newProject(settings), ...r.project });
      setP(merged); setHandle(r.handle); setFileName(r.name); setDirtyFile(false); store.saveProject(merged);
      setToast(`Opened ${r.name}`);
    } catch (e: any) {
      setDialog({ title: 'Could not open the file', body: <p>{e.message || String(e)}</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });
    }
  });
  const doSave = async (saveAs: boolean) => {
    const r = await saveProjectFile(p, handle, saveAs, exportDir);
    if (!r) return;
    setHandle(r.handle); setFileName(r.name); setDirtyFile(false);
    setToast(r.handle ? `Saved to ${r.name}` : `Downloaded ${r.name}`);
  };

  const exportDoc = (kind: 'word' | 'pdf') => {
    if (errors.length) {
      setDialog({
        title: `Fix ${errors.length} ${errors.length === 1 ? 'entry' : 'entries'} before exporting`,
        body: <ul class="issues">{errors.map((e) => <li><button class="linkbtn" onClick={() => { setDialog(null); goTo(e.f); }}>{e.f.label}</button>: {e.msg}</li>)}</ul>,
        actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }],
      });
      return;
    }
    const run = async (picked?: any) => {
      setDialog(null);
      let dir = picked !== undefined ? picked : exportDir;
      if (dir && !(await ensureWritable(dir))) dir = null; // permission refused: download instead
      setBusy(kind === 'word' ? 'Building the Word file…' : 'Building the PDF…');
      try {
        const r = kind === 'word' ? await exportWord(p, settings, dir) : await exportPdf(p, settings, dir);
        setToast((r.folder ? `Saved to ${r.folder}: ${r.name}` : `Downloaded ${r.name}`) + (r.pages ? ` (${r.pages} pages)` : ''));
        if (r.note) setDialog({ title: 'Saved to Downloads instead', body: <p>{r.note} Close the file and export again to save it in {exportDir?.name || 'the export folder'}.</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });
      } catch (e: any) {
        console.error(e);
        setDialog({ title: 'Export failed', body: <p>{e?.message || String(e)}</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });
      } finally { setBusy(''); }
    };
    // first export on Edge / Chrome: ask once which folder the exports go to
    const start = () => {
      if (!canPickFolder || exportDir || askedFolder) return run();
      setDialog({
        title: 'Where should exports be saved?',
        body: <><p>Choose a folder once, for example the <b>Samples</b> folder in your PQP Maker project folder. Every Word and PDF export is then saved straight into it, replacing an older export of the same name.</p><p>You can change it later under the export buttons.</p></>,
        actions: [
          { label: 'Use Downloads', run: () => { markAsked(); setAskedFolder(true); run(null); } },
          { label: 'Choose folder…', primary: true, run: async () => { const h = await pickFolder(); if (!h) return; markAsked(); setAskedFolder(true); run(h); } },
        ],
      });
    };
    if (missing.length) {
      setDialog({
        title: `${missing.length} required ${missing.length === 1 ? 'field is' : 'fields are'} empty`,
        body: <><p>They will show as placeholders such as [PROJECT NAME] in the document.</p><ul class="issues">{missing.slice(0, 12).map((f) => <li><button class="linkbtn" onClick={() => { setDialog(null); goTo(f); }}>{f.label}</button></li>)}{missing.length > 12 && <li>and {missing.length - 12} more</li>}</ul></>,
        actions: [{ label: 'Go back', run: () => setDialog(null) }, { label: 'Export anyway', primary: true, run: start }],
      });
    } else start();
  };

  const pickFolder = async (): Promise<any> => {
    try {
      const h = await chooseExportDir(exportDir);
      if (h) { setExportDir(h); setToast(`Exports will be saved to ${h.name}`); }
      return h;
    } catch (e: any) {
      setDialog({ title: 'Folder not set', body: <p>{e?.message || String(e)}</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });
      return null;
    }
  };
  const useDownloads = async () => { await forgetExportDir(); setExportDir(null); setToast('Exports will go to the Downloads folder'); };

  const goTo = (f: FieldSpec) => {
    setGroup(f.group);
    setTimeout(() => {
      const el = document.getElementById('row-' + f.id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el?.querySelector('input,select,textarea,button') as HTMLElement | null)?.focus();
    }, 60);
  };

  // ---------------- field renderer
  const render = (f: FieldSpec) => {
    const v: any = (p as any)[f.id];
    const err = fieldError(f, p);
    const id = 'f-' + f.id;
    let ctl: ComponentChildren = null;
    let wide = false;
    switch (f.type) {
      case 'text': ctl = <TextInput id={id} value={v || ''} numeric={!!f.digits} onInput={(x) => set(f.id, x)} />; break;
      case 'number': ctl = <TextInput id={id} value={v || ''} numeric onInput={(x) => set(f.id, x.trim())} />; break;
      case 'longtext': ctl = <TextArea id={id} value={v || ''} max={f.max} onInput={(x) => set(f.id, x)} rows={f.id === 'A03text' ? 6 : 4} />; wide = true; break;
      case 'date': ctl = <TextInput id={id} type="date" value={v || ''} onInput={(x) => set(f.id, x)} />; break;
      case 'dropdown': ctl = <Select id={id} value={v || ''} options={f.options!} onChange={(x) => set(f.id, x)} />; break;
      case 'multi': ctl = <Multi id={id} value={v || []} options={f.options!} onChange={(x) => set(f.id, x)} other={f.otherKey ? (p as any)[f.otherKey] : undefined} onOther={f.otherKey ? (x) => set(f.otherKey as string, x) : undefined} />; wide = true; break;
      case 'toggle': ctl = <Toggle id={id} value={!!v} onChange={(x) => set(f.id, x)} label={v ? 'Shown on every page' : 'Hidden'} />; break;
      case 'image': ctl = <ImagePick id={id} value={v} maxMB={f.maxMB || 2} onChange={(x) => set(f.id, x)} onError={showError}
        fallback={f.id === 'R09' ? ASSET_URLS.logo : f.id === 'R12' ? ASSET_URLS.watermark : undefined}
        fallbackLabel={f.id === 'R09' ? 'Default: Oxypro logo' : f.id === 'R12' ? 'Default: faint Oxypro mark' : undefined} />; wide = true; break;
      case 'images': ctl = <Images id={id} value={v || []} maxMB={f.maxMB || 5} onChange={(x) => set(f.id, x)} onError={showError} />; wide = true; break;
      case 'person': ctl = <PersonInput id={id} value={v} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'persons': ctl = <Persons id={id} value={v || []} min={1} max={QE_MAX} addLabel="Add QA/QC Engineer" onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'people': ctl = <People id={id} value={v || []} onChange={(x) => set(f.id, x)} {...PEOPLE_HINTS[f.id]} />; wide = true; break;
      case 'revisions': ctl = <Revisions id={id} value={v} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'forms': ctl = <Forms id={id} value={v} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'certs': ctl = <Certs id={id} value={v || []} ticked={p.Q01} onChange={(x) => set(f.id, x)} onError={showError} />; wide = true; break;
      case 'calc': {
        if (f.id === 'P12') { const d = durationDays(p); ctl = <Calc value={d != null ? `${d} days` : ''} note="Completion Date minus Commencement Date" />; }
        if (f.id === 'D02') ctl = <Calc value={docRef(p)} note={DOC_REF_FORMAT} />;
        break;
      }
      case 'sections': return <SectionsPanel p={p} short={settings.companyShort} onChange={(x) => set('Q08off', x)} />;
    }
    return <Row f={f} error={err} wide={wide}>{ctl}</Row>;
  };

  const groupFields = FIELDS.filter((f) => f.group === group);
  const groupIssues = (g: string) => FIELDS.filter((f) => f.group === g && (fieldError(f, p) || (f.mandatory && missing.includes(f)))).length;
  const isAbout = group === 'about';
  const title = isAbout ? 'About PQP Maker' : GROUPS.find((g) => g.id === group)!.title;
  const ref = docRef(p);

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <img src={iconUrl} alt="" width={28} height={28} />
          <div>
            <div class="appname">{APP_NAME}</div>
            <div class="filestate">
              <span>{fileName ? fileName : 'Not saved to a file yet'}{dirtyFile && fileName ? ' (changed)' : ''}</span>
              {autosaved && <span class="autosave">Autosaved {autosaved}</span>}
            </div>
          </div>
        </div>
        <nav class="actions" aria-label="File">
          <button class="btn bar" onClick={doNew}>New</button>
          <button class="btn bar" onClick={doOpen}>Open</button>
          <button class="btn bar" onClick={() => doSave(false)}>Save</button>
          <button class="btn bar" onClick={() => doSave(true)}>Save as</button>
          <button class="btn bar" onClick={doSample}>Load sample data</button>
          <span class="sep" />
          <button class="btn bar primary" onClick={() => exportDoc('word')}>Export Word</button>
          <button class="btn bar primary" onClick={() => exportDoc('pdf')}>Export PDF</button>
        </nav>
      </header>

      <div class="body">
        <aside class="nav" aria-label="Input groups">
          {GROUPS.map((g) => {
            const n = g.id === 'sections' ? 0 : groupIssues(g.id);
            return (
              <button class={'navitem' + (g.id === group ? ' active' : '')} onClick={() => setGroup(g.id)} aria-current={g.id === group ? 'page' : undefined}>
                <span>{g.title}</span>
                {n > 0 && <span class="badge" title={`${n} to complete or fix`}>{n}</span>}
              </button>
            );
          })}
          <button class={'navitem navabout' + (isAbout ? ' active' : '')} onClick={() => setGroup('about')} aria-current={isAbout ? 'page' : undefined}>
            <span>About PQP Maker</span>
          </button>
        </aside>

        <main class="sheet" aria-labelledby="sheet-title">
          <h1 id="sheet-title">{title}</h1>
          {isAbout ? <About exportFolder={exportDir?.name || null} canPickFolder={canPickFolder} onGo={setGroup} /> : <>
          {group === 'branding' && <p class="lead">These come from Settings for each new project. Change them here for this project only.</p>}
          {group === 'revisions' && <p class="lead">The last row sets the revision shown on the cover and in the footer.</p>}
          {group === 'annex' && <p class="lead">Annexure 8.1 (organisation chart) is drawn from Key Personnel. Annexure 8.5 lists the Method Statements for the selected disciplines.</p>}
          {group === 'people' && <OrgPreview p={p} />}
          <div class="fields">{groupFields.map((f) => <>{f.section && <h2 class="subhead">{f.section}</h2>}{render(f)}</>)}</div>
          </>}
        </main>

        <aside class="titleblock" aria-label="Document summary">
          <div class="tb">
            <div class="tb-cell tb-wide"><span class="k">Project</span><span class="v">{p.P01 || '—'}</span></div>
            <div class="tb-cell tb-wide tb-ref"><span class="k">Doc Ref</span><span class="v ref">{ref}</span></div>
            <div class="tb-cell"><span class="k">Rev</span><span class="v">{revLabel(p).replace('Rev.', '')}</span></div>
            <div class="tb-cell"><span class="k">Dated</span><span class="v">{dmy(p.D04) || '—'}</span></div>
            <div class="tb-cell tb-wide tb-status"><span class="k">Status</span><span class="stamp">{p.D05 || 'Draft'}</span></div>
          </div>
          <div class="check">
            {errors.length === 0 && missing.length === 0 ? (
              <p class="ok">All required fields are complete.</p>
            ) : (
              <>
                {errors.length > 0 && <p class="bad">{errors.length} {errors.length === 1 ? 'entry needs' : 'entries need'} fixing before export.</p>}
                {missing.length > 0 && <p class="warn">{missing.length} required {missing.length === 1 ? 'field is' : 'fields are'} empty.</p>}
                <button class="linkbtn" onClick={() => goTo(errors[0]?.f || missing[0])}>Go to the first one</button>
              </>
            )}
          </div>
          <div class="exports">
            <button class="btn primary block" onClick={() => exportDoc('word')}>Export Word (.docx)</button>
            <button class="btn block" onClick={() => exportDoc('pdf')}>Export PDF</button>
            {canPickFolder ? (
              <div class="expdir">
                <span class="k">Exports are saved to</span>
                <span class="v" title={exportDir ? 'Folder chosen in this browser' : 'Browser Downloads folder'}>{exportDir ? exportDir.name : 'Downloads'}</span>
                <span class="acts">
                  <button class="linkbtn" onClick={pickFolder}>{exportDir ? 'Change folder' : 'Choose folder'}</button>
                  {exportDir && <button class="linkbtn" onClick={useDownloads}>Use Downloads</button>}
                </span>
              </div>
            ) : <p class="expdir-note">Exports go to your Downloads folder.</p>}
          </div>
        </aside>
      </div>

      <footer class="credit">{CREDIT} <span class="ver">v{APP_VERSION}</span> <button class="linkbtn about-link" onClick={() => { setGroup('about'); window.scrollTo({ top: 0 }); }}>About</button></footer>

      {busy && <div class="overlay" role="status"><div class="busy">{busy}</div></div>}
      {toast && <div class="toast" role="status">{toast}</div>}
      {dialog && (
        <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <div class="dialog">
            <h2 id="dlg-title">{dialog.title}</h2>
            <div class="dbody">{dialog.body}</div>
            <div class="dactions">{dialog.actions.map((a) => <button class={'btn' + (a.primary ? ' primary' : '')} onClick={a.run}>{a.label}</button>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionsPanel(props: { p: Project; short: string; onChange: (off: string[]) => void }) {
  const off = new Set(props.p.Q08off);
  const rows = numberedUnits(off, props.short || 'OXYPRO');
  const toggle = (id: string) => {
    const n = new Set(off);
    if (n.has(id)) n.delete(id); else n.add(id);
    props.onChange([...n]);
  };
  const onCount = rows.filter((r) => r.on).length;
  return (
    <div class="sections wide" id="row-Q08off">
      <p class="lead">Untick a section to leave it out. The sections after it are renumbered. {onCount} of {rows.length} included.</p>
      <div class="btnrow">
        <button class="btn small" onClick={() => props.onChange([])}>Include all</button>
      </div>
      <ul class="tree">
        {rows.map((r) => (
          <li class={'lv' + r.level + (r.parentOff ? ' muted' : '')}>
            <label>
              <input type="checkbox" checked={!off.has(r.id)} disabled={r.parentOff} onChange={() => toggle(r.id)} />
              <span class="num">{r.on ? r.num : ''}</span>
              <span class="t">{r.title.replace(' (added)', '')}</span>
              {r.added ? <span class="added">added</span> : null}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
