import type { ImgAsset, Platform } from '../gen/model';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  if (i < bytes.length) {
    const n = (bytes[i] << 16) | ((i + 1 < bytes.length ? bytes[i + 1] : 0) << 8);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + '=';
  }
  return out;
}
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) | ((B64.indexOf(clean[i + 2]) & 63) << 6) | (B64.indexOf(clean[i + 3]) & 63);
    if (o < len) out[o++] = (n >> 16) & 255;
    if (o < len) out[o++] = (n >> 8) & 255;
    if (o < len) out[o++] = n & 255;
  }
  return out;
}
export function assetDataUrl(a: ImgAsset): string {
  return `data:image/${a.type};base64,${bytesToBase64(a.bytes)}`;
}
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Header banner like R1's: logo at left, red bar with the tagline running to the right edge. 1637 x 216 px. */
export async function bannerSvg(logo: ImgAsset, tagline: string, color: string, plat: Platform): Promise<string> {
  const fontCss = await plat.fontCss();
  const boxW = 655, boxH = 185;
  const k = Math.min(boxW / logo.w, boxH / logo.h);
  const lw = Math.round(logo.w * k), lh = Math.round(logo.h * k);
  const t = tagline.trim().toUpperCase();
  const fs = Math.max(16, Math.min(34, Math.floor(790 / Math.max(1, t.length * 0.56))));
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1637" height="216" viewBox="0 0 1637 216">
<style>${fontCss}</style>
<rect width="1637" height="216" fill="#ffffff"/>
<image x="${50}" y="${11 + Math.round((boxH - lh) / 2)}" width="${lw}" height="${lh}" xlink:href="${assetDataUrl(logo)}" href="${assetDataUrl(logo)}"/>
${t ? `<rect x="807" y="90" width="830" height="49" fill="${esc(color)}"/>
<text x="823" y="${114 + Math.round(fs * 0.36)}" font-family="Carlito" font-weight="700" font-size="${fs}" fill="#ffffff" letter-spacing="0.5">${esc(t)}</text>` : ''}
</svg>`;
}

/** Faint copy of an image for the page watermark (blended toward white). */
export function fadeSvg(src: ImgAsset, opacity: number): { svg: string; w: number; h: number } {
  const max = 1600;
  const k = Math.min(1, max / Math.max(src.w, src.h));
  const w = Math.round(src.w * k), h = Math.round(src.h * k);
  return {
    w, h,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#ffffff"/>
<image x="0" y="0" width="${w}" height="${h}" opacity="${opacity}" xlink:href="${assetDataUrl(src)}" href="${assetDataUrl(src)}"/>
</svg>`,
  };
}
