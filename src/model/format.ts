import type { Project } from './types';

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** ISO yyyy-mm-dd -> DD.MM.YYYY (empty when not a valid date) */
export function dmy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

export function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}

/** Contract duration in days = Completion - Commencement (as in the fields sheet). */
export function durationDays(p: Project): number | null {
  const a = parseISO(p.P10), b = parseISO(p.P11);
  if (!a || !b || b <= a) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Project Code & Project Number (P02): letters, digits and single hyphens, e.g. DXB-243 or P122 (17 Oct 2026; was 3 digits printed as P###). */
export const PROJECT_CODE = /^[A-Z0-9]+(-[A-Z0-9]+)*$/i;
export const PROJECT_CODE_MAX = 20;
/** The project code as printed (upper case), or '' when it is empty or not allowed. */
export function projectCode(p: Project): string {
  const s = String(p.P02 || '').trim();
  return s.length <= PROJECT_CODE_MAX && PROJECT_CODE.test(s) ? s.toUpperCase() : '';
}

/** [Prefix]-[Project Code & Number]-QM-PQP-001, e.g. OPEM-DXB-243-QM-PQP-001 (17 Oct 2026; before: OPEM-P122-QM-PQP-001, OPEM-E-26-122-PL-QM-001). */
export const DOC_REF_FORMAT = '[Prefix]-[Project Code & Number]-QM-PQP-001';
export function docRef(p: Project): string {
  return `${(p.D01 || '[PREFIX]').trim()}-${projectCode(p) || '[XXX]'}-QM-PQP-001`;
}

export function revLabel(p: Project): string {
  return 'Rev.' + (/^\d{2}$/.test(p.D03) ? p.D03 : '00');
}

export function joinAnd(items: string[]): string {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a.join('');
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}

export function safeFileName(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 150);
}

/** Project file name, e.g. "DXB-101 - Sample Residential Tower (G+20) - Rev 00.pqp" (project number, name, revision). */
export function projectFileName(p: Project): string {
  const rev = /^\d{2}$/.test(p.D03) ? p.D03 : '00';
  const no = projectCode(p) || String(p.P02 || '').trim();
  return safeFileName([no, (p.P01 || '').trim() || 'Untitled project', `Rev ${rev}`].filter(Boolean).join(' - ')) + '.pqp';
}

/** e.g. "OPEM-DXB-101-QM-PQP-001 Rev 00 - PQP - Sample Residential Tower (G+20)" */
export function outputBaseName(p: Project): string {
  const rev = /^\d{2}$/.test(p.D03) ? p.D03 : '00';
  return safeFileName(`${docRef(p)} Rev ${rev} - PQP - ${p.P01 || 'Untitled'}`);
}
