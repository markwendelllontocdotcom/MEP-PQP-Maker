export const APP_NAME = 'PQP Maker';
export const APP_VERSION = '1.5.0';
export const APP_DATE = '17 Oct 2026';
export const WEB_URL = 'https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/';
export const CREDIT = 'Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.';

/** Version history shown on the About page (newest first). Keep README.txt in step. */
export const CHANGES: { v: string; date: string; items: string[] }[] = [
  {
    v: '1.5.0',
    date: '17 Oct 2026',
    items: [
      'Review page (Review in the left menu and the toolbar): what still needs fixing, ISO certificate warnings, sections left out and whether the project file is saved; a preview of the whole PQP, page by page (the same PDF that Export PDF saves); and the key details at a glance with Edit links.',
      'Print button in the toolbar, under the export buttons and on the Review page. In Edge and Chrome the print dialog opens straight away. In the double-click copy, Safari and iPhone the PDF opens in a new tab to print from.',
      'Export PDF right after a review or a print is instant: the same PDF is reused.',
    ],
  },
  {
    v: '1.4.0',
    date: '17 Oct 2026',
    items: [
      'Project Number is now Project Code & Project Number. It takes letters, numbers and hyphens (for example DXB-243) and is typed in capitals.',
      'The Doc Ref prints the code exactly as typed, with no P added: OPEM-DXB-243-QM-PQP-001. With no code yet it shows OPEM-[XXX]-QM-PQP-001. Type P122 if you want the P.',
      'Projects saved earlier keep their Doc Ref: a 3-digit number such as 122 becomes P122 in the field when the project is opened.',
      'The Project Information table row is renamed Project Code & Project Number.',
    ],
  },
  {
    v: '1.3.2',
    date: '16 Oct 2026',
    items: ['The app icon has a transparent background (no white tile) in the browser tab, the installed app on Windows and macOS, and the About page. iPhone and Android home screens keep a white background because they do not allow transparent icons.'],
  },
  {
    v: '1.3.1',
    date: '16 Oct 2026',
    items: ['The browser tab shows the app icon in the web version too (new icon files so browsers that saved an old or missing icon load it again).'],
  },
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
