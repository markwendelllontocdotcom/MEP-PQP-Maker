// Quick checks of the Phase 1 rules that do not need a browser.
import { defaultSettings, testProject, newProject } from '../src/model/defaults';
import { docRef, durationDays, outputBaseName } from '../src/model/format';
import { allErrors, missingMandatory } from '../src/model/fields';
import { serialise, parseProjectFile } from '../src/files';
const s = defaultSettings();
const p = testProject(s);
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
ok(docRef(p) === 'OPEM-DXB-101-QM-PQP-001', 'Doc Ref from test data');
ok(docRef({ ...p, P02: '' }) === 'OPEM-[XXX]-QM-PQP-001', 'Doc Ref placeholder without a project code');
ok(docRef({ ...p, P02: '122' }) === 'OPEM-122-QM-PQP-001' && docRef({ ...p, P02: 'P122' }) === 'OPEM-P122-QM-PQP-001', 'Doc Ref prints the code as typed, no P added');
ok(docRef({ ...p, P02: 'dxb-243' }) === 'OPEM-DXB-243-QM-PQP-001', 'Doc Ref code in capitals');
ok(durationDays(p) === 425, 'Duration 425 days');
ok(allErrors(p).length === 0, 'Test data has no invalid entries');
ok(missingMandatory(p).length === 0, 'Test data fills every required field');
for (const ok2 of ['DXB-243', 'P122', '122', '1234', 'AB-12-C3']) ok(!allErrors({ ...p, P02: ok2 }).some((e) => e.f.id === 'P02'), `Project code ${ok2} allowed`);
for (const bad of ['DXB 243', 'DXB/243', '-243', 'DXB--243', 'DXB-', 'DXB_243', 'A'.repeat(21)]) ok(allErrors({ ...p, P02: bad }).some((e) => e.f.id === 'P02'), `Project code "${bad}" blocked`);
ok(allErrors({ ...p, P11: '2026-10-01' }).some((e) => e.f.id === 'P11'), 'Completion before commencement blocked');
ok(allErrors({ ...p, Q04: '80' }).some((e) => e.f.id === 'Q04'), 'Q04 = 80 blocked');
ok(allErrors({ ...p, D03: '1' }).some((e) => e.f.id === 'D03'), '1-digit revision blocked');
ok(JSON.stringify(parseProjectFile(serialise(p))) === JSON.stringify(p), '.pqp save and reopen give the same project');
let threw = false; try { parseProjectFile('{"a":1}'); } catch { threw = true; }
ok(threw, 'Non-project file rejected');
ok(missingMandatory(newProject(s)).length > 0, 'New project starts with required fields empty');
ok(outputBaseName(p) === 'OPEM-DXB-101-QM-PQP-001 Rev 00 - PQP - Sample Residential Tower (G+20)', 'Export file name');
ok(migrate({ ...p, D01: 'OPEM-E' }).D01 === 'OPEM', 'Older project: prefix OPEM-E becomes OPEM');
ok(migrate({ ...p, appVersion: '1.3.2', P02: '122' }).P02 === 'P122', 'Project saved before 1.4.0: 122 becomes P122 (same Doc Ref as before)');
ok(migrate({ ...p, appVersion: '1.3.2', P02: 'DXB-243' }).P02 === 'DXB-243', 'Project saved before 1.4.0: a code with letters is kept');
ok(migrate({ ...p, appVersion: '1.4.0', P02: '122' }).P02 === '122' && migrate(migrate({ ...p, appVersion: '1.0.0', P02: '122' })).P02 === 'P122', 'Project saved by 1.4.0: 122 stays 122; migration runs once');
import { migrate } from '../src/model/defaults';
const old: any = { ...p, P06: 'Residential', Q02: 'QMS-0000' }; delete old.CERTS;
const mg = migrate(old);
ok(Array.isArray(mg.P06) && mg.P06[0] === 'Residential', 'Older project: single Project Type becomes a list');
ok(mg.CERTS.length === 4 && mg.CERTS[0].no === 'CN011157', 'Older project: ISO certificate details added');
// Key Personnel follows the QA/QC Department Organization Chart (15 Oct 2026)
{
  const { people } = await import('../src/content/build');
  const { orgChart } = await import('../src/content/orgchart');
  const o: any = { ...p, K03: { name: 'Q. Eng', email: '', phone: '' }, K04: { name: 'H. Safe', email: '', phone: '' }, K06: [] };
  delete o.K07; delete o.K08; delete o.K09;
  const m = migrate(o);
  ok(Array.isArray(m.K03) && m.K03.length === 2 && m.K03[0].name === 'Q. Eng', 'Older project: QA/QC Engineer becomes a list of two chart boxes');
  ok(!('K04' in m) && m.K06[0].role === 'HSE Manager / Officer' && m.K06[0].name === 'H. Safe', 'Older project: HSE Manager moved to Other Personnel');
  ok(m.K07.name === '' && Array.isArray(m.K08) && Array.isArray(m.K09), 'Older project: Projects Director, Construction Managers and Project Engineers added');
  const roles = people(p).map((x) => x.role);
  ok(roles.join('|') === 'QA/QC Manager|QA/QC Engineer|QA/QC Engineer|Document Controller|Projects Director|Project Manager|Construction Manager|Project Engineer – Electrical|Project Engineer – Mechanical|HSE Manager / Officer|Site Engineer', 'Contact table follows the chart order');
  const boxes = (k: number) => (orgChart({ ...p, K03: Array.from({ length: k }, () => ({ name: '', email: '', phone: '' })) }, null).svg.match(/>QA\/QC ENGINEER</g) || []).length;
  ok(boxes(1) === 1 && boxes(2) === 2 && boxes(3) === 3 && boxes(5) === 3, 'Chart draws one QA/QC Engineer box per row (1 to 3)');
  ok(allErrors({ ...p, K03: [{ name: 'X', email: 'bad', phone: '' }] }).some((e) => e.f.id === 'K03'), 'QA/QC Engineer email checked');
}
// Project Information table rows (16 Oct 2026)
{
  const { buildDoc } = await import('../src/content/build');
  const { nodePlatform } = await import('./node-platform');
  const m = await buildDoc(p, s, nodePlatform);
  const t: any = m.blocks.find((b: any) => b.t === 'tbl' && JSON.stringify(b).includes('"Project Code & Project Number"'));
  const labels = (t?.rows || []).map((r: any) => (JSON.stringify(r.c[0]).match(/"x":"([^"]*)"/) || [])[1]);
  ok(labels.join('|') === 'Project|Project Code & Project Number|Location|Our Role', 'Project Information rows: Project, Project Code & Project Number, Location, Our Role (+ Building Configuration when filled)');
  ok(JSON.stringify(t.rows[1]).includes('"DXB-101"'), 'Project Information shows the code as typed (DXB-101)');
  const m2 = await buildDoc({ ...p, P13: 'B+G+20+R' }, s, nodePlatform);
  const t2: any = m2.blocks.find((b: any) => b.t === 'tbl' && JSON.stringify(b).includes('"Project Code & Project Number"'));
  ok(t2.rows.length === 5 && !JSON.stringify(t2).includes('Approving Authorities') && !JSON.stringify(t2).includes('Contract Type') && !JSON.stringify(t2).includes('Project Type'), 'No Project Type, Contract Type or Approving Authorities rows');
}
// Projects sent from the Oxypro Project Library (27 Oct 2026)
{
  const { readLibraryHash, cleanFields, applyLibrary, isBlankProject } = await import('../src/library');
  const { deflateRawSync } = await import('node:zlib');
  const b64u = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const proj = { P01: 'The Borough', P02: 'dxb-243', P04: 'Dubai', P05: 'Plot No. JVC17TCP001B', P06: ['Residential', 'Commercial'], P13: 'B+G+5P+17F+Roof',
    R01: 'MIRFA | ICONIC', R06: ['DM', 'DEWA', 'Nope'], Q07: ['Project Specifications'], R05: 'Main Contractor', P08: ['HVAC'], K01: { name: 'X' }, D06: 'Y', R10: { dataUrl: 'javascript:alert(1)' } };
  const file = JSON.stringify({ format: 'pqp-maker-project', version: 1, source: { library: 'P122' }, project: proj });
  const lib = await readLibraryHash('#library=' + b64u(deflateRawSync(Buffer.from(file))));
  ok(lib.source === 'P122' && lib.fields.P01 === 'The Borough' && lib.fields.P02 === 'DXB-243', 'Library link read (compressed)');
  ok((await readLibraryHash('#library-json=' + b64u(Buffer.from(file)))).fields.P13 === 'B+G+5P+17F+Roof', 'Library link read (plain JSON)');
  ok(!('R05' in lib.fields) && !('P08' in lib.fields) && !('K01' in lib.fields) && !('D06' in lib.fields) && !('R10' in lib.fields), 'Only Library fields are taken (Our Role, Disciplines, people, document control stay inputs; bad image dropped)');
  ok(JSON.stringify(lib.fields.R06) === '["DM","DEWA"]', 'Unknown authority left out');
  let bad = false; try { await readLibraryHash('#library=' + b64u(deflateRawSync(Buffer.from('{"x":1}')))); } catch { bad = true; }
  ok(bad, 'A link without a project is refused');
  const fresh = migrate(applyLibrary(newProject(s), lib.fields, false));
  ok(isBlankProject(newProject(s)) && !isBlankProject(fresh), 'Blank project detected');
  ok(docRef(fresh) === 'OPEM-DXB-243-QM-PQP-001' && fresh.R05 === 'MEP Subcontractor' && fresh.P08.length === 0 && fresh.D07 === 'QA/QC Engineer', 'New PQP from the Library keeps PQP Maker defaults for the rest');
  const mine = { ...testProject(s), P02: 'DXB-243', R10: { name: 'mine.jpg', type: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,AAAA' } };
  const upd = applyLibrary(mine, { ...lib.fields, R10: { name: 'lib.jpg', type: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,BBBB' } }, true);
  ok(upd.P01 === 'The Borough' && upd.D06 === mine.D06 && upd.K01.name === mine.K01.name && upd.R10!.name === 'mine.jpg' && upd.Q07.length === 1, 'Update keeps the people, document control and own cover photo');
  ok(Object.keys(cleanFields({ P04: 'Mars', P10: '27.10.2026', Q07: 'x' })).length === 0, 'Wrong emirate, date format and list type left out');
}
