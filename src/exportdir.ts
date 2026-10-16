import { get, set, del } from 'idb-keyval';

/**
 * Export folder: on Windows and macOS (Edge / Chrome) the user picks a folder once, for example the
 * project's "Samples" folder, and every Word / PDF export is written straight into it. The folder
 * handle is kept in this browser's storage. Where folder access is not available (iPhone, Safari,
 * Firefox) or the folder cannot be written, the file is downloaded as before.
 */
type Dir = any; // FileSystemDirectoryHandle

const KEY = 'exportDir';
export const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export async function loadExportDir(): Promise<Dir | null> {
  if (!canPickFolder) return null;
  try { return (await get(KEY)) || null; } catch { return null; }
}

/** Whether the user was already asked once where exports should go. */
export async function wasAsked(): Promise<boolean> {
  try { return !!(await get(KEY + 'Asked')); } catch { return false; }
}
export async function markAsked(): Promise<void> {
  try { await set(KEY + 'Asked', true); } catch { /* storage unavailable */ }
}

export async function forgetExportDir(): Promise<void> {
  try { await del(KEY); } catch { /* storage unavailable */ }
}

/** Opens the folder picker (must run from a click). Returns null when the user cancels. */
export async function chooseExportDir(current: Dir | null): Promise<Dir | null> {
  try {
    const opts: any = { id: 'pqp-exports', mode: 'readwrite' };
    if (current) opts.startIn = current;
    const h = await (window as any).showDirectoryPicker(opts);
    try { await set(KEY, h); } catch { /* kept for this session only */ }
    return h;
  } catch (e: any) {
    if (e?.name === 'AbortError') return null;
    throw e;
  }
}

/** Confirms write access. Call it at the start of a click: the browser may ask the user once per session. */
export async function ensureWritable(h: Dir | null): Promise<boolean> {
  if (!h) return false;
  try {
    if (typeof h.queryPermission !== 'function') return true;
    if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
    return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false;
  }
}

/** Writes the file into the folder, replacing a file of the same name. */
export async function writeToDir(h: Dir, name: string, bytes: Uint8Array): Promise<void> {
  const fh = await h.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(bytes);
  await w.close();
}
