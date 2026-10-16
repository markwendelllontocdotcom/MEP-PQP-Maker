# PQP Maker

Project Quality Plan generator for MEP projects. You fill in the project data, choose the sections and export the PQP as an editable Word file or a PDF. It is built from the company sample *Project Quality Plan - Template R1*: R1's structure, numbering and wording are the standard text.

Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.

## Use it

| Device | How |
| --- | --- |
| Windows / Mac (installed) | Open the web app in Edge or Chrome, then use **Install app** in the address bar. It works offline after the first open. |
| Windows / Mac (no install) | Double-click `PQP Maker.html`. It works with no internet. Projects saved in this copy stay in that browser. |
| iPhone / iPad | Open the web app in Safari, then **Share > Add to Home Screen**. Use the home-screen app, not a Safari tab, so your data is kept. |

## Daily use

1. **New** starts a blank project with the Oxypro defaults. **Load sample data** fills the fictitious test data from the fields sheet.
2. Fill in the groups on the left. A red number shows how many fields in a group still need attention. Required fields are marked `*`.
3. **PQP Sections** lets you leave out any section. The sections after it are renumbered, and the "Refer Annexure" references follow.
4. **Export Word** and **Export PDF** create `<Doc Ref> Rev <NN> - PQP - <Project>.docx / .pdf`. Entries that are not allowed (for example a 4-digit project number) block the export and are listed so you can fix them.
5. **Export folder** (Edge or Chrome on Windows and macOS): on the first export the app asks for a folder, for example the `Samples` folder in the PQP Maker project folder. Every Word and PDF export is then saved straight into it (a re-export of the same Doc Ref and Rev replaces the older file) and Save starts there too. Change it under the export buttons, or choose **Use Downloads**. On iPhone, Safari and Firefox exports go to the Downloads folder.
5. When Word opens the file it asks to update fields. Choose **Yes** so the table of contents shows Word's page numbers.

Work is saved automatically on the device about a second after each change, and the last 20 versions are kept. **Save / Save as** writes a `.pqp` project file you can keep in OneDrive or send to another device. **Open** reads it back.

## For developers

```
npm install
npm run build      # dist/web (installable web app) and dist/release/PQP Maker.html (single file)
npm run samples    # sample Word + PDF from the test data into samples/
npm test           # rule checks
python3 tools/extract_r1.py   # rebuild src/content/r1.json from tools/R1.docx after the template changes
```

- `src/content/build.ts` turns the project data and R1 content into one document model.
- `src/gen/docx.ts` writes the Word file. It uses R1's styles and numbering and adds one multilevel list for the section numbers.
- `src/gen/pdf.ts` writes the PDF with pdfmake. It uses Carlito, which has the same metrics as Calibri.
- `src/app.tsx` is the interface. `src/storage.ts` handles autosave (IndexedDB), and `src/files.ts` handles `.pqp` files.
