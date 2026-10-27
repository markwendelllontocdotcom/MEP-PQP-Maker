PQP MAKER - READ ME
===================

Version 1.5.1 (23 Oct 2026)
Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.

PQP Maker writes the Project Quality Plan (PQP) for an MEP project. You enter the project
details once and the app produces the full PQP from the Oxypro template (Project Quality
Plan - Template R1), aligned with ISO 9001:2015, as an editable Word file and a PDF.


1. WHAT IS IN THIS FOLDER
-------------------------

  PQP Maker.html            The application. Double-click to open it in Edge or Chrome.
  README.txt                This guide.
  Samples\                  Sample PQPs (Word and PDF) printed from the test data, updated
                            whenever the layout changes. You can also send test exports here.
  Source\                   The program source (zip). Only needed to change or rebuild the app.
  Icon\                     The app icon: PQP Maker.ico (for a desktop shortcut), a large PNG
                            and the sizes the app uses (browser tab, installed app, iPhone).
  <Code> Project Name\       One folder per project (for example P101 ... or DXB-101 ...),
                            holding the project file (.pqp) and its exported PQPs.
  Templates\                The reference material the app is built on:
    Project Quality Plan - Template R1.docx   the company template the PQP text comes from
    2026 ISO CERTIFICATES\                    the ISO 9001, 14001 and 45001 certificates
    Org Chart\                                the QA/QC Department Organization Chart template
    UAE Cover Page.png                        cover page reference
    PQP Maker - Instruction.xlsx              the original brief and input fields list
  PQP Maker.csv             The original input fields list (the app's current fields are
                            described in its About PQP Maker panel and in this guide).

2. OPENING THE APP
------------------

  From this folder:
  - Double-click PQP Maker.html. It opens in your web browser (Edge or Chrome recommended).
  - No installation, login or internet connection is needed.
  - Tip: pin the browser tab or add it to your favourites to open it quickly.
  - Desktop shortcut with the app icon (Windows): right-click PQP Maker.html, choose
    Show more options > Send to > Desktop (create shortcut). Right-click the new shortcut,
    choose Properties > Change Icon > Browse, pick Icon\PQP Maker.ico and click OK.

  From the web (any device):
  - Open https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/
  - Windows or macOS (Edge or Chrome): click the Install icon at the right of the address
    bar (or the browser menu > Apps > Install PQP Maker). It then opens like any program,
    from the Start menu or the Dock, and works offline.
  - iPhone or iPad: open the link in Safari, tap Share, then Add to Home Screen.
  - The web version keeps its own autosave, separate from the copy in this folder. To move
    a project between them, Save it as a .pqp file and Open it in the other one.


3. MAKING A PQP
---------------

  1. Fill in the groups on the left, from 1. Project Information to 7. Annexures.
     A red number on a group shows how many entries are still empty or need fixing.
     Fields marked * are required.
     Project Code & Project Number: type it the way it should appear in the Doc Ref.
     Letters, numbers and hyphens, no spaces; capitals are added as you type. For example
     DXB-243 gives OPEM-DXB-243-QM-PQP-001 and P122 gives OPEM-P122-QM-PQP-001.
  2. Under PQP Sections, untick any section you do not need. The sections after it are
     renumbered automatically, including the "Refer Annexure" references.
  3. Click Review (left menu or toolbar) for a quick check before the PQP goes out:
     - what still needs fixing, ISO certificate warnings, sections left out and whether
       the project file is saved
     - a preview of the whole PQP, page by page (the same PDF that Export PDF saves)
     - the key details at a glance (cover, document control, scope, key personnel and
       annexures), each with an Edit link
  4. Click Export Word (.docx) or Export PDF, or Print.
     Entries that are not allowed (for example a project code with a space) stop the export
     and the print and are listed so you can fix them.
  5. Click Save to keep the project as a .pqp file in the project's folder.

  Exported files are named:  <Doc Ref> Rev <NN> - PQP - <Project name>.docx / .pdf
  For example:  OPEM-DXB-101-QM-PQP-001 Rev 00 - PQP - Sample Residential Tower (G+20).pdf

  From the Oxypro Project Library: open the project in the Library, click "PQP details and
  file", then "Open in PQP Maker". The web version of PQP Maker opens in a new tab with the
  PQP already created from the Library details and shows it on the Review page. Then add the
  cover photo, fill in Our Role, Disciplines, document control, key personnel and the rest,
  and export. (Save PQP file in the same Library window saves a .pqp file that also carries
  the cover photo; Open it here.) If the PQP open in PQP Maker has the same project code,
  you can update it instead and keep everything you entered.
  (The double-click copy of PQP Maker.html cannot receive projects from the Library.)

  Want to see a finished PQP first? Click "Load sample data" to fill every field with
  made-up test data. (Save your own project first: this replaces what is on screen.)

  Print: in Edge and Chrome (web version and installed app) the print dialog opens straight
  away. In the double-click copy of PQP Maker.html, Safari and iPhone the PDF opens in a new
  tab: print it from there with Ctrl+P (Cmd+P on a Mac), the printer icon, or Share > Print.

  The Word file updates its table of contents when it opens. If Word asks "This document
  contains fields that may refer to other files. Do you want to update the fields in this
  document?", click Yes.


4. WHERE EXPORTS ARE SAVED
--------------------------

  - Edge or Chrome on a laptop: on the first export the app asks for a folder. Choose the
    project's own folder (for example DXB-101 ...) or Samples. Every Word and PDF export is then
    saved straight into it. Exporting the same Doc Ref and Rev again replaces the older file.
  - To change the folder, click "Choose folder" under the export buttons. "Use Downloads"
    sends exports to your Downloads folder instead.
  - If a folder is moved or renamed, choose it again in the app.
  - If the PQP is open in Word while you export, the app saves it to Downloads instead.
    Close the file and export again.
  - iPhone, Safari and Firefox: exports go to the Downloads folder.


5. SAVING AND REOPENING PROJECTS
--------------------------------

  - Save writes a .pqp project file. It holds everything you entered, including photos and
    logos. Keep it in the project's folder.
  - Open brings a .pqp file back, for example to prepare the next revision.
  - The app also autosaves the current project in the browser about a second after each
    change, so it is still there when you reopen the app.
  - Browser storage can be cleared (for example by clearing browsing data), so always keep
    a saved .pqp file for each project.


6. YOUR DATA
------------

  - Everything stays on this computer. There is no login and nothing is uploaded, also
    when you use the web version: only the app itself comes from the web.
  - Project data is kept only in your .pqp files and in this browser's storage.
  - A project sent from the Oxypro Project Library travels in the part of the link after #,
    which the browser never sends to the web server.


7. UPDATING THE APP
-------------------

  - Save your open project as a .pqp file.
  - Replace PQP Maker.html in this folder with the new copy.
  - Open it. Your .pqp files open in the new version. Projects saved by older versions are
    brought up to date automatically.
  - The web version updates itself: the next time you open it after an update, the new
    version loads.
  - The About PQP Maker panel (bottom of the menu on the left, or About at the bottom of the
    app) shows the version and what changed. It slides in over the form; close it with the
    X button, Esc or a click outside it.


8. VERSION HISTORY
------------------

  1.6.0  (27 Oct 2026)
    - From the Oxypro Project Library (PQP details and file, then Open in PQP Maker): the
      web version opens with the PQP already created from the Library project and shows it
      on the Review page.
    - Our Role, Disciplines, document control, key personnel, ISO certificates and the
      amendment record stay yours to fill in.
    - A PQP with the same project code can be updated with the Library details, keeping
      everything you entered.

  1.5.1  (23 Oct 2026)
    - About PQP Maker is now a panel that slides in from the right over the form, so you
      keep your place. Close it with the X button, Esc or a click outside it.

  1.5.0  (17 Oct 2026)
    - Review page (Review in the left menu and the toolbar): what still needs fixing, ISO
      certificate warnings, sections left out and whether the project file is saved; a
      preview of the whole PQP, page by page; and the key details with Edit links.
    - Print button in the toolbar, under the export buttons and on the Review page.
    - Export PDF right after a review or a print is instant: the same PDF is reused.

  1.4.0  (17 Oct 2026)
    - Project Number is now Project Code & Project Number. It takes letters, numbers and
      hyphens (for example DXB-243) and is typed in capitals.
    - The Doc Ref prints the code exactly as typed, with no P added:
      OPEM-DXB-243-QM-PQP-001. With no code yet it shows OPEM-[XXX]-QM-PQP-001.
      Type P122 if you want the P.
    - Projects saved earlier keep their Doc Ref: a 3-digit number such as 122 becomes P122
      in the field when the project is opened.
    - The Project Information table row is renamed Project Code & Project Number.

  1.3.2  (16 Oct 2026)
    - The app icon has a transparent background (no white tile). iPhone and Android home
      screens keep a white background because they do not allow transparent icons.

  1.3.1  (16 Oct 2026)
    - The browser tab shows the app icon in the web version too.

  1.3.0  (16 Oct 2026)
    - New document reference format OPEM-[PXXX]-QM-PQP-001, for example OPEM-P122-QM-PQP-001
      (was OPEM-E-26-[XXX]-PL-QM-001). It shows on the cover, in the footer, in the Amendment
      Record and in the file names. The project year is no longer needed. Projects saved
      earlier switch to the new reference when they are opened.

  1.2.1  (16 Oct 2026)
    - New app icon: the QA/QC engineer with the PQP clipboard. It shows in the browser tab,
      the installed app and the About page.

  1.2.0  (16 Oct 2026)
    - Published on the web at https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/
      It can be installed as an app on Windows, macOS, iPhone and iPad.

  1.1.1  (16 Oct 2026)
    - The Project Information table lists Project, Project Number, Location, Our Role and
      Building Configuration. Project Type, Contract Type and Approving Authorities are no
      longer printed there; the approving authorities still appear in 5.18 and 5.21.

  1.1.0  (16 Oct 2026)
    - Exports can be saved straight into a folder you choose (Edge and Chrome).
    - Annexure 8.1 is drawn as the QA/QC Department Organization Chart. Key Personnel
      follows the chart, with a live preview.
    - Annexure 8.2 prints the ISO certificates of the standards ticked under
      5. Quality System.
    - Cover photo box 16.5 x 11.6 cm, centred, with the photo stretched to 16 x 11 cm.
    - Project Information shows the project number as P### and one or more project types.
      Contract dates are no longer printed.
    - Short tables in the PDF move to the next page whole instead of splitting.
    - About page in the app.

  1.0.0  (15 Oct 2026)
    - First release: project data entry, PQP generated from the R1 template, Word and PDF
      export, autosave and project files (.pqp).


--------------------------------------------------------------------------------------------
Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.
