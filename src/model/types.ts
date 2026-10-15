export interface ImageData {
  name: string;
  type: string; // image/png | image/jpeg
  dataUrl: string;
  w?: number;
  h?: number;
}

export interface Person {
  name: string;
  email: string;
  phone: string;
}

export interface ExtraPerson extends Person {
  role: string;
}

export interface RevRow {
  rev: string;
  date: string; // ISO yyyy-mm-dd
  desc: string;
}

export interface CertRow {
  std: string;       // e.g. ISO 9001:2015 (matches the QMS / ISMS Standards options)
  no: string;        // certificate number
  body: string;      // certifying body
  expiry: string;    // ISO yyyy-mm-dd
  image: ImageData | null; // null = the certificate scan built into the app (when there is one)
}

export interface FormRow {
  code: string;
  title: string;
}

export interface Project {
  id: string;
  created: string;
  modified: string;
  appVersion: string;
  // 1. Project Information
  P01: string; P02: string; P03: string; P04: string; P05: string; P06: string[];
  P07: string; P08: string[]; P09: string; P10: string; P11: string; P13: string;
  // 2. Project Parties
  R01: string; R02: string; R03: string; R04: string; R05: string;
  R06: string[]; R06other: string;
  R07: ImageData | null; R08: ImageData | null; R10: ImageData | null;
  // Branding (per project, from Settings)
  R09: ImageData | null; // null = default logo
  R11: string;
  R12on: boolean;
  R12: ImageData | null; // null = default watermark
  D01: string;
  // 3. Document Control
  D03: string; D04: string; D05: string;
  D06: string; D07: string; D08: string; D09: string; D10: string; D11: string;
  // 4. Key Personnel, laid out as the QA/QC Department Organization Chart (Annexure 8.1)
  K02: Person;          // QA/QC Manager
  K03: Person[];        // QA/QC Engineers: one chart box per row (1–3)
  K05: Person;          // Document Controller
  K07: Person;          // Projects Director
  K01: Person;          // Project Manager
  K08: ExtraPerson[];   // Construction Managers & Senior Engineers
  K09: ExtraPerson[];   // Project Engineers
  K06: ExtraPerson[];   // Other personnel: contact table only, not drawn
  K04?: Person;         // HSE Manager (before 15 Oct 2026); moved into K06 when a file is opened
  // 5. Quality System
  Q01: string[];
  CERTS: CertRow[];
  Q02?: string; Q03?: string; // replaced by CERTS (15 Oct 2026); kept so older project files still open
  Q04: string; Q05: string; Q06: string; // kept as typed text, validated as whole numbers
  Q07: string[]; Q07other: string;
  Q08off: string[]; // section ids switched off
  // 6. Revision History (Amendment Record)
  H01: RevRow[];
  // 7. Annexures
  A01: ImageData[]; A02: FormRow[]; A03: ImageData[]; A03text: string;
}

export interface Settings {
  companyName: string;
  companyShort: string;
  logo: ImageData | null;
  tagline: string;
  watermark: ImageData | null;
  watermarkOpacity: number;
  docRefPrefix: string;
  brandColor: string;
  font: string;
}
