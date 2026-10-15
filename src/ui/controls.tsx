import { useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { FieldSpec } from '../model/fields';
import type { ImageData, Person, ExtraPerson, RevRow, FormRow, CertRow } from '../model/types';
import { readImageFile, CERT_URLS } from '../platform-browser';
import { todayISO } from '../model/format';
import { dmy } from '../model/format';
import { R1_FORMS } from '../model/defaults';

export function Row(props: { f: FieldSpec; error?: string | null; children: ComponentChildren; wide?: boolean }) {
  const { f, error } = props;
  const id = 'f-' + f.id;
  return (
    <div class={'field' + (props.wide ? ' wide' : '') + (error ? ' has-error' : '')} id={'row-' + f.id}>
      <label class="label" for={id}>
        {f.label}
        {f.mandatory && <span class="req" title="Required">*</span>}
        <span class="fid">{f.id}</span>
      </label>
      <div class="control">{props.children}</div>
      {error && <div class="err" role="alert">{error}</div>}
      {(f.help || f.usedIn) && (
        <div class="help">
          {f.help}
          {f.help && f.usedIn ? ' ' : ''}
          {f.usedIn && <span class="used">Used in: {f.usedIn}</span>}
        </div>
      )}
    </div>
  );
}

export function TextInput(props: { id: string; value: string; onInput: (v: string) => void; numeric?: boolean; placeholder?: string; type?: string }) {
  return (
    <input id={props.id} type={props.type || 'text'} value={props.value} placeholder={props.placeholder}
      inputMode={props.numeric ? 'numeric' : undefined} autoComplete="off"
      onInput={(e) => props.onInput((e.target as HTMLInputElement).value)} />
  );
}

export function TextArea(props: { id: string; value: string; onInput: (v: string) => void; max?: number; rows?: number }) {
  return (
    <div class="ta">
      <textarea id={props.id} rows={props.rows || 4} value={props.value} onInput={(e) => props.onInput((e.target as HTMLTextAreaElement).value)} />
      {props.max && <div class={'count' + (props.value.length > props.max ? ' over' : '')}>{props.value.length} / {props.max}</div>}
    </div>
  );
}

export function Select(props: { id: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select id={props.id} value={props.value} onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}>
      <option value="">Select…</option>
      {props.options.map((o) => <option value={o}>{o}</option>)}
    </select>
  );
}

export function Multi(props: { id: string; value: string[]; options: string[]; onChange: (v: string[]) => void; other?: string; onOther?: (v: string) => void }) {
  const toggle = (o: string) => props.onChange(props.value.includes(o) ? props.value.filter((x) => x !== o) : [...props.value, o]);
  return (
    <div>
      <div class="chips" role="group" id={props.id}>
        {props.options.map((o) => (
          <label class={'chip' + (props.value.includes(o) ? ' on' : '')}>
            <input type="checkbox" checked={props.value.includes(o)} onChange={() => toggle(o)} />
            {o}
          </label>
        ))}
      </div>
      {props.onOther && props.value.includes('Other') && (
        <input class="other" type="text" placeholder="Other – specify (separate with commas)" value={props.other || ''} onInput={(e) => props.onOther!((e.target as HTMLInputElement).value)} />
      )}
    </div>
  );
}

export function Toggle(props: { id: string; value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label class="toggle">
      <input id={props.id} type="checkbox" checked={props.value} onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)} />
      <span>{props.label}</span>
    </label>
  );
}

export function ImagePick(props: { id: string; value: ImageData | null; maxMB: number; onChange: (v: ImageData | null) => void; onError: (m: string) => void; fallback?: string; fallbackLabel?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!f) return;
    setBusy(true);
    try { props.onChange(await readImageFile(f, props.maxMB)); } catch (err: any) { props.onError(err.message || String(err)); } finally { setBusy(false); }
  };
  const src = props.value?.dataUrl || props.fallback;
  return (
    <div class="imgpick">
      <div class={'thumb' + (src ? '' : ' empty')}>{src ? <img src={src} alt="" /> : <span>No image</span>}</div>
      <div class="imgside">
        <div class="imgname">{props.value ? props.value.name : props.fallbackLabel || 'None'}</div>
        <div class="btnrow">
          <button type="button" class="btn small" onClick={() => ref.current?.click()} disabled={busy}>{busy ? 'Reading…' : props.value ? 'Replace image' : 'Choose image'}</button>
          {props.value && <button type="button" class="btn small ghost" onClick={() => props.onChange(null)}>{props.fallback ? 'Use default' : 'Remove'}</button>}
        </div>
      </div>
      <input ref={ref} id={props.id} type="file" accept="image/png,image/jpeg,image/*" hidden onChange={pick} />
    </div>
  );
}

export function Images(props: { id: string; value: ImageData[]; maxMB: number; onChange: (v: ImageData[]) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (e: Event) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    (e.target as HTMLInputElement).value = '';
    const add: ImageData[] = [];
    for (const f of files) {
      try { add.push(await readImageFile(f, props.maxMB)); } catch (err: any) { props.onError(err.message || String(err)); }
    }
    if (add.length) props.onChange([...props.value, ...add]);
  };
  return (
    <div>
      <div class="gallery">
        {props.value.map((im, i) => (
          <figure>
            <img src={im.dataUrl} alt="" />
            <figcaption>{im.name}</figcaption>
            <button type="button" class="btn small ghost" onClick={() => props.onChange(props.value.filter((_, j) => j !== i))}>Remove</button>
          </figure>
        ))}
      </div>
      <button type="button" class="btn small" onClick={() => ref.current?.click()}>Add images</button>
      <input ref={ref} id={props.id} type="file" accept="image/png,image/jpeg,image/*" multiple hidden onChange={pick} />
    </div>
  );
}

export function PersonInput(props: { id: string; value: Person; onChange: (v: Person) => void }) {
  const v = props.value;
  return (
    <div class="grid3">
      <input id={props.id} type="text" placeholder="Name" value={v.name} onInput={(e) => props.onChange({ ...v, name: (e.target as HTMLInputElement).value })} />
      <input type="email" placeholder="Email (optional)" value={v.email} onInput={(e) => props.onChange({ ...v, email: (e.target as HTMLInputElement).value })} />
      <input type="tel" placeholder="Phone (optional)" value={v.phone} onInput={(e) => props.onChange({ ...v, phone: (e.target as HTMLInputElement).value })} />
    </div>
  );
}

function RowsTable<T>(props: { id: string; head: string[]; rows: T[]; render: (r: T, set: (r: T) => void) => ComponentChildren[]; onChange: (v: T[]) => void; blank: () => T; addLabel: string; extra?: ComponentChildren; minRows?: number }) {
  const set = (i: number) => (r: T) => props.onChange(props.rows.map((x, j) => (j === i ? r : x)));
  return (
    <div class="rows" id={props.id}>
      <div class="rtable" role="table">
        <div class="rhead" role="row">{props.head.map((h) => <div role="columnheader">{h}</div>)}<div /></div>
        {props.rows.map((r, i) => (
          <div class="rrow" role="row">
            {props.render(r, set(i)).map((c) => <div role="cell">{c}</div>)}
            <div role="cell">
              <button type="button" class="btn small ghost" disabled={props.rows.length <= (props.minRows || 0)} onClick={() => props.onChange(props.rows.filter((_, j) => j !== i))} aria-label="Remove row">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div class="btnrow">
        <button type="button" class="btn small" onClick={() => props.onChange([...props.rows, props.blank()])}>{props.addLabel}</button>
        {props.extra}
      </div>
    </div>
  );
}

const inp = (val: string, on: (v: string) => void, ph = '', type = 'text') => (
  <input type={type} value={val} placeholder={ph} onInput={(e) => on((e.target as HTMLInputElement).value)} />
);

export function People(props: { id: string; value: ExtraPerson[]; onChange: (v: ExtraPerson[]) => void }) {
  return (
    <RowsTable id={props.id} head={['Role', 'Name', 'Email', 'Phone']} rows={props.value} onChange={props.onChange} addLabel="Add person"
      blank={() => ({ role: '', name: '', email: '', phone: '' })}
      render={(r, set) => [inp(r.role, (v) => set({ ...r, role: v }), 'e.g. Site Engineer'), inp(r.name, (v) => set({ ...r, name: v })), inp(r.email, (v) => set({ ...r, email: v }), '', 'email'), inp(r.phone, (v) => set({ ...r, phone: v }), '', 'tel')]} />
  );
}

export function Revisions(props: { id: string; value: RevRow[]; onChange: (v: RevRow[]) => void }) {
  return (
    <RowsTable id={props.id} head={['Rev', 'Date', 'Particulars of Revision']} rows={props.value} onChange={props.onChange} addLabel="Add revision row" minRows={1}
      blank={() => ({ rev: String(props.value.length).padStart(2, '0'), date: '', desc: '' })}
      render={(r, set) => [inp(r.rev, (v) => set({ ...r, rev: v }), '00'), inp(r.date, (v) => set({ ...r, date: v }), '', 'date'), inp(r.desc, (v) => set({ ...r, desc: v }), 'e.g. Initial Issue')]} />
  );
}

export function Forms(props: { id: string; value: FormRow[]; onChange: (v: FormRow[]) => void }) {
  return (
    <RowsTable id={props.id} head={['Form / Register / Template', 'Code']} rows={props.value} onChange={props.onChange} addLabel="Add form"
      blank={() => ({ title: '', code: '' })}
      extra={<button type="button" class="btn small ghost" onClick={() => props.onChange(R1_FORMS.map((f) => ({ ...f })))}>Reset to R1 list</button>}
      render={(r, set) => [inp(r.title, (v) => set({ ...r, title: v })), inp(r.code, (v) => set({ ...r, code: v }))]} />
  );
}

/** One row per standard: number, certifying body, expiry and the scan printed in Annexure 8.2. */
export function Certs(props: { id: string; value: CertRow[]; ticked: string[]; onChange: (v: CertRow[]) => void; onError: (m: string) => void }) {
  const today = todayISO();
  const soon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const set = (i: number, c: CertRow) => props.onChange(props.value.map((x, j) => (j === i ? c : x)));
  return (
    <div class="certs" id={props.id}>
      {props.value.map((c, i) => {
        const on = props.ticked.includes(c.std);
        const builtIn = CERT_URLS[c.std];
        const expired = c.expiry && c.expiry < today;
        const expiring = !expired && c.expiry && c.expiry <= soon;
        return (
          <div class={'cert' + (on ? '' : ' off')}>
            <div class="certhead">
              <strong>{c.std}</strong>
              <span class={'pill' + (on ? ' on' : '')}>{on ? 'Ticked: printed in Annexure 8.2' : 'Not ticked: not printed'}</span>
            </div>
            <div class="certgrid">
              <label>Certificate No.<input type="text" value={c.no} onInput={(e) => set(i, { ...c, no: (e.target as HTMLInputElement).value })} /></label>
              <label>Certifying body<input type="text" value={c.body} onInput={(e) => set(i, { ...c, body: (e.target as HTMLInputElement).value })} /></label>
              <label>Valid until<input type="date" value={c.expiry} onInput={(e) => set(i, { ...c, expiry: (e.target as HTMLInputElement).value })} /></label>
            </div>
            {expired && <div class="err">Expired on {dmy(c.expiry)}. Attach the renewed certificate and update the details.</div>}
            {expiring && <div class="warnline">Expires on {dmy(c.expiry)}.</div>}
            <ImagePick id={`${props.id}-${i}`} value={c.image} maxMB={5} onChange={(img) => set(i, { ...c, image: img })} onError={props.onError}
              fallback={builtIn} fallbackLabel={builtIn ? 'Built-in Oxypro certificate' : 'No scan yet: Annexure 8.2 will say it is to be attached'} />
          </div>
        );
      })}
    </div>
  );
}

export function Calc(props: { value: string; note?: string }) {
  return <div class="calc"><span>{props.value || '—'}</span>{props.note && <small>{props.note}</small>}</div>;
}

export { dmy };
