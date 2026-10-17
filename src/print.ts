// Print: Edge, Chrome and Firefox open their print dialog for the PDF straight from the app (web and
// installed app). The double-click copy (file://), Safari and iPhone / iPad cannot print a PDF from inside
// the page, so there the PDF opens in a new tab to print from (Ctrl+P, or Share > Print on iPhone).

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const isIOS = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isSafari = /^((?!chrome|chromium|crios|fxios|android|edg).)*safari/i.test(ua);
export const directPrint = !isIOS && !isSafari && typeof location !== 'undefined' && location.protocol !== 'file:';

let frame: HTMLIFrameElement | null = null;

/** Opens the print dialog for the PDF at url (a blob: URL). False = not possible here: open it in a tab instead. */
export async function printPdf(url: string): Promise<boolean> {
  const hook = (window as any).__pqpPrintHook; // tests replace the dialog
  if (hook) return hook(url);
  if (!directPrint) return false;
  try {
    frame?.remove();
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f.title = 'Print';
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    const loaded = new Promise<void>((res, rej) => { f.onload = () => res(); setTimeout(() => rej(new Error('timeout')), 20000); });
    f.src = url;
    document.body.appendChild(f);
    frame = f;
    await loaded;
    await new Promise((r) => setTimeout(r, 300));
    f.contentWindow!.focus();
    f.contentWindow!.print();
    return true;
  } catch {
    return false;
  }
}

/** Opens the PDF in a new tab (call from a click). False when the browser blocked it. */
export function openPdfTab(url: string): boolean {
  return !!window.open(url, '_blank');
}
