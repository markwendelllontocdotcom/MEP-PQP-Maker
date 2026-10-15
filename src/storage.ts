import { get, set, del } from 'idb-keyval';
import type { Project, Settings } from './model/types';

/** Local storage on this device (IndexedDB). Every call is guarded: storage can be unavailable in private windows. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

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
  removeProject: (id: string) => safe(() => del('proj:' + id), undefined),
};
