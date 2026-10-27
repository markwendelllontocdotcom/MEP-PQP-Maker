import type { Project, ImageData } from './model/types';
import { EMIRATES, PROJECT_TYPES, AUTHORITIES, CODES } from './model/defaults';
import { PROJECT_CODE, PROJECT_CODE_MAX } from './model/format';

/**
 * Projects sent from the Oxypro Project Library (27 Oct 2026).
 * The Library opens PQP Maker at  WEB_URL#library=<data>  where <data> is the .pqp file JSON
 * (format pqp-maker-project) compressed with deflate-raw and written as base64url
 * (#library-json= for plain JSON when the browser cannot compress). The part after # never
 * leaves the browser, so nothing is uploaded.
 * Only the Library's own fields are taken; everything else stays the user's input in PQP Maker.
 */
export interface LibraryProject { fields: Partial<Project>; source: string; }

export const LIBRARY_KEYS = ['P01', 'P02', 'P04', 'P05', 'P06', 'P07', 'P10', 'P11', 'P13', 'R01', 'R02', 'R03', 'R06', 'R06other', 'Q07', 'Q07other', 'R10'] as const;

/** Labels for the fields a Library project can fill, in form order. */
export const LIBRARY_LABELS: Record<string, string> = {
  P01: 'Project Name', P02: 'Project Code & Project Number', P04: 'Location / Emirate', P05: 'Plot No. / Address', P06: 'Project Type',
  P07: 'Scope of Work', P10: 'Commencement Date', P11: 'Completion Date', P13: 'Building Configuration', R01: 'Client', R02: 'Consultant',
  R03: 'Main Contractor', R06: 'Approving Authorities', Q07: 'Applicable Codes & Standards', R10: 'Cover Photo',
};

const MAX: Record<string, number> = { P01: 150, P05: 300, P07: 2000, P13: 500, R01: 200, R02: 200, R03: 200, R06other: 300, Q07other: 300 };
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function fromBase64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function inflate(bytes: Uint8Array): Promise<string> {
  const DS = (globalThis as any).DecompressionStream;
  if (!DS) throw new Error('This browser cannot read the project from the Library. Use Edge or Chrome, or save the file in the Library and Open it here.');
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DS('deflate-raw'));
  return await new Response(stream).text();
}

/** True when the address carries a project from the Library. */
export const hasLibraryHash = (hash: string) => /^#library(-json)?=/.test(hash || '');

/** Reads the project from the address. Throws with a message for the user when it cannot be read. */
export async function readLibraryHash(hash: string): Promise<LibraryProject> {
  const m = (hash || '').match(/^#library(-json)?=([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('The link from the Library is incomplete. Send the project again.');
  let text: string;
  try {
    const bytes = fromBase64Url(m[2]);
    text = m[1] ? new TextDecoder().decode(bytes) : await inflate(bytes);
  } catch (e: any) {
    throw new Error(e?.message && /browser/.test(e.message) ? e.message : 'The link from the Library could not be read. Send the project again.');
  }
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error('The link from the Library could not be read. Send the project again.'); }
  if (!j || j.format !== 'pqp-maker-project' || !j.project || typeof j.project !== 'object') throw new Error('This link does not hold a PQP Maker project.');
  return { fields: cleanFields(j.project), source: String(j.source?.library || '').slice(0, 40) };
}

/** Keeps only the Library fields, with the types and limits the form allows. */
export function cleanFields(x: any): Partial<Project> {
  const out: any = {};
  const str = (k: string) => { const v = x[k]; if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, MAX[k] || 200); };
  const list = (k: string, allowed: string[]) => { const v = x[k]; if (Array.isArray(v)) { const l = v.filter((s) => typeof s === 'string' && allowed.includes(s)); if (l.length) out[k] = l; } };
  for (const k of ['P01', 'P05', 'P07', 'P13', 'R01', 'R02', 'R03', 'R06other', 'Q07other']) str(k);
  if (typeof x.P02 === 'string') { const c = x.P02.trim().toUpperCase(); if (c.length <= PROJECT_CODE_MAX && PROJECT_CODE.test(c)) out.P02 = c; }
  if (typeof x.P04 === 'string' && EMIRATES.includes(x.P04)) out.P04 = x.P04;
  for (const k of ['P10', 'P11']) if (typeof x[k] === 'string' && ISO.test(x[k])) out[k] = x[k];
  list('P06', PROJECT_TYPES);
  list('R06', AUTHORITIES);
  list('Q07', CODES);
  const img = x.R10;
  if (img && typeof img.dataUrl === 'string' && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(img.dataUrl) && img.dataUrl.length < 7_000_000) {
    const ph: ImageData = { name: String(img.name || 'Cover Photo.jpg').slice(0, 120), type: img.dataUrl.slice(5, img.dataUrl.indexOf(';')), dataUrl: img.dataUrl };
    if (+img.w > 0 && +img.h > 0) { ph.w = Math.round(+img.w); ph.h = Math.round(+img.h); }
    out.R10 = ph;
  }
  return out;
}

/** True when nothing has been typed into the project yet (a new project). */
export const isBlankProject = (p: Project) => !p.P01.trim() && !p.P02.trim() && !p.P07.trim() && !p.R01.trim();

/**
 * Lays the Library fields over a project. Updating a PQP already started keeps its own cover photo;
 * Other text goes with its list (an emptied list clears it).
 */
export function applyLibrary(base: Project, f: Partial<Project>, keepPhoto: boolean): Project {
  const n: any = { ...base, ...f, modified: new Date().toISOString() };
  if (f.R06 && !f.R06.includes('Other')) n.R06other = '';
  if (f.Q07 && !f.Q07.includes('Other')) n.Q07other = '';
  if (keepPhoto && base.R10) n.R10 = base.R10;
  return n as Project;
}
