import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setLogLevel,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { normalizeAttendance } from '../src/domain/attendanceEstimate.js';
import { createAttendancePersistence } from '../src/infrastructure/firebase/attendancePersistence.js';

const CLOUD_INTEGRATION = process.env.TEST_FINANCE_CLOUD_RULES === '1';
const PROJECT_ID = CLOUD_INTEGRATION ? 'demo-controle-climatizacao-3cre' : 'demo-gop-clima-financeiro';
const COLLECTION = 'atendimentos_economicos';
const rules = fs.readFileSync(new URL(
  CLOUD_INTEGRATION ? '../firestore.rules' : '../firestore.development.rules', import.meta.url
), 'utf8');
// As recusas esperadas são verificadas por assertFails, sem dezenas de logs do SDK.
setLogLevel('silent');
const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { host: '127.0.0.1', port: CLOUD_INTEGRATION ? 8080 : 8082, rules }
});

// Valores exclusivamente sintéticos: não são preços do contrato.
const item = (id, overrides = {}) => ({
  id,
  description: 'Grupo sintético de aparelhos',
  equipmentType: 'Split',
  capacityBtu: null,
  equipmentRef: '',
  quantity: 2,
  coverage: 'adicional',
  coverageSourceRef: '',
  referenceNature: 'provisoria',
  unitPriceUnits4: 123456,
  sourceRef: 'Fonte fictícia do teste',
  referenceVersion: 'teste-v1',
  catalogId: '',
  categoryCode: '',
  ...overrides
});

const content = (overrides = {}) => ({
  schoolId: '03.12.001',
  plannedMonth: '2026-11',
  plannedDate: '',
  serviceKind: 'preventiva',
  cycle: 'Ciclo informado de teste',
  visitId: 'VISITA-LOCAL-1',
  ticketIds: ['GOP-AR-2026-0001'],
  responsibleLabel: '',
  sessionId: 'sessao-teste-A',
  items: [item('grupo-1'), item('grupo-2', {
    quantity: 3,
    unitPriceUnits4: 98765,
    sourceRef: 'Segunda fonte fictícia de teste'
  })],
  ...overrides
});

const attendanceRef = (db, id) => doc(db, COLLECTION, id);
const revisionRef = (db, id, revision) => doc(db, COLLECTION, id, 'revisoes', `v${revision}`);

function rawRecord(id, overrides = {}) {
  return {
    ...normalizeAttendance(content()),
    id,
    revision: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides
  };
}

function writeWithSnapshot(db, record, pathId = record.id) {
  const batch = writeBatch(db);
  batch.set(attendanceRef(db, pathId), record);
  batch.set(revisionRef(db, pathId, record.revision), record);
  return batch.commit();
}

function nextSnapshot(persistence, predicate) {
  let unsubscribe = () => {};
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout aguardando sincronização do atendimento entre sessões.'));
    }, 8000);
    unsubscribe = persistence.subscribeAttendances({
      onData(records) {
        if (predicate(records)) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(records);
        }
      },
      onError(error) {
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    });
  });
  return promise;
}

try {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'escolas', '03.12.001'), {
        designacao: '03.12.001', unidade_escolar: 'Escola sintética A'
      }),
      setDoc(doc(db, 'escolas', '03.12.002'), {
        designacao: '03.12.002', unidade_escolar: 'Escola sintética B'
      }),
      ...Array.from({ length: 8 }, (_, index) => setDoc(
        doc(db, 'chamados', `GOP-AR-2026-${String(index + 1).padStart(4, '0')}`),
        { designacao: '03.12.001' }
      )),
      setDoc(doc(db, 'chamados', 'GOP-AR-2026-0099'), { designacao: '03.12.002' })
    ]);
  });

  const dbA = testEnv.unauthenticatedContext().firestore();
  const dbB = testEnv.unauthenticatedContext().firestore();
  const sessionA = createAttendancePersistence(dbA);
  const sessionB = createAttendancePersistence(dbB);

  assert.deepEqual(await sessionA.loadAttendances(), []);
  const observesCreation = nextSnapshot(sessionB, (records) => records.some((record) => record.id === 'atendimento-A'));
  const first = await sessionA.saveAttendance(content(), { id: 'atendimento-A' });
  assert.equal(first.revision, 1);
  assert.equal(first.items[0].lineTotalUnits4, 246912);
  assert.equal(first.items[1].lineTotalUnits4, 296295);
  assert.ok(Number.isFinite(Date.parse(first.createdAt)));
  assert.equal(first.createdAt, first.updatedAt);
  const fromSecondSession = (await observesCreation).find((record) => record.id === first.id);
  assert.deepEqual(fromSecondSession, first);
  assert.deepEqual((await sessionB.loadAttendances())[0], first);
  console.log('[PASSED] 1. duas sessões sem login gravam, releem e recebem composição pelo Firestore de desenvolvimento');

  const original = structuredClone(first);
  const observesUpdate = nextSnapshot(sessionA, (records) => records.some((record) => record.id === first.id && record.revision === 2));
  const corrected = await sessionB.saveAttendance(content({
    sessionId: 'sessao-teste-B',
    plannedMonth: '2026-12',
    items: [item('grupo-1', {
      quantity: 4,
      unitPriceUnits4: 100001,
      sourceRef: 'Referência corrigida fictícia',
      referenceVersion: 'teste-v2'
    }), item('grupo-2', { quantity: 0, unitPriceUnits4: 0 })]
  }), { id: first.id, expectedRevision: 1 });
  await observesUpdate;
  assert.equal(corrected.id, first.id);
  assert.equal(corrected.schoolId, first.schoolId);
  assert.equal(corrected.createdAt, first.createdAt);
  assert.equal(corrected.revision, 2);
  assert.equal(corrected.items[0].lineTotalUnits4, 400004);
  assert.equal(corrected.items[1].lineTotalUnits4, 0);
  assert.equal((await sessionA.loadAttendances()).length, 1);
  const revisions = await sessionA.loadAttendanceRevisions(first.id);
  assert.deepEqual(revisions.map((record) => record.revision), [2, 1]);
  assert.deepEqual(revisions[0], corrected);
  assert.deepEqual(revisions[1], original);
  console.log('[PASSED] 2. quantidade/preço e competência são corrigidos sem duplicação; snapshots preservam referência aplicada');

  const second = await sessionA.saveAttendance(content({
    schoolId: '03.12.002', ticketIds: [], visitId: '',
    items: [item('sem-parametro', {
      quantity: null, unitPriceUnits4: null, sourceRef: '', referenceNature: 'nao_informada'
    }), item('zero-informado', {
      quantity: 1, unitPriceUnits4: 0, referenceNature: 'informada'
    }), item('coberto', {
      quantity: 5, coverage: 'incluido', coverageSourceRef: 'Cobertura sintética informada',
      unitPriceUnits4: null, sourceRef: '', referenceNature: 'informada'
    })]
  }));
  assert.notEqual(second.id, first.id);
  assert.deepEqual(second.items.map((line) => line.lineTotalUnits4), [null, 0, 0]);
  assert.equal((await sessionB.loadAttendances()).length, 2);
  assert.equal((await sessionB.loadAttendances())[0].id, second.id);
  console.log('[PASSED] 3. segunda escola, ausência de parâmetro, zero informado e cobertura incluída permanecem distintos');

  const sources = await sessionA.saveAttendance(content({
    ticketIds: [],
    items: [item('cobertura-identificada', {
      coverage: 'incluido', coverageSourceRef: 'Fonte sintética de cobertura',
      sourceRef: 'Fonte sintética do preço nominal'
    }), item('sem-preco-sem-cobertura', {
      coverage: 'incluido', unitPriceUnits4: null, coverageSourceRef: '',
      sourceRef: 'Fonte sintética apenas do preço'
    }), item('preco-sem-origem-cobertura', {
      coverage: 'incluido', coverageSourceRef: '', sourceRef: 'Fonte sintética apenas do preço'
    }), item('cobertura-em-branco', {
      coverage: 'incluido', coverageSourceRef: '   ', sourceRef: 'Fonte sintética apenas do preço'
    })]
  }), { id: 'origens-distintas' });
  assert.deepEqual(sources.items.map((line) => line.lineTotalUnits4), [0, null, 246912, 246912]);
  assert.equal(sources.items[0].unitPriceUnits4, 123456);
  assert.equal(sources.items[0].sourceRef, 'Fonte sintética do preço nominal');
  assert.equal(sources.items[0].coverageSourceRef, 'Fonte sintética de cobertura');
  assert.deepEqual((await sessionB.loadAttendances()).find((record) => record.id === sources.id), sources);
  console.log('[PASSED] 3b. origem do preço não confirma cobertura; acréscimo zero preserva preço nominal e as duas origens');

  const concurrent = await Promise.allSettled([
    sessionA.saveAttendance(content({ cycle: 'Correção A' }), { id: first.id, expectedRevision: 2 }),
    sessionB.saveAttendance(content({ cycle: 'Correção B', sessionId: 'sessao-teste-B' }), { id: first.id, expectedRevision: 2 })
  ]);
  assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1);
  const conflict = concurrent.find((result) => result.status === 'rejected').reason;
  assert.equal(conflict.code, 'attendance/conflict');
  assert.equal(conflict.expectedRevision, 2);
  assert.equal(conflict.actualRevision, 3);
  const latest = (await sessionA.loadAttendances()).find((record) => record.id === first.id);
  assert.equal(latest.revision, 3);
  assert.equal((await sessionA.loadAttendanceRevisions(first.id)).length, 3);
  await assert.rejects(
    sessionA.saveAttendance(content(), { id: first.id, expectedRevision: 0 }),
    (error) => error.code === 'attendance/conflict'
  );
  console.log('[PASSED] 4. concorrência entre sessões rejeita versão desatualizada sem sobrescrever a vencedora');

  const maximum = await sessionA.saveAttendance(content({
    plannedMonth: '2000-02', plannedDate: '2000-02-29',
    ticketIds: Array.from({ length: 8 }, (_, index) => `GOP-AR-2026-${String(index + 1).padStart(4, '0')}`),
    items: Array.from({ length: 4 }, (_, index) => item(`grupo-${index + 1}`, {
      quantity: 45000, unitPriceUnits4: 10000000000, capacityBtu: 18000,
      referenceNature: 'contratual_informada', catalogId: 'catalogo-sintetico',
      coverageSourceRef: 'Origem de cobertura sintética informada'
    }))
  }), { id: 'limites-permitidos' });
  assert.equal(maximum.items.length, 4);
  assert.equal(maximum.ticketIds.length, 8);
  assert.equal(maximum.items[3].lineTotalUnits4, 450000000000000);
  const maximumUpdated = await sessionA.saveAttendance({ ...maximum, cycle: 'Correção dos limites' }, {
    id: maximum.id, expectedRevision: 1
  });
  assert.equal(maximumUpdated.revision, 2);
  const maximumCovered = await sessionA.saveAttendance({
    ...maximumUpdated,
    items: maximumUpdated.items.map((line) => ({ ...line, coverage: 'incluido' }))
  }, { id: maximum.id, expectedRevision: 2 });
  assert.equal(maximumCovered.revision, 3);
  assert.deepEqual(maximumCovered.items.map((line) => line.lineTotalUnits4), [0, 0, 0, 0]);
  assert.deepEqual(maximumCovered.items.map((line) => line.unitPriceUnits4), Array(4).fill(10000000000));
  console.log('[PASSED] 5. quatro grupos completos e oito chamados válidos passam criação/edição nos limites do backend');

  let invalidSequence = 0;
  async function invalidRaw(overrides) {
    const id = `invalido-${++invalidSequence}`;
    await assertFails(writeWithSnapshot(dbA, rawRecord(id, overrides), id));
    assert.equal((await getDoc(attendanceRef(dbA, id))).exists(), false);
  }
  async function invalidItem(overrides) {
    const normalized = normalizeAttendance(content());
    await invalidRaw({ items: [{ ...normalized.items[0], ...overrides }], itemIds: [normalized.items[0].id] });
  }

  await invalidRaw({ schoolId: 'escola-inexistente' });
  await invalidRaw({ schoolId: '03.12.002' });
  await invalidRaw({ ticketIds: ['chamado-inexistente'] });
  await invalidRaw({ ticketIds: ['GOP-AR-2026-0001', 'GOP-AR-2026-0001'] });
  await invalidRaw({ ticketIds: Array.from({ length: 9 }, (_, index) => `chamado-${index}`) });
  await invalidRaw({ ticketIds: ['../escolas/03.12.001'] });
  console.log('[PASSED] 6. backend recusa escolas/chamados inexistentes, chamados de outra escola e vínculos inválidos');

  await invalidRaw({ extra: 'campo fora do contrato' });
  await invalidRaw({ plannedMonth: '2026-13' });
  await invalidRaw({ plannedMonth: '0000-01' });
  await invalidRaw({ plannedDate: '2026-12-01' });
  await invalidRaw({ plannedDate: '2026-11-32' });
  await invalidRaw({ plannedMonth: '2026-02', plannedDate: '2026-02-29' });
  await invalidRaw({ plannedMonth: '2026-04', plannedDate: '2026-04-31' });
  await invalidRaw({ sessionId: '' });
  await invalidRaw({ responsibleLabel: 7 });
  await invalidRaw({ id: 'outro-id' });
  await invalidRaw({ revision: 0 });
  await invalidRaw({ createdAt: '2026-11-03T00:00:00.000Z' });
  await invalidRaw({ updatedAt: '2026-11-03T00:00:00.000Z' });
  await invalidRaw({ items: [], itemIds: [] });
  const tooMany = Array.from({ length: 5 }, (_, index) => ({
    ...normalizeAttendance(content()).items[0], id: `grupo-extra-${index}`
  }));
  await invalidRaw({ items: tooMany, itemIds: tooMany.map((line) => line.id) });
  await invalidRaw({ itemIds: ['grupo-1', 'grupo-1'] });
  await invalidRaw({ itemIds: ['id-incoerente', 'grupo-2'] });
  await invalidItem({ extra: true });
  const baseItem = normalizeAttendance(content()).items[0];
  for (const missingField of Object.keys(baseItem)) {
    const missing = { ...baseItem };
    delete missing[missingField];
    await invalidRaw({ items: [missing], itemIds: [baseItem.id] });
  }
  for (const [field, limit] of [
    ['description', 500], ['equipmentType', 120], ['equipmentRef', 120],
    ['sourceRef', 300], ['coverageSourceRef', 300], ['referenceVersion', 120],
    ['catalogId', 120], ['categoryCode', 120]
  ]) {
    await invalidItem({ [field]: 7 });
    await invalidItem({ [field]: 'x'.repeat(limit + 1) });
  }
  await invalidItem({ quantity: -1 });
  await invalidItem({ quantity: 0.5 });
  await invalidItem({ quantity: 1000001 });
  await invalidItem({ capacityBtu: 0 });
  await invalidItem({ capacityBtu: 18000.5 });
  await invalidItem({ unitPriceUnits4: -1 });
  await invalidItem({ unitPriceUnits4: '0' });
  await invalidItem({ unitPriceUnits4: NaN });
  await invalidItem({ unitPriceUnits4: Infinity });
  await invalidItem({ unitPriceUnits4: 10000000001 });
  await invalidItem({ sourceRef: '', unitPriceUnits4: 0, lineTotalUnits4: 0 });
  await invalidItem({ sourceRef: '   ', unitPriceUnits4: 0, lineTotalUnits4: 0 });
  await invalidItem({ referenceNature: 'nao_informada' });
  await invalidItem({ referenceNature: 'contratual_informada', catalogId: '', referenceVersion: '' });
  await invalidItem({ referenceNature: 'contratual_informada', catalogId: '   ', referenceVersion: 'v1' });
  await invalidItem({ lineTotalUnits4: 1 });
  await invalidItem({ lineTotalUnits4: 450000000000001 });
  await invalidItem({ quantity: null, lineTotalUnits4: 0 });
  await invalidItem({ coverage: 'incluido', coverageSourceRef: 'Cobertura sintética', lineTotalUnits4: 246912 });
  await invalidItem({ coverage: 'incluido', coverageSourceRef: '', lineTotalUnits4: 0 });
  await invalidItem({ coverage: 'incluido', coverageSourceRef: '   ', lineTotalUnits4: 0 });
  await invalidItem({
    coverage: 'incluido', coverageSourceRef: '', unitPriceUnits4: null,
    sourceRef: 'Origem apenas do preço', lineTotalUnits4: 0
  });
  await invalidItem({
    coverage: 'incluido', coverageSourceRef: 'Origem apenas da cobertura',
    sourceRef: '', lineTotalUnits4: 0
  });
  await invalidItem({
    coverage: 'incluido', coverageSourceRef: 'Cobertura sintética identificada',
    quantity: 1000000, unitPriceUnits4: 10000000000, lineTotalUnits4: 0
  });
  for (let index = 0; index < 4; index += 1) {
    const invalidAtIndex = structuredClone(maximum);
    invalidAtIndex.items[index].quantity = -1;
    await invalidRaw({ items: invalidAtIndex.items, itemIds: invalidAtIndex.itemIds, ticketIds: [] });
  }
  console.log('[PASSED] 7. escrita direta não contorna tipos, limites, origem, unicidade nem cálculo de todas as linhas');

  await assertFails(updateDoc(attendanceRef(dbA, first.id), {
    revision: latest.revision + 1, updatedAt: serverTimestamp()
  }));
  const existing = (await getDoc(attendanceRef(dbA, first.id))).data();
  await assertFails(writeWithSnapshot(dbA, {
    ...existing, schoolId: '03.12.002', revision: existing.revision + 1,
    updatedAt: serverTimestamp()
  }));
  await assertFails(writeWithSnapshot(dbA, {
    ...existing, revision: existing.revision + 2, updatedAt: serverTimestamp()
  }));
  await assertFails(writeWithSnapshot(dbA, {
    ...existing, createdAt: serverTimestamp(), revision: existing.revision + 1,
    updatedAt: serverTimestamp()
  }));
  await assertFails(setDoc(attendanceRef(dbA, 'sem-revisao'), rawRecord('sem-revisao')));
  const mismatched = rawRecord('revisao-divergente');
  const mismatchedBatch = writeBatch(dbA);
  mismatchedBatch.set(attendanceRef(dbA, mismatched.id), mismatched);
  mismatchedBatch.set(revisionRef(dbA, mismatched.id, 1), { ...mismatched, cycle: 'Snapshot adulterado' });
  await assertFails(mismatchedBatch.commit());
  await assertFails(updateDoc(revisionRef(dbA, first.id, 1), { cycle: 'Reescrito' }));
  await assertFails(deleteDoc(revisionRef(dbA, first.id, 1)));
  await assertFails(deleteDoc(attendanceRef(dbA, first.id)));
  await assertFails(setDoc(revisionRef(dbA, first.id, 99), { ...existing, revision: 99 }));
  const schoolCorrected = await sessionB.saveAttendance(content({
    schoolId: '03.12.002', ticketIds: ['GOP-AR-2026-0099'], visitId: '',
    sessionId: 'sessao-teste-B'
  }), { id: first.id, expectedRevision: existing.revision });
  assert.equal(schoolCorrected.id, first.id);
  assert.equal(schoolCorrected.schoolId, '03.12.002');
  assert.equal(schoolCorrected.createdAt, original.createdAt);
  assert.equal(schoolCorrected.revision, existing.revision + 1);
  assert.equal((await sessionA.loadAttendances()).filter(record => record.id === first.id).length, 1);
  assert.deepEqual((await sessionA.loadAttendanceRevisions(first.id)).at(-1), original);
  console.log('[PASSED] 8. correção de escola revalida vínculos; ID/criação e revisões atômicas, sequenciais e imutáveis são preservados');

  await assertSucceeds(getDoc(doc(dbA, 'escolas', '03.12.001')));
  await assertSucceeds(getDoc(doc(dbA, 'chamados', 'GOP-AR-2026-0001')));
  await assertFails(updateDoc(doc(dbA, 'escolas', '03.12.001'), { unidade_escolar: 'Modificada' }));
  await assertFails(updateDoc(doc(dbA, 'chamados', 'GOP-AR-2026-0001'), { designacao: '03.12.002' }));
  await assertFails(setDoc(doc(dbA, 'colecao_nao_permitida', 'x'), { qualquer: true }));
  await assertFails(getDoc(doc(dbA, 'colecao_nao_permitida', 'x')));
  console.log('[PASSED] 9. emulador financeiro mantém cadastros operacionais somente leitura e nega coleções fora do contrato');
  console.log('Persistência financeira validada no emulador isolado, com dados sintéticos e duas sessões sem login.');
} finally {
  await testEnv.cleanup();
}
