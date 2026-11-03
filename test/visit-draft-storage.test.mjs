import assert from 'node:assert/strict';
import {
  VISIT_DRAFT_KEY, VISIT_RECOVERY_KEY, createVisitDraft, createVisitBackup,
  parseVisitBackup, MAX_VISIT_BACKUP_BYTES, parseStoredVisitDrafts
} from '../src/domain/schoolVisitPlan.js';
import { persistVisitDraft, loadVisitSnapshot, readVisitRecovery } from '../src/domain/visitDraftStorage.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: key => { map.delete(key); },
    clear: () => map.clear()
  };
}
function serializedLock() {
  let last = Promise.resolve();
  return { request: (name, options, callback) => {
    assert.equal(name, 'gop-clima-visit-drafts-v1');
    assert.equal(options.mode, 'exclusive');
    const task = last.then(callback);
    last = task.then(() => undefined, () => undefined);
    return task;
  } };
}
const makeVisit = (id, schoolId = '001') => createVisitDraft(
  { schoolId, kind: 'preventiva', plannedDate: '2026-11-05' },
  { id, now: '2026-11-02T12:00:00Z' }
);
const storage = makeStorage();
const locks = serializedLock();
assert.deepEqual(loadVisitSnapshot(storage), { raw: null, rows: [] });
const a = makeVisit('a'), b = makeVisit('b','002');
// Cada aba começou do mesmo snapshot. Sob o lock, só uma grava.
const [first, second] = await Promise.all([
  persistVisitDraft({ storage, locks, expectedRaw: null, rows: [a] }),
  persistVisitDraft({ storage, locks, expectedRaw: null, rows: [b] })
]);
assert.equal(first.status, 'saved');
assert.equal(second.status, 'conflict');
assert.deepEqual(loadVisitSnapshot(storage).rows, [a]);
assert.equal(storage.getItem(VISIT_RECOVERY_KEY), null);
const current = loadVisitSnapshot(storage);
const updated = await persistVisitDraft({
  storage, locks, expectedRaw: current.raw, rows: [a,b]
});
assert.equal(updated.status, 'saved');
assert.deepEqual(parseStoredVisitDrafts(storage.getItem(VISIT_DRAFT_KEY)), [a,b]);
const restored = await persistVisitDraft({
  storage, locks, expectedRaw: updated.raw, rows: [b], saveRecovery: true
});
assert.equal(restored.status, 'saved');
assert.deepEqual(readVisitRecovery(storage).rows, [a,b]);
assert.deepEqual(loadVisitSnapshot(storage).rows, [b]);
// Restaurar a versão anterior preserva a versão atual como nova recuperação.
const undo = await persistVisitDraft({
  storage, locks, expectedRaw: restored.raw, rows: readVisitRecovery(storage).rows, saveRecovery: true
});
assert.equal(undo.status,'saved');
assert.deepEqual(loadVisitSnapshot(storage).rows, [a,b]);
assert.deepEqual(readVisitRecovery(storage).rows, [b]);
await assert.rejects(
  persistVisitDraft({ storage, locks: undefined, expectedRaw: undo.raw, rows: [] }),
  /gravação protegida/
);
assert.deepEqual(loadVisitSnapshot(storage).rows, [a,b]);
// A primeira leitura pode falhar sem apagar o conteúdo persistido.
const broken = { getItem: () => { throw new Error('storage denied'); } };
assert.throws(() => loadVisitSnapshot(broken), /storage denied/);
assert.equal(createVisitBackup([a,b]).length < MAX_VISIT_BACKUP_BYTES, true);
assert.deepEqual(parseVisitBackup(createVisitBackup([a,b])), [a,b]);
assert.equal(storage.getItem(VISIT_DRAFT_KEY) !== null, true);
console.log('E3 | Web Locks: concorrência, conflito, recuperação e leitura segura passaram.');
