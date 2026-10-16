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

/** [Prefix]-P[XXX]-QM-PQP-001, e.g. OPEM-P122-QM-PQP-001 (format set 16 Oct 2026; was [Prefix]-[YY]-[XXX]-PL-QM-001). */
export const DOC_REF_FORMAT = '[Prefix]-P[XXX]-QM-PQP-001';
export function docRef(p: Project): string {
  const pxxx = /^\d{3}$/.test(p.P02) ? 'P' + p.P02 : '[PXXX]';
  return `${(p.D01 || '[PREFIX]').trim()}-${pxxx}-QM-PQP-001`;
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

/** e.g. "OPEM-P101-QM-PQP-001 Rev 00 - PQP - Sample Residential Tower (G+20)" */
export function outputBaseName(p: Project): string {
  const rev = /^\d{2}$/.test(p.D03) ? p.D03 : '00';
  return safeFileName(`${docRef(p)} Rev ${rev} - PQP - ${p.P01 || 'Untitled'}`);
}
