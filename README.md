# PQP Maker

Project Quality Plan generator for MEP projects. You fill in the project data, choose the sections and export the PQP as an editable Word file or a PDF. It is built from the company sample *Project Quality Plan - Template R1*: R1's structure, numbering and wording are the standard text.

**Open the app: https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/**

Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.

## Use it

| Device | How |
| --- | --- |
| Windows / Mac (installed) | Open the web app in Edge or Chrome, then use **Install** in the address bar. It works offline after the first open. |
| Windows / Mac (no install) | Double-click `PQP Maker.html` (the single-file copy). It works with no internet. Projects saved in this copy stay in that browser. |
| iPhone / iPad | Open the web app in Safari, then **Share > Add to Home Screen**. Use the home-screen app, not a Safari tab, so your data is kept. |

Your projects never leave the device: there is no login, no server and no upload. Only the app itself is loaded from GitHub Pages.

## Daily use

1. **New** starts a blank project with the Oxypro defaults. **Load sample data** fills fictitious test data.
2. Fill in the groups on the left. A red number shows how many fields in a group still need attention. Required fields are marked `*`.
3. **PQP Sections** lets you leave out any section. The sections after it are renumbered and the "Refer Annexure" references follow.
4. **Export Word** and **Export PDF** create `<Doc Ref> Rev <NN> - PQP - <Project>.docx / .pdf`. The Doc Ref is `<Prefix>-<Project Code & Project Number>-QM-PQP-001`, with the code printed exactly as typed (for example `OPEM-DXB-243-QM-PQP-001`). Entries that are not allowed (for example a project code with a space) block the export and are listed so you can fix them.
5. **Export folder** (Edge or Chrome on Windows and macOS): on the first export the app asks for a folder, for example the project's folder. Every Word and PDF export is then saved straight into it (a re-export of the same Doc Ref and Rev replaces the older file) and Save starts there too. Change it under the export buttons, or choose **Use Downloads**. On iPhone, Safari and Firefox exports go to the Downloads folder.
6. When Word opens the file it asks to update fields. Choose **Yes** so the table of contents shows Word's page numbers.

Work is saved automatically on the device about a second after each change. **Save / Save as** writes a `.pqp` project file you can keep with the project records or move to another device. **Open** reads it back. The **About** page in the app (bottom of the left menu) has the full guide and the version history.

## For developers

```
npm install
npm run build      # dist/web (installable web app) and dist/release/PQP Maker.html + README.txt (single file)
npm run pages      # build, then copy dist/web to docs/ for GitHub Pages
npm run samples    # sample Word + PDF from the test data into samples/
npm test           # rule checks
python3 tools/extract_r1.py   # rebuild src/content/r1.json from tools/R1.docx after the template changes
```

- `src/content/build.ts` turns the project data and R1 content into one document model.
- `src/gen/docx.ts` writes the Word file. It uses R1's styles and numbering and adds one multilevel list for the section numbers.
- `src/gen/pdf.ts` writes the PDF with pdfmake. It uses Carlito, which has the same metrics as Calibri.
- `src/app.tsx` is the interface. `src/storage.ts` handles autosave (IndexedDB), `src/files.ts` handles `.pqp` files and `src/exportdir.ts` the export folder.
- `src/version.ts` holds the version and the What's new list shown on the About page.

## Publishing

GitHub Pages serves the `docs/` folder of the `main` branch. To publish a new version: update `APP_VERSION` and `CHANGES` in `src/version.ts` (and the history in `release/README.txt`), run `npm run pages`, then commit and push. The installed app picks up the new version the next time it is opened.

## User guide

`release/README.txt` is the plain-text guide that goes in the app folder next to `PQP Maker.html` (the build copies it to `dist/release/`). The same information is on the app's About page.

## Copyright

© 2026 MLWorks. All rights reserved. The source is published for reference only; no licence to copy, modify or redistribute it is granted. The PQP template text, logo and ISO certificates included in the app are Oxypro company material.
