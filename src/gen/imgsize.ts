/** Reads pixel size and type from PNG / JPEG bytes. */
export function imageInfo(b: Uint8Array): { type: 'png' | 'jpeg'; w: number; h: number } {
  if (b[0] === 0x89 && b[1] === 0x50) {
    const w = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
    const h = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23];
    return { type: 'png', w, h };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = (b[i + 2] << 8) | b[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = (b[i + 5] << 8) | b[i + 6];
        const w = (b[i + 7] << 8) | b[i + 8];
        return { type: 'jpeg', w, h };
      }
      i += 2 + len;
    }
    return { type: 'jpeg', w: 1, h: 1 };
  }
  throw new Error('Unsupported image (use PNG or JPEG)');
}
