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
  const model = await buildDoc(p, s, browserPlatform);
  const pdf = await makePdf(model);
  const r = await deliver(pdf.bytes, outputBaseName(p) + '.pdf', 'application/pdf', dir);
  return { ...r, pages: pdf.pageCount };
}
