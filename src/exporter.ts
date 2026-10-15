import type { Project, Settings } from './model/types';
import { buildDoc } from './content/build';
import { makeDocx } from './gen/docx';
import { makePdf } from './gen/pdf';
import { browserPlatform } from './platform-browser';
import { outputBaseName } from './model/format';
import { download } from './files';

export async function exportWord(p: Project, s: Settings): Promise<string> {
  const model = await buildDoc(p, s, browserPlatform);
  const pdf = await makePdf(model); // page numbers for the pre-filled table of contents
  model.tocPages = pdf.pages;
  const bytes = await makeDocx(model);
  const name = outputBaseName(p) + '.docx';
  download(bytes, name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  return name;
}

export async function exportPdf(p: Project, s: Settings): Promise<{ name: string; pages: number }> {
  const model = await buildDoc(p, s, browserPlatform);
  const pdf = await makePdf(model);
  const name = outputBaseName(p) + '.pdf';
  download(pdf.bytes, name, 'application/pdf');
  return { name, pages: pdf.pageCount };
}
