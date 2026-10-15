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
