import type { Platform, ImgAsset } from './gen/model';
import { imageInfo } from './gen/imgsize';
import { base64ToBytes } from './content/svgs';
import vfs from './fonts/vfs.json';
import bannerUrl from './assets/banner-default.jpg?inline';
import logoUrl from './assets/logo-default.png?inline';
import watermarkUrl from './assets/watermark-default.jpg?inline';
import cert9001 from './assets/certs/iso-9001.jpg?inline';
import cert14001 from './assets/certs/iso-14001.jpg?inline';
import cert45001 from './assets/certs/iso-45001.jpg?inline';

export const ASSET_URLS = { banner: bannerUrl, logo: logoUrl, watermark: watermarkUrl };
/** Oxypro ISO certificate scans built into the app */
export const CERT_URLS: Record<string, string> = { 'ISO 9001:2015': cert9001, 'ISO 14001:2015': cert14001, 'ISO 45001:2018': cert45001 };

function fromDataUrl(dataUrl: string): ImgAsset {
  const bytes = base64ToBytes(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return { bytes, ...imageInfo(bytes) };
}

let css = '';
export const browserPlatform: Platform = {
  async asset(name) {
    return fromDataUrl(ASSET_URLS[name]);
  },
  async dataUrlToAsset(dataUrl) {
    return fromDataUrl(dataUrl);
  },
  async cert(std) {
    return CERT_URLS[std] ? fromDataUrl(CERT_URLS[std]) : null;
  },
  async fontCss() {
    if (!css) {
      const v: any = vfs;
      css = `@font-face{font-family:'Carlito';font-weight:400;src:url(data:font/ttf;base64,${v['Carlito-Regular.ttf']}) format('truetype');}@font-face{font-family:'Carlito';font-weight:700;src:url(data:font/ttf;base64,${v['Carlito-Bold.ttf']}) format('truetype');}`;
    }
    return css;
  },
  async svgToPng(svg, w, h) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    // give embedded fonts a moment to apply inside the SVG image
    await new Promise((r) => setTimeout(r, 30));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not draw image'))), 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { bytes, type: 'png', w, h };
  },
};

/** Reads an uploaded image, converts HEIC/WebP etc. to JPEG and downsizes very large photos. */
export async function readImageFile(file: File, maxMB: number): Promise<{ name: string; type: string; dataUrl: string; w: number; h: number }> {
  if (file.size > maxMB * 1024 * 1024) throw new Error(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${maxMB} MB.`);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { throw new Error(`${file.name} is not an image this device can read. Use PNG or JPG.`); }
    const max = 2400;
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const keepPng = file.type === 'image/png';
    if (k === 1 && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const dataUrl: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
      return { name: file.name, type: file.type, dataUrl, w: img.naturalWidth, h: img.naturalHeight };
    }
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    if (!keepPng) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(img, 0, 0, w, h);
    const type = keepPng ? 'image/png' : 'image/jpeg';
    return { name: file.name, type, dataUrl: c.toDataURL(type, 0.88), w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
