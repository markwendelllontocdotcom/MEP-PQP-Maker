PQP MAKER - READ ME
===================

Version 1.1.1 (16 Oct 2026)
Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.

PQP Maker writes the Project Quality Plan (PQP) for an MEP project. You enter the project
details once and the app produces the full PQP from the Oxypro template (Project Quality
Plan - Template R1), aligned with ISO 9001:2015, as an editable Word file and a PDF.


1. WHAT IS IN THIS FOLDER
-------------------------

  PQP Maker.html            The application. Double-click to open it in Edge or Chrome.
  Samples\                  Sample PQPs (Word and PDF) printed from the test data, updated
                            whenever the layout changes. You can also send test exports here.
  Source\                   The program source (zip). Only needed to change or rebuild the app.
  P### Project Name\        One folder per project (for example P122 ...), holding the project
                            file (.pqp) and its exported PQPs.
  Project Quality Plan - Template R1.docx
                            The company template the PQP text comes from.
  PQP Maker.csv / .xlsx     The list of input fields.
  2026 ISO CERTIFICATES\    The company ISO 9001, 14001 and 45001 certificates.
  Org Chart\                The QA/QC Department Organization Chart template.
  UAE Cover Page.png        Cover page reference.


2. OPENING THE APP
------------------

  - Double-click PQP Maker.html. It opens in your web browser (Edge or Chrome recommended).
  - No installation, login or internet connection is needed.
  - Tip: pin the browser tab or add it to your favourites to open it quickly.


3. MAKING A PQP
---------------

  1. Fill in the groups on the left, from 1. Project Information to 7. Annexures.
     A red number on a group shows how many entries are still empty or need fixing.
     Fields marked * are required.
  2. Under PQP Sections, untick any section you do not need. The sections after it are
     renumbered automatically, including the "Refer Annexure" references.
  3. Check the summary box on the right (Doc Ref, Rev, date and status).
  4. Click Export Word (.docx) or Export PDF.
     Entries that are not allowed (for example a 4-digit project number) stop the export
     and are listed so you can fix them.
  5. Click Save to keep the project as a .pqp file in the project's folder.

  Exported files are named:  <Doc Ref> Rev <NN> - PQP - <Project name>.docx / .pdf
  For example:  OPEM-E-26-101-PL-QM-001 Rev 00 - PQP - Sample Residential Tower (G+20).pdf

  Want to see a finished PQP first? Click "Load sample data" to fill every field with
  made-up test data. (Save your own project first: this replaces what is on screen.)

  The Word file updates its table of contents when it opens. If Word asks "This document
  contains fields that may refer to other files. Do you want to update the fields in this
  document?", click Yes.


4. WHERE EXPORTS ARE SAVED
--------------------------

  - Edge or Chrome on a laptop: on the first export the app asks for a folder. Choose the
    project's own folder (for example P122 ...) or Samples. Every Word and PDF export is then
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

  - Everything stays on this computer. There is no login and nothing is uploaded.
  - Project data is kept only in your .pqp files and in this browser's storage.


7. UPDATING THE APP
-------------------

  - Save your open project as a .pqp file.
  - Replace PQP Maker.html in this folder with the new copy.
  - Open it. Your .pqp files open in the new version. Projects saved by older versions are
    brought up to date automatically.
  - The app's About page (bottom of the menu on the left) shows the version and what changed.


8. VERSION HISTORY
------------------

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
