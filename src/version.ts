export const APP_NAME = 'PQP Maker';
export const APP_VERSION = '1.3.0';
export const APP_DATE = '16 Oct 2026';
export const WEB_URL = 'https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/';
export const CREDIT = 'Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.';

/** Version history shown on the About page (newest first). Keep README.txt in step. */
export const CHANGES: { v: string; date: string; items: string[] }[] = [
  {
    v: '1.3.0',
    date: '16 Oct 2026',
    items: ['New document reference format OPEM-[PXXX]-QM-PQP-001, for example OPEM-P122-QM-PQP-001 (was OPEM-E-26-[XXX]-PL-QM-001). It shows on the cover, in the footer, in the Amendment Record and in the file names. The project year is no longer needed. Projects saved earlier switch to the new reference when they are opened.'],
  },
  {
    v: '1.2.1',
    date: '16 Oct 2026',
    items: ['New app icon: the QA/QC engineer with the PQP clipboard. It shows in the browser tab, the installed app and the About page.'],
  },
  {
    v: '1.2.0',
    date: '16 Oct 2026',
    items: ['Published on the web. The web version can be installed as an app on Windows, macOS, iPhone and iPad.'],
  },
  {
    v: '1.1.1',
    date: '16 Oct 2026',
    items: [
      'The Project Information table lists Project, Project Number, Location, Our Role and Building Configuration. Project Type, Contract Type and Approving Authorities are no longer printed there; the approving authorities still appear in 5.18 and 5.21.',
    ],
  },
  {
    v: '1.1.0',
    date: '16 Oct 2026',
    items: [
      'Exports can be saved straight into a folder you choose, such as the project folder or Samples (Edge and Chrome).',
      'Annexure 8.1 is drawn as the QA/QC Department Organization Chart. Key Personnel follows the chart, with a live preview.',
      'Annexure 8.2 prints the ISO certificates of the standards ticked under 5. Quality System.',
      'Cover photo box 16.5 × 11.6 cm, centred, with the photo stretched to 16 × 11 cm.',
      'Project Information shows the project number as P### and one or more project types. Contract dates are no longer printed.',
      'Short tables in the PDF move to the next page whole instead of splitting.',
      'This About page.',
    ],
  },
  {
    v: '1.0.0',
    date: '15 Oct 2026',
    items: ['First release: project data entry, PQP generated from the R1 template, Word and PDF export, autosave and project files (.pqp).'],
  },
];
