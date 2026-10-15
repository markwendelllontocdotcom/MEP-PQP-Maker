import type { Project, Settings, Person } from './types';
import { APP_VERSION } from '../version';
import { todayISO } from './format';

export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
export const PROJECT_TYPES = ['Residential', 'Commercial', 'Hospitality', 'Industrial', 'Infrastructure', 'Mixed-Use', 'Healthcare', 'Education'];
export const DISCIPLINES = ['HVAC', 'Plumbing & Drainage', 'Electrical', 'Fire Fighting', 'Fire Alarm', 'ELV', 'LPG', 'Civil', 'Structural', 'Fit-out'];
export const CONTRACT_TYPES = ['Lump Sum', 'Re-measured', 'Design & Build', 'Cost Plus'];
export const ROLES = ['Main Contractor', 'MEP Subcontractor', 'Specialist Subcontractor'];
export const AUTHORITIES = ['DM', 'DEWA', 'DCD', 'Trakhees', 'Dubai South', 'DDA', 'RTA', 'Etisalat/du', 'ADM', 'ADDC', 'ADCD', 'SEWA', 'Etihad WE', 'Sharjah Civil Defence', 'Other'];
export const AUTHORITY_NAMES: Record<string, string> = {
  DM: 'Dubai Municipality (DM)',
  DEWA: 'Dubai Electricity & Water Authority (DEWA)',
  DCD: 'Dubai Civil Defence (DCD)',
  Trakhees: 'Trakhees (Ports, Customs & Free Zone Corporation)',
  'Dubai South': 'Dubai South',
  DDA: 'Dubai Development Authority (DDA)',
  RTA: 'Roads & Transport Authority (RTA)',
  'Etisalat/du': 'Etisalat (e&) / du',
  ADM: 'Abu Dhabi Municipality (ADM)',
  ADDC: 'Abu Dhabi Distribution Company (ADDC)',
  ADCD: 'Abu Dhabi Civil Defence (ADCD)',
  SEWA: 'Sharjah Electricity, Water & Gas Authority (SEWA)',
  'Etihad WE': 'Etihad Water & Electricity (Etihad WE)',
  'Sharjah Civil Defence': 'Sharjah Civil Defence',
};
export const AUTHORITY_SCOPE: Record<string, string> = {
  DM: 'Building permit related MEP approvals, drainage and plumbing approvals, inspections and completion certificate',
  DEWA: 'Electrical and water connection approvals, load approvals, inspections and energisation',
  DCD: 'Fire fighting and fire alarm design approval, inspections and completion certificate',
  Trakhees: 'Building, fire and MEP approvals and inspections within Trakhees jurisdiction',
  'Dubai South': 'Building and MEP approvals and inspections within Dubai South',
  DDA: 'Building and MEP approvals and inspections within DDA jurisdiction',
  RTA: 'NOCs and approvals for works affecting roads and right of way',
  'Etisalat/du': 'Telecom infrastructure approvals (ducts, MDF / telecom rooms) and inspections',
  ADM: 'Building permit related MEP approvals, inspections and completion certificate',
  ADDC: 'Electrical and water connection approvals, inspections and energisation',
  ADCD: 'Fire and life safety design approval, inspections and completion certificate',
  SEWA: 'Electrical, water and gas connection approvals and inspections',
  'Etihad WE': 'Electrical and water connection approvals and inspections',
  'Sharjah Civil Defence': 'Fire and life safety design approval, inspections and completion certificate',
};
export const STANDARDS = ['ISO 9001:2015', 'ISO/IEC 27001:2022', 'ISO 14001:2015', 'ISO 45001:2018'];
export const CODES = ['UAE Fire & Life Safety Code', 'DEWA Regulations', 'DM Building Code', "Al Sa'fat (Dubai Green Building System)", 'Estidama (Abu Dhabi)', 'ASHRAE', 'NFPA', 'BS 7671', 'CIBSE', 'SMACNA', 'Project Specifications', 'Other'];
export const STATUSES = ['Draft', 'For Approval', 'Approved', 'Approved as Noted', 'Revise & Resubmit'];

/** Forms and registers referred to in the R1 procedures (Annexure 8.3 starting list). */
export const R1_FORMS = [
  { code: 'OPEM-MS-Log', title: 'Material Flow Sheet / Material Submittal Register' },
  { code: 'OPEM-SD-Log', title: 'Drawing Flow Sheet' },
  { code: 'OPEM-Asbuilt-Log', title: 'As Built Drawing Flow Sheet' },
  { code: 'OPEM-WIR-Log', title: 'Work Inspection Request Register' },
  { code: 'OPEM-NCR-Log', title: 'NCR Register' },
  { code: 'OPEM-RFI-Log', title: 'RFI Register' },
  { code: 'OPEM-Variation-Log', title: 'Variation Register' },
  { code: 'OXYPRO-ED-FM-10', title: 'Change Control Register' },
  { code: 'OXYPRO-MC-FM-04', title: 'Stores Issue Voucher' },
  { code: 'OXYPRO-MC-FM-12', title: 'Equipment Register' },
  { code: 'OXYPRO-PM-FM-27', title: 'Incoming Correspondence Register' },
];

export const DEFAULT_TAGLINE = 'THE COMPLETE SOLUTION FOR BUILDING SERVICES';

export function defaultSettings(): Settings {
  return {
    companyName: 'OXYPRO ELECTROMECHANICAL WORKS LLC',
    companyShort: 'OXYPRO',
    logo: null,
    tagline: DEFAULT_TAGLINE,
    watermark: null,
    watermarkOpacity: 0.08,
    docRefPrefix: 'OPEM-E',
    brandColor: '#D72025',
    font: 'Calibri',
  };
}

const person = (name = ''): Person => ({ name, email: '', phone: '' });

export function uid(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newProject(s: Settings): Project {
  const now = new Date().toISOString();
  const today = todayISO();
  return {
    id: uid(), created: now, modified: now, appVersion: APP_VERSION,
    P01: '', P02: '', P03: today.slice(2, 4), P04: 'Dubai', P05: '', P06: '', P07: '', P08: [], P09: 'Lump Sum', P10: '', P11: '', P13: '',
    R01: '', R02: '', R03: '', R04: s.companyName, R05: 'MEP Subcontractor', R06: [], R06other: '',
    R07: null, R08: null, R10: null,
    R09: s.logo, R11: s.tagline, R12on: true, R12: s.watermark, D01: s.docRefPrefix,
    D03: '00', D04: today, D05: 'Draft',
    D06: '', D07: 'QA/QC Engineer', D08: '', D09: 'QA/QC Manager', D10: '', D11: 'Project Manager',
    K01: person(), K02: person(), K03: person(), K04: person(), K05: person(), K06: [],
    Q01: ['ISO 9001:2015', 'ISO/IEC 27001:2022'], Q02: '', Q03: '', Q04: '24', Q05: '14', Q06: '7',
    Q07: ['Project Specifications'], Q07other: '', Q08off: [],
    H01: [{ rev: '00', date: today, desc: 'Initial Issue' }],
    A01: [], A02: R1_FORMS.map((f) => ({ ...f })), A03: [], A03text: '',
  };
}

/** Column J of the "PQP Input Fields" sheet (fictitious test data). */
export function testProject(s: Settings): Project {
  const p = newProject(s);
  return {
    ...p,
    P01: 'Sample Residential Tower (G+20)', P02: '101', P03: '26', P04: 'Dubai', P05: 'Plot 000-000, Sample Area',
    P06: 'Residential', P07: 'Supply, installation, testing and commissioning of MEP works.',
    P08: ['HVAC', 'Plumbing & Drainage', 'Electrical', 'Fire Fighting'], P09: 'Lump Sum',
    P10: '2026-11-01', P11: '2027-12-31', P13: '',
    R01: 'Sample Developer LLC', R02: 'Sample Engineering Consultants', R03: 'Sample Main Contractor LLC',
    R04: s.companyName, R05: 'MEP Subcontractor', R06: ['DM', 'DEWA', 'DCD'],
    R11: s.tagline, D01: s.docRefPrefix, D03: '00', D04: '2026-10-15', D05: 'For Approval',
    D06: 'A. Sample', D07: 'QA/QC Engineer', D08: 'B. Sample', D09: 'QA/QC Manager', D10: 'C. Sample', D11: 'Project Manager',
    K01: person('C. Sample'), K02: person('B. Sample'), K03: person('A. Sample'), K04: person('D. Sample'), K05: person('E. Sample'),
    K06: [{ role: 'Site Engineer', name: 'F. Sample', email: '', phone: '' }],
    Q01: ['ISO 9001:2015', 'ISO/IEC 27001:2022'], Q02: 'QMS-0000', Q03: 'Sample Certification Body',
    Q04: '24', Q05: '14', Q06: '7',
    Q07: ['UAE Fire & Life Safety Code', 'DEWA Regulations', 'ASHRAE', 'Project Specifications'],
    H01: [{ rev: '00', date: '2026-10-15', desc: 'First issue for approval' }],
  };
}
