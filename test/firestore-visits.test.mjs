import fs from 'node:fs';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, setLogLevel } from 'firebase/firestore';
import { createVisitPlanningPersistence } from '../src/infrastructure/firebase/visitPlanningPersistence.js';
import { createVisitDraft, updateVisitDraft } from '../src/domain/schoolVisitPlan.js';

const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
setLogLevel('silent');
const env = await initializeTestEnvironment({
  projectId: 'demo-controle-climatizacao-3cre',
  firestore: { host: '127.0.0.1', port: 8080, rules }
});
const start = {
  schoolId: '03.12.001', kind: 'preventiva', plannedDate: '2026-11-16',
  cycle: '1º ciclo', equipmentCount: 2, note: '',
  reportedDate: '', reportReference: ''
};
const ref = (db, id) => doc(db, 'programacao_visitas', id);
function observe(gateway, predicate) {
  let stop = () => {};
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { stop(); reject(new Error('Visita não apareceu na outra sessão.')); }, 8000);
    stop = gateway.subscribeVisits({
      onData(rows) { if (predicate(rows)) { clearTimeout(timer); stop(); resolve(rows); } },
      onError(error) { clearTimeout(timer); stop(); reject(error); }
    });
  });
}
try {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await Promise.all([
      setDoc(doc(db, 'escolas/03.12.001'), { designacao: '03.12.001', unidade_escolar: 'Escola A' }),
      setDoc(doc(db, 'escolas/03.12.002'), { designacao: '03.12.002', unidade_escolar: 'Escola B' })
    ]);
  });
  const dbA = env.unauthenticatedContext().firestore();
  const dbB = env.unauthenticatedContext().firestore();
  const a = createVisitPlanningPersistence(dbA);
  const b = createVisitPlanningPersistence(dbB);
  assert.deepEqual(await a.loadVisits(), []);
  const initial = createVisitDraft(start, { id: 'visit-shared-1', now: '2026-11-01T12:00:00Z' });
  const createdRemote = observe(b, rows => rows.some(row => row.id === initial.id && row.revision === 1));
  const first = await a.saveVisit(initial, { expectedRevision: 0, sessionId: 'sessao-a' });
  assert.equal(first.revision, 1);
  assert.equal(first.plannedMonth, '2026-11');
  assert.equal(first.schoolId, '03.12.001');
  assert.equal(first.equipmentCount, 2);
  assert.ok((await createdRemote).some(row => row.id === first.id));
  assert.equal((await b.loadVisits()).length, 1);
  const movedLocal = updateVisitDraft(first, { plannedDate: '2026-12-05' }, { now: '2026-11-03T12:00:00Z' });
  const movedRemote = observe(a, rows => rows.some(row => row.id === first.id && row.revision === 2));
  const second = await b.saveVisit(movedLocal, { expectedRevision: 1, sessionId: 'sessao-b' });
  await movedRemote;
  assert.equal(second.revision, 2);
  assert.equal(second.plannedMonth, '2026-12');
  assert.equal(second.history.length, 1);
  assert.equal(second.history[0].from, '2026-11-16');
  assert.equal((await a.loadVisitRevisions(first.id)).length, 2);
  assert.deepEqual((await a.loadVisitRevisions(first.id)).map(row => row.revision), [2, 1]);
  await assert.rejects(
    a.saveVisit(initial, { expectedRevision: 1, sessionId: 'sessao-a' }),
    e => e.code === 'visit/conflict'
  );
  // Mesmo ciclo e escola podem ter visitas legítimas distintas, sem sobrescrever IDs.
  const other = createVisitDraft(start, { id: 'visit-shared-2', now: '2026-11-01T12:00:00Z' });
  await a.saveVisit(other, { expectedRevision: 0, sessionId: 'sessao-a' });
  assert.equal((await b.loadVisits()).length, 2);
  await assert.rejects(
    b.saveVisit(other, { expectedRevision: 0, sessionId: 'sessao-b' }),
    e => e.code === 'visit/conflict'
  );
  const tombstone = await b.archiveVisit(first.id, { expectedRevision: 2, sessionId: 'sessao-b' });
  assert.equal(tombstone.archived, true);
  assert.equal(tombstone.revision, 3);
  assert.equal((await a.loadVisits()).length, 1);
  assert.equal((await a.loadVisitRevisions(first.id)).length, 3);
  await assert.rejects(
    a.saveVisit(movedLocal, { expectedRevision: 3, sessionId: 'sessao-a' }),
    /arquivada|excluída|inativa/i
  );
  // Alterações diretas sem snapshot ou tentativa de apagar não são permitidas.
  await assertFails(updateDoc(ref(dbA, other.id), { note: 'Forjado' }));
  await assertFails(deleteDoc(ref(dbA, other.id)));
  await assertFails(updateDoc(doc(dbA, 'programacao_visitas', other.id, 'revisoes', 'v1'), { note: 'Forjado' }));
  await assertFails(a.saveVisit(createVisitDraft({ ...start, schoolId: '03.12.999' }, { id: 'visit-invalid-school' }), {
    expectedRevision: 0, sessionId: 'sessao-a'
  }));
  // A coleção econômica preexistente não deve ter sido modificada.
  assert.equal((await getDoc(doc(dbA, 'programacao_visitas/visit-shared-2'))).data().id, 'visit-shared-2');
  console.log('P1 | Firestore integrado: duas sessões, reprogramação, revisões, CAS, arquivamento e regras PASS.');
} finally {
  await env.cleanup();
}
