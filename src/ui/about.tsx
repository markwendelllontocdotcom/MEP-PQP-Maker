import { APP_NAME, APP_VERSION, APP_DATE, CREDIT, CHANGES, WEB_URL } from '../version';
import iconUrl from '../assets/icon.svg?inline';

/** About page: what the app is, how to use it, where the data lives and what changed. */
export function About(props: { exportFolder: string | null; canPickFolder: boolean; onGo: (group: string) => void }) {
  const go = (g: string, label: string) => <button class="linkbtn" onClick={() => props.onGo(g)}>{label}</button>;
  return (
    <div class="about">
      <div class="about-card">
        <img src={iconUrl} alt="" width={56} height={56} />
        <div>
          <div class="about-name">{APP_NAME}</div>
          <div class="about-ver">Version {APP_VERSION} · {APP_DATE}</div>
          <p class="about-tag">Project Quality Plan generator for MEP projects, built on the Oxypro PQP template (R1) and aligned with ISO 9001:2015.</p>
        </div>
      </div>

      <section>
        <h2>What it does</h2>
        <p>You enter the project details once. PQP Maker writes the full Project Quality Plan from the company template: cover with signature block, table of contents, all R1 sections with their numbering and wording, the amendment record and the annexures (organisation chart, ISO certificates, forms, quality policy and the Method Statement list). You get an editable Word file and a PDF, both A4 with the Oxypro header, the Doc Ref and Rev in the footer and "Page X of Y".</p>
      </section>

      <section>
        <h2>How to use it</h2>
        <ol class="about-steps">
          <li>Fill in the groups on the left, from {go('project', '1. Project Information')} to {go('annex', '7. Annexures')}. A red number shows how many entries are still empty or need fixing. Fields marked <span class="req">*</span> are required.</li>
          <li>Untick any section you do not need under {go('sections', 'PQP Sections')}. The sections after it are renumbered.</li>
          <li>Check the summary box on the right (Doc Ref, Rev, date and status), then click <b>Export Word (.docx)</b> or <b>Export PDF</b>. Entries that are not allowed, such as a 4-digit project number, stop the export and are listed so you can fix them.</li>
          <li>Click <b>Save</b> to keep the project as a <b>.pqp</b> file. <b>Open</b> brings it back later for the next revision.</li>
        </ol>
        <p class="about-note">Want to see a finished PQP first? <b>Load sample data</b> fills every field with made-up test data.</p>
      </section>

      <section>
        <h2>Files and folders</h2>
        <ul>
          <li><b>Exported PQPs</b> are named <code>Doc Ref Rev NN - PQP - Project name</code>, for example <code>OPEM-E-26-101-PL-QM-001 Rev 00 - PQP - Sample Residential Tower (G+20).pdf</code>.</li>
          <li><b>Export folder:</b> {props.canPickFolder
            ? <>exports are saved to <b>{props.exportFolder || 'your Downloads folder'}</b>. Change it with <b>Choose folder</b> under the export buttons, for example to the project's own folder or the Samples folder. A new export with the same Doc Ref and Rev replaces the older file.</>
            : <>on this browser exports go to your Downloads folder. In Edge or Chrome on a laptop you can choose a folder instead.</>}</li>
          <li><b>Project files (.pqp)</b> hold everything you entered, including photos and logos, so a project can be moved to another computer or kept with the project records.</li>
        </ul>
      </section>

      <section>
        <h2>Your data</h2>
        <ul>
          <li>Everything stays on this device. There is no login and nothing is uploaded.</li>
          <li>The current project is autosaved in this browser about a second after each change, so it is still there when you reopen the app.</li>
          <li>Browser storage can be cleared (for example by clearing browsing data), so save important projects as .pqp files as well.</li>
          <li>The app works offline: open <b>PQP Maker.html</b> from the project folder, or the installed web version.</li>
        </ul>
      </section>

      <section>
        <h2>Web version and installing</h2>
        <ul>
          <li>PQP Maker is also on the web at <a href={WEB_URL} target="_blank" rel="noopener">{WEB_URL.replace('https://', '').replace(/\/$/, '')}</a>. Only the app comes from the web; your projects still stay on your device.</li>
          <li><b>Windows or macOS:</b> open the link in Edge or Chrome and click the <b>Install</b> icon at the right of the address bar (or the browser menu, then Apps, then Install PQP Maker). It then opens like any program and works offline.</li>
          <li><b>iPhone or iPad:</b> open the link in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</li>
          <li>The web version keeps its own autosave, separate from PQP Maker.html. To move a project between them, Save it as a .pqp file and Open it in the other one.</li>
          <li>The web version updates itself: after an update, the new version loads the next time you open it.</li>
        </ul>
      </section>

      <section>
        <h2>What's new</h2>
        {CHANGES.map((c) => (
          <div class="about-change">
            <h3>Version {c.v} <span>{c.date}</span></h3>
            <ul>{c.items.map((i) => <li>{i}</li>)}</ul>
          </div>
        ))}
      </section>

      <p class="about-credit">{CREDIT}</p>
    </div>
  );
}
