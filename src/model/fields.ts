import type { Project } from './types';
import { EMIRATES, PROJECT_TYPES, DISCIPLINES, CONTRACT_TYPES, ROLES, AUTHORITIES, STANDARDS, CODES, STATUSES } from './defaults';
import { parseISO } from './format';

export type FieldType =
  | 'text' | 'longtext' | 'number' | 'date' | 'dropdown' | 'multi' | 'image' | 'images'
  | 'person' | 'people' | 'revisions' | 'forms' | 'calc' | 'toggle' | 'sections';

export interface FieldSpec {
  id: keyof Project | string;
  group: string;
  label: string;
  type: FieldType;
  mandatory: boolean;
  options?: string[];
  max?: number; // characters
  min?: number; // numbers
  maxN?: number;
  digits?: number; // exact digit count
  maxMB?: number;
  help?: string;
  usedIn?: string;
  otherKey?: keyof Project;
}

export const GROUPS = [
  { id: 'project', title: '1. Project Information' },
  { id: 'parties', title: '2. Project Parties' },
  { id: 'branding', title: 'Branding' },
  { id: 'doc', title: '3. Document Control' },
  { id: 'people', title: '4. Key Personnel' },
  { id: 'quality', title: '5. Quality System' },
  { id: 'revisions', title: '6. Revision History' },
  { id: 'annex', title: '7. Annexures' },
  { id: 'sections', title: 'PQP Sections' },
];

export const FIELDS: FieldSpec[] = [
  { id: 'P01', group: 'project', label: 'Project Name', type: 'text', mandatory: true, max: 150, help: 'Full official project name', usedIn: 'Cover, 2 Scope of Works' },
  { id: 'P02', group: 'project', label: 'Project Number (XXX)', type: 'text', mandatory: true, digits: 3, help: '3 digits, company job number (e.g. 060)', usedIn: 'Doc Ref' },
  { id: 'P03', group: 'project', label: 'Project Year (YY)', type: 'text', mandatory: true, digits: 2, help: '2 digits, e.g. 26', usedIn: 'Doc Ref' },
  { id: 'P04', group: 'project', label: 'Location / Emirate', type: 'dropdown', mandatory: true, options: EMIRATES, usedIn: 'Cover' },
  { id: 'P05', group: 'project', label: 'Plot No. / Address', type: 'text', mandatory: false, help: 'Plot number and community / area', usedIn: 'Cover' },
  { id: 'P06', group: 'project', label: 'Project Type', type: 'dropdown', mandatory: true, options: PROJECT_TYPES, usedIn: 'Project Information table' },
  { id: 'P07', group: 'project', label: 'Scope of Work (summary)', type: 'longtext', mandatory: true, max: 2000, help: 'Summary of the works covered by this PQP. It follows R1’s standard scope paragraph in Section 2.', usedIn: '2 Scope of Works' },
  { id: 'P08', group: 'project', label: 'Disciplines', type: 'multi', mandatory: true, options: DISCIPLINES, help: 'Drives the discipline list, the org chart and Annexure 8.5', usedIn: '2 Scope, Annexures 8.1 and 8.5' },
  { id: 'P09', group: 'project', label: 'Contract Type', type: 'dropdown', mandatory: false, options: CONTRACT_TYPES, usedIn: 'Project Information table' },
  { id: 'P10', group: 'project', label: 'Commencement Date', type: 'date', mandatory: true, usedIn: 'Project Information table' },
  { id: 'P11', group: 'project', label: 'Completion Date', type: 'date', mandatory: true, help: 'Must be after the Commencement Date', usedIn: 'Project Information table' },
  { id: 'P12', group: 'project', label: 'Contract Duration (days)', type: 'calc', mandatory: false, help: 'Completion Date minus Commencement Date', usedIn: 'Project Information table' },
  { id: 'P13', group: 'project', label: 'Building Configuration / Description', type: 'longtext', mandatory: false, max: 500, help: 'e.g. B+G+20+R, built-up area', usedIn: 'Project Information table' },

  { id: 'R01', group: 'parties', label: 'Client / Employer', type: 'text', mandatory: true, help: 'Enter the name without "M/s." (the cover adds it)', usedIn: 'Cover, 2 Scope' },
  { id: 'R02', group: 'parties', label: 'Consultant / Engineer', type: 'text', mandatory: true, usedIn: 'Cover' },
  { id: 'R03', group: 'parties', label: 'Main Contractor', type: 'text', mandatory: true, usedIn: 'Cover' },
  { id: 'R04', group: 'parties', label: 'MEP Contractor', type: 'text', mandatory: true, help: 'Default from Settings', usedIn: 'Cover' },
  { id: 'R05', group: 'parties', label: 'Our Role', type: 'dropdown', mandatory: true, options: ROLES, usedIn: 'Project Information table' },
  { id: 'R06', group: 'parties', label: 'Approving Authorities', type: 'multi', mandatory: true, options: AUTHORITIES, otherKey: 'R06other', usedIn: '5.18 table, 5.21 Authority Requirements' },
  { id: 'R07', group: 'parties', label: 'Client Logo', type: 'image', mandatory: false, maxMB: 2, usedIn: 'Cover (only when uploaded)' },
  { id: 'R08', group: 'parties', label: 'Consultant Logo', type: 'image', mandatory: false, maxMB: 2, usedIn: 'Cover (only when uploaded)' },
  { id: 'R10', group: 'parties', label: 'Cover Photo', type: 'image', mandatory: false, maxMB: 5, help: 'Landscape photo or rendering. Empty shows the "Project Cover Photo Here" box', usedIn: 'Cover' },

  { id: 'R09', group: 'branding', label: 'Company Logo', type: 'image', mandatory: false, maxMB: 2, help: 'Empty uses the Oxypro logo from Settings', usedIn: 'Header' },
  { id: 'R11', group: 'branding', label: 'Header Tagline', type: 'text', mandatory: false, max: 60, usedIn: 'Header' },
  { id: 'R12on', group: 'branding', label: 'Show page watermark', type: 'toggle', mandatory: false, usedIn: 'Every page' },
  { id: 'R12', group: 'branding', label: 'Page Watermark', type: 'image', mandatory: false, maxMB: 2, help: 'Empty uses the faint Oxypro mark. An uploaded image is faded automatically', usedIn: 'Every page' },
  { id: 'D01', group: 'branding', label: 'Doc Ref Prefix', type: 'text', mandatory: true, max: 20, usedIn: 'Doc Ref' },

  { id: 'D02', group: 'doc', label: 'Document Reference', type: 'calc', mandatory: false, usedIn: 'Cover, footer, 7 Amendment Record' },
  { id: 'D03', group: 'doc', label: 'Revision', type: 'text', mandatory: true, digits: 2, help: '2 digits, shown as Rev.00', usedIn: 'Cover, footer' },
  { id: 'D04', group: 'doc', label: 'Issue Date', type: 'date', mandatory: true, usedIn: 'Cover' },
  { id: 'D05', group: 'doc', label: 'Document Status', type: 'dropdown', mandatory: true, options: STATUSES, usedIn: 'Cover signature block' },
  { id: 'D06', group: 'doc', label: 'Prepared By – Name', type: 'text', mandatory: true, usedIn: 'Cover signature block' },
  { id: 'D07', group: 'doc', label: 'Prepared By – Designation', type: 'text', mandatory: true },
  { id: 'D08', group: 'doc', label: 'Reviewed By – Name', type: 'text', mandatory: true },
  { id: 'D09', group: 'doc', label: 'Reviewed By – Designation', type: 'text', mandatory: true },
  { id: 'D10', group: 'doc', label: 'Approved By – Name', type: 'text', mandatory: true },
  { id: 'D11', group: 'doc', label: 'Approved By – Designation', type: 'text', mandatory: true },

  { id: 'K01', group: 'people', label: 'Project Manager', type: 'person', mandatory: true, usedIn: 'Annexure 8.1' },
  { id: 'K02', group: 'people', label: 'QA/QC Manager', type: 'person', mandatory: true, usedIn: 'Annexure 8.1' },
  { id: 'K03', group: 'people', label: 'QA/QC Engineer', type: 'person', mandatory: false, usedIn: 'Annexure 8.1' },
  { id: 'K04', group: 'people', label: 'HSE Manager / Officer', type: 'person', mandatory: false, usedIn: 'Annexure 8.1' },
  { id: 'K05', group: 'people', label: 'Document Controller', type: 'person', mandatory: false, usedIn: 'Annexure 8.1' },
  { id: 'K06', group: 'people', label: 'Additional Personnel', type: 'people', mandatory: false, help: 'One row per person. Discipline engineers appear as boxes in the org chart', usedIn: 'Annexure 8.1' },

  { id: 'Q01', group: 'quality', label: 'QMS / ISMS Standards', type: 'multi', mandatory: true, options: STANDARDS, usedIn: '1.1 Introduction, 5.18 table' },
  { id: 'Q02', group: 'quality', label: 'ISO Certificate No.', type: 'text', mandatory: false, usedIn: 'Annexure 8.2' },
  { id: 'Q03', group: 'quality', label: 'Certifying Body', type: 'text', mandatory: false, usedIn: 'Annexure 8.2' },
  { id: 'Q04', group: 'quality', label: 'Inspection Notice Period (hours)', type: 'number', mandatory: true, min: 1, maxN: 72, usedIn: '5.10 Work Inspections' },
  { id: 'Q05', group: 'quality', label: 'Submittal Review Period (days)', type: 'number', mandatory: true, min: 1, maxN: 60, usedIn: '5.5 Procurement' },
  { id: 'Q06', group: 'quality', label: 'NCR Close-out Target (working days)', type: 'number', mandatory: false, min: 1, maxN: 60, usedIn: '5.11 NCR' },
  { id: 'Q07', group: 'quality', label: 'Applicable Codes & Standards', type: 'multi', mandatory: true, options: CODES, otherKey: 'Q07other', usedIn: '5.18 table' },

  { id: 'H01', group: 'revisions', label: 'Amendment Record', type: 'revisions', mandatory: true, usedIn: '7 Amendment Record' },

  { id: 'A01', group: 'annex', label: 'ISO Certificates (scans)', type: 'images', mandatory: false, maxMB: 5, help: 'JPG / PNG or PDF (each PDF page becomes an image)', usedIn: 'Annexure 8.2' },
  { id: 'A02', group: 'annex', label: 'Applicable Forms and Templates', type: 'forms', mandatory: false, usedIn: 'Annexure 8.3' },
  { id: 'A03', group: 'annex', label: 'Quality Policy & Quality Objectives (scans)', type: 'images', mandatory: false, maxMB: 5, usedIn: 'Annexure 8.4' },
  { id: 'A03text', group: 'annex', label: 'Quality Policy & Quality Objectives (text, used when no scan)', type: 'longtext', mandatory: false, max: 4000, usedIn: 'Annexure 8.4' },

  { id: 'Q08off', group: 'sections', label: 'PQP Sections to Include', type: 'sections', mandatory: true },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message for an entry that is not allowed (format / range), or null. */
export function fieldError(f: FieldSpec, p: Project): string | null {
  const v: any = (p as any)[f.id];
  if (f.type === 'text' || f.type === 'longtext') {
    const s = String(v ?? '');
    if (f.max && s.length > f.max) return `Maximum ${f.max} characters (now ${s.length}).`;
    if (f.digits && s !== '' && !new RegExp(`^\\d{${f.digits}}$`).test(s)) return `Enter exactly ${f.digits} digits${f.id === 'P02' ? ', e.g. 060' : ''}.`;
  }
  if (f.type === 'number') {
    const s = String(v ?? '').trim();
    if (s === '') return null;
    if (!/^\d+$/.test(s)) return 'Enter a whole number.';
    const n = +s;
    if (f.min != null && n < f.min) return `Enter a number from ${f.min} to ${f.maxN}.`;
    if (f.maxN != null && n > f.maxN) return `Enter a number from ${f.min} to ${f.maxN}.`;
  }
  if (f.type === 'date') {
    if (v && !parseISO(v)) return 'Enter a valid date.';
    if (f.id === 'P11' && v && p.P10 && parseISO(v) && parseISO(p.P10) && parseISO(v)! <= parseISO(p.P10)!) return 'Completion Date must be after the Commencement Date.';
  }
  if (f.type === 'person') {
    const e = (v?.email || '').trim();
    if (e && !EMAIL.test(e)) return 'Check the email address.';
  }
  if (f.type === 'people') {
    const bad = (v || []).findIndex((r: any) => r.email && !EMAIL.test(r.email.trim()));
    if (bad >= 0) return `Row ${bad + 1}: check the email address.`;
  }
  if (f.type === 'revisions') {
    const bad = (v || []).findIndex((r: any) => !/^\d{2}$/.test(r.rev) || (r.date && !parseISO(r.date)));
    if (bad >= 0) return `Row ${bad + 1}: Rev must be 2 digits and the date valid.`;
  }
  return null;
}

export function isEmpty(f: FieldSpec, p: Project): boolean {
  const v: any = (p as any)[f.id];
  if (f.type === 'person') return !v?.name?.trim();
  if (Array.isArray(v)) return v.length === 0;
  return v == null || String(v).trim() === '';
}

export function allErrors(p: Project): { f: FieldSpec; msg: string }[] {
  const out: { f: FieldSpec; msg: string }[] = [];
  for (const f of FIELDS) {
    const m = fieldError(f, p);
    if (m) out.push({ f, msg: m });
  }
  return out;
}

export function missingMandatory(p: Project): FieldSpec[] {
  return FIELDS.filter((f) => f.mandatory && f.type !== 'calc' && f.type !== 'sections' && isEmpty(f, p));
}
