import type { Project } from './model/types';
import { APP_NAME, APP_VERSION } from './version';
import { safeFileName } from './model/format';

const FORMAT = 'pqp-maker-project';
const hasPicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
export const isIOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function serialise(p: Project): string {
  return JSON.stringify({ format: FORMAT, version: 1, app: `${APP_NAME} ${APP_VERSION}`, saved: new Date().toISOString(), project: p }, null, 1);
}

export function parseProjectFile(text: string): Project {
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error('This file is not a PQP Maker project.'); }
  if (!j || j.format !== FORMAT || !j.project) throw new Error('This file is not a PQP Maker project.');
  return j.project as Project;
}

export function download(bytes: Uint8Array | string, name: string, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export type Handle = any; // FileSystemFileHandle where supported

/** Save to the same file when we have a handle; otherwise ask (Save As) or download. */
export async function saveProjectFile(p: Project, handle: Handle | null, saveAs: boolean): Promise<{ handle: Handle | null; name: string } | null> {
  const text = serialise(p);
  const suggested = safeFileName(p.P01 || 'Untitled project') + '.pqp';
  if (hasPicker) {
    try {
      let h = handle;
      if (!h || saveAs) {
        h = await (window as any).showSaveFilePicker({ suggestedName: suggested, types: [{ description: 'PQP Maker project', accept: { 'application/json': ['.pqp'] } }] });
      }
      const w = await h.createWritable();
      await w.write(text);
      await w.close();
      return { handle: h, name: h.name };
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
      // fall through to download when the picker is blocked (e.g. inside a frame)
    }
  }
  download(text, suggested, 'application/json');
  return { handle: null, name: suggested };
}

export async function openProjectFile(): Promise<{ project: Project; handle: Handle | null; name: string } | null> {
  if (hasPicker && 'showOpenFilePicker' in window) {
    try {
      const [h] = await (window as any).showOpenFilePicker({ types: [{ description: 'PQP Maker project', accept: { 'application/json': ['.pqp', '.json'] } }] });
      const f = await h.getFile();
      return { project: parseProjectFile(await f.text()), handle: h, name: f.name };
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
      if (e instanceof Error && /PQP Maker/.test(e.message)) throw e;
    }
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (!isIOS) input.accept = '.pqp,.json,application/json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      try { resolve({ project: parseProjectFile(await f.text()), handle: null, name: f.name }); } catch (e) { reject(e); }
    };
    input.click();
  });
}
