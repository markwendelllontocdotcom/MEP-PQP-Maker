// Quick checks of the Phase 1 rules that do not need a browser.
import { defaultSettings, testProject, newProject } from '../src/model/defaults';
import { docRef, durationDays, outputBaseName } from '../src/model/format';
import { allErrors, missingMandatory } from '../src/model/fields';
import { serialise, parseProjectFile } from '../src/files';
const s = defaultSettings();
const p = testProject(s);
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
ok(docRef(p) === 'OPEM-E-26-101-PL-QM-001', 'Doc Ref from test data');
ok(durationDays(p) === 425, 'Duration 425 days');
ok(allErrors(p).length === 0, 'Test data has no invalid entries');
ok(missingMandatory(p).length === 0, 'Test data fills every required field');
ok(allErrors({ ...p, P02: '1234' }).some((e) => e.f.id === 'P02'), '4-digit project number blocked');
ok(allErrors({ ...p, P11: '2026-10-01' }).some((e) => e.f.id === 'P11'), 'Completion before commencement blocked');
ok(allErrors({ ...p, Q04: '80' }).some((e) => e.f.id === 'Q04'), 'Q04 = 80 blocked');
ok(allErrors({ ...p, D03: '1' }).some((e) => e.f.id === 'D03'), '1-digit revision blocked');
ok(JSON.stringify(parseProjectFile(serialise(p))) === JSON.stringify(p), '.pqp save and reopen give the same project');
let threw = false; try { parseProjectFile('{"a":1}'); } catch { threw = true; }
ok(threw, 'Non-project file rejected');
ok(missingMandatory(newProject(s)).length > 0, 'New project starts with required fields empty');
ok(outputBaseName(p) === 'OPEM-E-26-101-PL-QM-001 Rev 00 - PQP - Sample Residential Tower (G+20)', 'Export file name');
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
  const t: any = m.blocks.find((b: any) => b.t === 'tbl' && JSON.stringify(b).includes('"Project Number"'));
  const labels = (t?.rows || []).map((r: any) => (JSON.stringify(r.c[0]).match(/"x":"([^"]*)"/) || [])[1]);
  ok(labels.join('|') === 'Project|Project Number|Location|Our Role', 'Project Information rows: Project, Project Number, Location, Our Role (+ Building Configuration when filled)');
  const m2 = await buildDoc({ ...p, P13: 'B+G+20+R' }, s, nodePlatform);
  const t2: any = m2.blocks.find((b: any) => b.t === 'tbl' && JSON.stringify(b).includes('"Project Number"'));
  ok(t2.rows.length === 5 && !JSON.stringify(t2).includes('Approving Authorities') && !JSON.stringify(t2).includes('Contract Type') && !JSON.stringify(t2).includes('Project Type'), 'No Project Type, Contract Type or Approving Authorities rows');
}
