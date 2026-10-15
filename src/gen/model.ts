/** Resolved document model shared by the Word and PDF writers. Sizes in twips unless noted. */
export type Run = { x: string; b?: 1; i?: 1; u?: 1; sz?: number; c?: string };
export interface Tab { v: string; p: number; ld?: string }
export interface CellPara { r: Run[]; jc?: string; li?: string }
export interface Cell { p: CellPara[]; fill?: string; span?: number; vm?: string; va?: string; color?: string; bold?: boolean }
export interface Row { c: Cell[]; header?: boolean; minH?: number }

export type Block =
  | { t: 'h'; lvl: 1 | 2; num: string; x: string; id: string }
  | { t: 'n'; d: number; num: string; r: Run[]; title?: boolean; jc?: string; sz: number }
  | { t: 'p'; r: Run[]; l: number; h?: number; f?: number; jc?: string; tabs?: Tab[]; sz: number; keep?: boolean; before?: number; after?: number; pbBefore?: boolean }
  | { t: 'li'; k: string; label: string; num: string; il: string; l: number; h: number; r: Run[]; sz: number; jc?: string }
  | { t: 'tbl'; grid: number[]; rows: Row[]; jc?: string; ind?: number; sz?: number }
  | { t: 'img'; key: string; w: number; h: number; jc?: string }
  | { t: 'pb' };

export interface ImgAsset { bytes: Uint8Array; type: 'png' | 'jpeg'; w: number; h: number }

export interface CoverModel {
  docRefLine: string;
  revLine: string;
  title: string;
  photo: string | null; // image key
  logos: string[];      // client / consultant logo keys
  parties: [string, string][];
  statement: string;
  status: string;
  signatures: { role: string; name: string; desig: string }[];
}

export interface DocModel {
  docRef: string;
  rev: string;
  footerLeft: string;
  title: string;
  cover: CoverModel;
  banner: string;          // image key, full page width
  watermark: string | null;
  blocks: Block[];
  images: Record<string, ImgAsset>;
  tocPages?: Record<string, number>; // heading id -> page (filled from the PDF layout)
  meta: { project: string; company: string; created: string };
}

/** Platform services (browser or Node) used while building. */
export interface Platform {
  asset(name: 'banner' | 'logo' | 'watermark'): Promise<ImgAsset>;
  svgToPng(svg: string, w: number, h: number): Promise<ImgAsset>;
  dataUrlToAsset(dataUrl: string): Promise<ImgAsset>;
  fontCss(): Promise<string>; // @font-face rules (Carlito regular + bold) for SVG text
  cert(std: string): Promise<ImgAsset | null>; // built-in ISO certificate scan, if any
}

export const PAGE = { w: 11906, h: 16838, top: 1728, bottom: 1134, left: 1440, right: 994, header: 0, footer: 425 };
export const CONTENT_W = PAGE.w - PAGE.left - PAGE.right; // 9472 twips
export const NAVY = '002060';
/** Cover photo box (user, 15 Oct 2026): cell 16.5 cm wide x exactly 11.6 cm high, centred; photo stretched to 16 x 11 cm. */
export const CM = 1440 / 2.54; // twips per cm
export const COVER_BOX = { w: Math.round(16.5 * CM), h: Math.round(11.6 * CM), photoW: Math.round(16 * CM), photoH: Math.round(11 * CM) };
