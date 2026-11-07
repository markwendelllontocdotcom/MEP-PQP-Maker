import { get, set, del, entries } from 'idb-keyval';
import type { Project, Settings } from './model/types';

/** Local storage on this device (IndexedDB). Every call is guarded: storage can be unavailable in private windows. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

/** A PQP Maker project. The same browser database can still hold HSE plans that HSE Plan Maker 1.0.5 and
 *  earlier kept here (same web address); My PQP Plans leaves those out. */
const isPqp = (v: any) => !!v && typeof v === 'object' && typeof v.id === 'string' && Array.isArray(v.Q08off) && !(Array.isArray(v.POL) && Array.isArray(v.S01));

/** One line of My PQP Plans. */
export interface PqpInfo { id: string; name: string; code: string; docRef: string; rev: string; date: string; status: string; modified: string; created: string; blank: boolean }

export const store = {
  loadSettings: () => safe(() => get<Settings>('settings'), undefined),
  saveSettings: (s: Settings) => safe(() => set('settings', s), undefined),
  loadCurrentId: () => safe(() => get<string>('current'), undefined),
  loadProject: (id: string) => safe(() => get<Project>('proj:' + id), undefined),
  async saveProject(p: Project) {
    await safe(() => set('proj:' + p.id, p), undefined);
    await safe(() => set('current', p.id), undefined);
  },
  async snapshot(p: Project) {
    const key = 'snaps:' + p.id;
    const list = (await safe(() => get<{ t: string; p: Project }[]>(key), undefined)) || [];
    list.push({ t: new Date().toISOString(), p });
    while (list.length > 20) list.shift();
    await safe(() => set(key, list), undefined);
  },
  snapshots: (id: string) => safe(() => get<{ t: string; p: Project }[]>('snaps:' + id), undefined),
  async recent(): Promise<{ id: string; name: string; modified: string }[]> {
    return (await safe(() => get<{ id: string; name: string; modified: string }[]>('recent'), undefined)) || [];
  },
  async touchRecent(p: Project) {
    const r = (await this.recent()).filter((x) => x.id !== p.id);
    r.unshift({ id: p.id, name: p.P01 || 'Untitled project', modified: p.modified });
    await safe(() => set('recent', r.slice(0, 12)), undefined);
  },
  async persist() {
    try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* ignore */ }
  },
  /** Saves a project without making it the open one (duplicates). */
  putProject: (p: Project) => safe(() => set('proj:' + p.id, p), undefined),
  /** Every PQP kept in this browser, newest first (raw records; the caller turns them into list lines). */
  async allProjects(): Promise<any[]> {
    const all = await safe(() => entries<IDBValidKey, any>(), [] as [IDBValidKey, any][]);
    return all.filter(([k, v]) => typeof k === 'string' && k.startsWith('proj:') && isPqp(v)).map(([, v]) => v)
      .sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || '')));
  },
  /** Removes a project, its snapshots and its place in the recent list from this browser. */
  async removeProject(id: string) {
    await safe(() => del('proj:' + id), undefined);
    await safe(() => del('snaps:' + id), undefined);
    const r = (await this.recent()).filter((x) => x.id !== id);
    await safe(() => set('recent', r), undefined);
  },
};
