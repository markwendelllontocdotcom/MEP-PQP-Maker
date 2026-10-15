import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import type { Platform, ImgAsset } from '../src/gen/model';
import { imageInfo } from '../src/gen/imgsize';
import { base64ToBytes } from '../src/content/svgs';
import vfs from '../src/fonts/vfs.json';

const root = new URL('..', import.meta.url).pathname;
const file = (n: string): ImgAsset => {
  const bytes = new Uint8Array(readFileSync(root + 'src/assets/' + n));
  return { bytes, ...imageInfo(bytes) };
};
export const nodePlatform: Platform = {
  async asset(name) {
    return name === 'banner' ? file('banner-default.jpg') : name === 'logo' ? file('logo-default.png') : file('watermark-default.jpg');
  },
  async svgToPng(svg, w) {
    const r = new Resvg(svg, {
      fitTo: { mode: 'width', value: w },
      font: { fontFiles: ['/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf', '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'], loadSystemFonts: false, defaultFontFamily: 'Carlito' },
    });
    const png = r.render().asPng();
    const bytes = new Uint8Array(png);
    return { bytes, ...imageInfo(bytes) };
  },
  async cert(std) {
    const f: Record<string, string> = { 'ISO 9001:2015': 'certs/iso-9001.jpg', 'ISO 14001:2015': 'certs/iso-14001.jpg', 'ISO 45001:2018': 'certs/iso-45001.jpg' };
    return f[std] ? file(f[std]) : null;
  },
  async dataUrlToAsset(dataUrl) {
    const bytes = base64ToBytes(dataUrl.split(',')[1]);
    return { bytes, ...imageInfo(bytes) };
  },
  async fontCss() {
    const v: any = vfs;
    return `@font-face{font-family:'Carlito';font-weight:400;src:url(data:font/ttf;base64,${v['Carlito-Regular.ttf']}) format('truetype');}@font-face{font-family:'Carlito';font-weight:700;src:url(data:font/ttf;base64,${v['Carlito-Bold.ttf']}) format('truetype');}`;
  },
};
