import {
  VISIT_DRAFT_KEY, VISIT_RECOVERY_KEY,
  createVisitBackup, parseStoredVisitDrafts
} from './schoolVisitPlan.js';

export const VISIT_LOCK_NAME = 'gop-clima-visit-drafts-v1';

/**
 * Serializa operações cooperativas entre abas da mesma origem usando Web Locks.
 * Falha fechada quando a API não existe; localStorage isolado não é transacional.
 * O snapshot esperado e o registro efetivo são verificados dentro do lock.
 */
export async function persistVisitDraft({ storage, locks, expectedRaw, rows, saveRecovery = false }) {
  if (!locks?.request) throw new Error('Este navegador não permite gravação protegida entre abas. Use um navegador compatível.');
  const backup = createVisitBackup(rows); // verifica tamanho antes do lock
  const parsed = JSON.parse(backup).rows;
  return locks.request(VISIT_LOCK_NAME, { mode: 'exclusive' }, () => {
    const currentRaw = storage.getItem(VISIT_DRAFT_KEY);
    if (currentRaw !== expectedRaw) return { status: 'conflict' };
    if (saveRecovery && currentRaw !== null) storage.setItem(VISIT_RECOVERY_KEY, currentRaw);
    const serialized = JSON.stringify(parsed);
    storage.setItem(VISIT_DRAFT_KEY, serialized);
    return { status: 'saved', raw: serialized, rows: parsed, createdRecovery: saveRecovery && currentRaw !== null };
  });
}

export function loadVisitSnapshot(storage) {
  const raw = storage.getItem(VISIT_DRAFT_KEY);
  return { raw, rows: parseStoredVisitDrafts(raw) };
}
export function readVisitRecovery(storage) {
  const raw = storage.getItem(VISIT_RECOVERY_KEY);
  return raw === null ? null : { raw, rows: parseStoredVisitDrafts(raw) };
}
