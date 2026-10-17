import type { Project, Settings } from './model/types';
import { buildDoc } from './content/build';
import { makeDocx } from './gen/docx';
import { makePdf } from './gen/pdf';
import { browserPlatform } from './platform-browser';
import { outputBaseName } from './model/format';
import { download } from './files';
import { writeToDir } from './exportdir';

export interface Saved { name: string; folder: string | null; pages?: number; note?: string }

/** Writes into the export folder when one is set and writable; otherwise downloads. */
async function deliver(bytes: Uint8Array, name: string, mime: string, dir: any | null): Promise<Saved> {
  if (dir) {
    try {
      await writeToDir(dir, name, bytes);
      return { name, folder: dir.name };
    } catch (e: any) {
      download(bytes, name, mime);
      const busy = e?.name === 'NoModificationAllowedError' || e?.name === 'InvalidStateError';
      return { name, folder: null, note: busy ? `The file is open in another program, so it was downloaded instead.` : `The export folder could not be written, so the file was downloaded instead.` };
    }
  }
  download(bytes, name, mime);
  return { name, folder: null };
}

export async function exportWord(p: Project, s: Settings, dir: any | null = null): Promise<Saved> {
  const model = await buildDoc(p, s, browserPlatform);
  const pdf = await makePdf(model); // page numbers for the pre-filled table of contents
  model.tocPages = pdf.pages;
  const bytes = await makeDocx(model);
  return deliver(bytes, outputBaseName(p) + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', dir);
}

export async function exportPdf(p: Project, s: Settings, dir: any | null = null): Promise<Saved> {
  const pdf = await pdfFor(p, s); // the same PDF the Review page shows, built once per change
  const r = await deliver(pdf.bytes, outputBaseName(p) + '.pdf', 'application/pdf', dir);
  return { ...r, pages: pdf.pages };
}

/** The PDF of the current project, kept until the project changes (Review preview, Print, Export PDF). */
export interface PdfEntry { key: string; bytes: Uint8Array; pages: number; url: string; built: Date }
let last: PdfEntry | null = null;
const keyOf = (p: Project) => `${p.id}|${p.modified}`;

export function cachedPdf(p: Project): PdfEntry | null {
  return last && last.key === keyOf(p) ? last : null;
}

export async function pdfFor(p: Project, s: Settings): Promise<PdfEntry> {
  const hit = cachedPdf(p);
  if (hit) return hit;
  const key = keyOf(p);
  const pdf = await makePdf(await buildDoc(p, s, browserPlatform));
  if (last) { const old = last.url; setTimeout(() => URL.revokeObjectURL(old), 60000); } // an open preview or print may still use it
  last = { key, bytes: pdf.bytes, pages: pdf.pageCount, url: URL.createObjectURL(new Blob([pdf.bytes], { type: 'application/pdf' })), built: new Date() };
  return last;
}
