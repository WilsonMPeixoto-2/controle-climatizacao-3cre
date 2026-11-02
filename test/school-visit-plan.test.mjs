import assert from 'node:assert/strict';
import {
  createVisitDraft, updateVisitDraft, readVisitDrafts, writeVisitDrafts,
  summarizeVisits, parseVisitBackup, parseStoredVisitDrafts, createVisitBackup,
  isCivilDate, monthOf, VISIT_DRAFT_KEY, VISIT_RECOVERY_KEY
} from '../src/domain/schoolVisitPlan.js';
import { persistVisitDraft } from '../src/domain/visitDraftStorage.js';

const schools = [{ designacao: '03.01.001', unidade_escolar: 'Escola A' }, { designacao: '03.01.002', unidade_escolar: 'Escola B' }];
const start = { schoolId: '03.01.001', plannedDate: '2026-09-17', kind: 'preventiva', equipmentCount: '', cycle: 'Primeiro ciclo', note: '' };
const a = createVisitDraft(start, { id: 'visit-1', now: '2026-09-01T12:00:00Z' });
assert.equal(a.equipmentCount, null);
assert.equal(a.reportedDate, '');
assert.equal(a.history.length, 0);
assert.equal(monthOf(a.plannedDate), '2026-09');
assert.equal(isCivilDate('2026-02-29'), false);
assert.equal(isCivilDate('2028-02-29'), true);
assert.equal(isCivilDate('2026-99-01'), false);
assert.equal(isCivilDate('2026-09-10'), true);
assert.throws(() => createVisitDraft({ ...start, plannedDate: '2026-02-30' }, { id: 'bad' }), /data prevista/);
assert.throws(() => createVisitDraft({ ...start, equipmentCount: 3.5 }, { id: 'bad' }), /Quantidade/);
assert.throws(() => createVisitDraft({ ...start, kind: 'faturado' }, { id: 'bad' }), /modalidade/);
assert.throws(() => createVisitDraft({ ...start, schoolId: '' }, { id: 'bad' }), /escola/);
const second = createVisitDraft({ ...start, equipmentCount: 0 }, { id: 'visit-2', now: '2026-09-01T12:01:00Z' });
assert.equal(second.equipmentCount, 0);
const sep = summarizeVisits([a, second], '2026-09', schools);
assert.equal(sep.visits, 2); // duas visitas legítimas para a mesma escola e mês
assert.equal(sep.schools, 1);
assert.equal(sep.inReview.length, 2);
assert.equal(sep.reported.length, 0);
const moved = updateVisitDraft(a, { plannedDate: '2026-10-05' }, { now: '2026-09-12T12:00:00Z' });
assert.equal(moved.history.length, 1);
assert.equal(moved.history[0].from, '2026-09-17');
assert.equal(moved.history[0].to, '2026-10-05');
assert.equal(a.plannedDate, '2026-09-17'); // imutável
assert.equal(summarizeVisits([moved, second], '2026-09', schools).movedOut.length, 1);
assert.equal(summarizeVisits([moved, second], '2026-10', schools).active.length, 1);
const informed = updateVisitDraft(moved, { reportedDate: '2026-10-06', reportReference: 'OES-X' }, { now: '2026-10-10T12:00:00Z' });
assert.equal(informed.history.length, 1); // registrar execução não inventa reprogramação
assert.equal(summarizeVisits([informed], '2026-10', schools).reported.length, 1);
assert.equal(updateVisitDraft(informed, {}, { now: '2026-10-11T12:00:00Z' }), informed);
assert.throws(() => updateVisitDraft(informed, { reportedDate: '2026-02-31' }), /execução válida/);
const raw = new Map();
const storage = {
  getItem: key => raw.get(key) || null,
  setItem: (key, value) => raw.set(key, value)
};
writeVisitDrafts(storage, [second, informed]);
assert.equal(raw.has(VISIT_DRAFT_KEY), true);
assert.deepEqual(readVisitDrafts(storage), [second, informed]);
raw.set(VISIT_DRAFT_KEY, '{');
assert.throws(() => readVisitDrafts(storage));
raw.set(VISIT_DRAFT_KEY, JSON.stringify([second, second]));
assert.throws(() => readVisitDrafts(storage), /repetidos/);
assert.throws(() => writeVisitDrafts({ setItem: () => { throw new Error('quota'); } }, []), /quota/);
assert.equal(summarizeVisits([informed], '2026-10', []).orphaned, 1);

// O filtro de escola aplica-se a todas as contagens e à lista, sem duplicar escolas.
const another = createVisitDraft({ ...start, schoolId: '03.01.002', plannedDate: '2026-10-10', reportedDate: '2026-09-30' }, { id: 'visit-B' });
const filteredA = summarizeVisits([informed, another], '2026-10', schools, { schoolId: '03.01.001' });
assert.equal(filteredA.visits, 1);
assert.equal(filteredA.schools, 1);
assert.equal(filteredA.active[0].schoolId, '03.01.001');
assert.equal(filteredA.executedInMonth.length, 1);
const filteredB = summarizeVisits([informed, another], '2026-10', schools, { schoolId: '03.01.002' });
assert.equal(filteredB.visits, 1);
assert.equal(filteredB.executedInMonth.length, 0);
assert.equal(summarizeVisits([another], '2026-09', schools).reported.length, 0);
assert.equal(summarizeVisits([another], '2026-09', schools).executedInMonth.length, 1); // execução ≠ competência planejada

const backup = JSON.stringify({ format: 'gop-clima-visit-draft-v1', exportedAt: '2026-10-11T00:00:00Z', rows: [second, informed] });
assert.deepEqual(parseVisitBackup(backup), [second, informed]);
assert.throws(() => parseVisitBackup(JSON.stringify({ format: 'outro', rows: [] })), /cópia de segurança/);
assert.throws(() => parseVisitBackup(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows: [second, second] })), /repetidos/);
assert.throws(() => parseVisitBackup('inválido'));
assert.throws(() => parseVisitBackup(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows: [{ id: 'X', schoolId: '' }] })), /escola/);

// Histórico corrompido deve ser rejeitado, nunca descartado ou persistido.
const revision = moved.history[0];
const invalidHistories = [
  [null], null, {}, 'inválido', [[]], ['inválido'], [{}],
  [{ ...revision, from: '2026-02-30' }],
  [{ ...revision, to: '2026-13-01' }],
  [{ from: revision.from, to: revision.to }],
  [{ ...revision, at: 123 }],
  [{ ...revision, at: 'inválido' }],
  [{ ...revision, at: '2026-02-30T12:00:00Z' }],
  [{ ...revision, at: '2026-09-12T24:00:00Z' }],
  [{ ...revision, at: '2026-09-12' }]
];
for (const history of invalidHistories) {
  const invalidRows = [{ ...informed, history }];
  assert.throws(() => parseVisitBackup(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows: invalidRows })), /histórico/i);
  assert.throws(() => parseStoredVisitDrafts(JSON.stringify(invalidRows)), /histórico/i);
}

writeVisitDrafts(storage, [second, informed]);
raw.set(VISIT_RECOVERY_KEY, JSON.stringify([second]));
const beforeInvalidWrite = [...raw];
const brokenRows = [{ ...informed, history: [null] }];
assert.throws(() => writeVisitDrafts(storage, brokenRows), /histórico/i);
assert.throws(() => createVisitBackup(brokenRows), /histórico/i);
let requestedLocks = 0;
await assert.rejects(persistVisitDraft({
  storage,
  locks: { request: () => { requestedLocks += 1; throw new Error('Lock não deve ser solicitado.'); } },
  expectedRaw: storage.getItem(VISIT_DRAFT_KEY), rows: brokenRows, saveRecovery: true
}), /histórico/i);
assert.equal(requestedLocks, 0);
assert.deepEqual([...raw], beforeInvalidWrite); // rascunho e recuperação permanecem intocados

// Linhas antigas sem histórico continuam legíveis; revisões válidas fazem roundtrip.
const legacy = { ...second };
delete legacy.history;
assert.deepEqual(parseStoredVisitDrafts(JSON.stringify([legacy])), [second]);
assert.deepEqual(parseVisitBackup(JSON.stringify({ format: 'gop-clima-visit-draft-v1', rows: [legacy] })), [second]);
const twiceMoved = updateVisitDraft(informed, { plannedDate: '2026-12-01' });
const roundtrip = parseVisitBackup(createVisitBackup([second, twiceMoved]));
assert.deepEqual(roundtrip, [second, twiceMoved]);
writeVisitDrafts(storage, roundtrip);
assert.deepEqual(readVisitDrafts(storage), [second, twiceMoved]);
assert.equal(summarizeVisits(roundtrip, '2026-09', schools).movedOut.length, 1);

console.log('E3 | Programação: reprogramação, execução informada, duplicidades legítimas e armazenamento local passaram.');
