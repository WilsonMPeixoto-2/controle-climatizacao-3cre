import {
  collection, doc, getDoc, getDocs, onSnapshot, orderBy,
  query, runTransaction, serverTimestamp
} from 'firebase/firestore';
import { monthOf, validateVisitRows } from '../../domain/schoolVisitPlan.js';

const COLLECTION = 'programacao_visitas';
const REVISIONS = 'revisoes';
const ID = /^[A-Za-z0-9_.:-]{1,128}$/;
const toIso = value => value?.toDate?.().toISOString() ?? null;
const recordFromSnapshot = snapshot => {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return { ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) };
};
const rowsFromSnapshot = snapshot => snapshot.docs.map(recordFromSnapshot).filter(row => !row.archived);
const conflict = (expectedRevision, actualRevision) => Object.assign(
  new Error('Esta visita foi alterada em outra sessão. Recarregue a programação antes de salvar.'),
  { code: 'visit/conflict', expectedRevision, actualRevision }
);
const requireId = value => {
  if (typeof value !== 'string' || !ID.test(value)) throw new Error('Identificador da visita inválido.');
  return value;
};

/**
 * Persistência compartilhada em coleção independente de atendimentos e chamados.
 * Cada atualização tem revisão esperada e snapshot imutável atômico. Sem login
 * individual nesta etapa (DP-004), sessionId é diagnóstico, NÃO autoria.
 */
export function createVisitPlanningPersistence(db) {
  if (!db) throw new Error('Firestore de programação não inicializado.');
  const visits = collection(db, COLLECTION);
  const visitsQuery = query(visits, orderBy('updatedAt', 'desc'));

  async function writeVisit(row, { expectedRevision = 0, sessionId = 'sessao-sem-login', archive = false } = {}) {
    requireId(row?.id);
    requireId(sessionId);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      throw new Error('Versão esperada da visita inválida.');
    }
    const valid = validateVisitRows([row])[0];
    if (valid.history.length > 80) throw new Error('Histórico extenso: exporte a programação antes de continuar.');
    const ref = doc(visits, valid.id);
    try {
      await runTransaction(db, async transaction => {
        const previous = await transaction.get(ref);
        const old = previous.exists() ? previous.data() : null;
        const actualRevision = old?.revision ?? 0;
        if (actualRevision !== expectedRevision) throw conflict(expectedRevision, actualRevision);
        if (old?.archived) throw new Error('Esta visita está arquivada e não pode ser alterada.');
        if (archive && !old) throw new Error('Visita não encontrada para arquivamento.');

        const record = {
          id: valid.id,
          schoolId: valid.schoolId,
          plannedDate: valid.plannedDate,
          plannedMonth: monthOf(valid.plannedDate),
          kind: valid.kind,
          cycle: valid.cycle,
          equipmentCount: valid.equipmentCount,
          note: valid.note,
          reportedDate: valid.reportedDate,
          reportReference: valid.reportReference,
          history: valid.history,
          revision: actualRevision + 1,
          sessionId,
          archived: archive,
          createdAt: old ? old.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        transaction.set(ref, record);
        transaction.set(doc(ref, REVISIONS, 'v' + record.revision), record);
      });
    } catch (error) {
      if (error.code === 'permission-denied' || error.code === 'aborted') {
        const current = await getDoc(ref);
        const actualRevision = current.exists() ? current.data().revision : 0;
        if (actualRevision !== expectedRevision) throw conflict(expectedRevision, actualRevision);
      }
      throw error;
    }
    return recordFromSnapshot(await getDoc(doc(ref, REVISIONS, 'v' + (expectedRevision + 1))));
  }

  return {
    async loadVisits() {
      return rowsFromSnapshot(await getDocs(visitsQuery));
    },
    subscribeVisits({ onData, onError } = {}) {
      return onSnapshot(visitsQuery,
        snapshot => onData?.(rowsFromSnapshot(snapshot)),
        error => onError?.(error)
      );
    },
    saveVisit(row, options) { return writeVisit(row, options); },
    async archiveVisit(id, { expectedRevision, sessionId } = {}) {
      requireId(id);
      const current = await getDoc(doc(visits, id));
      if (!current.exists()) throw new Error('Visita não encontrada.');
      return writeVisit(recordFromSnapshot(current), { expectedRevision, sessionId, archive: true });
    },
    async loadVisitRevisions(id) {
      requireId(id);
      const revisions = query(collection(db, COLLECTION, id, REVISIONS), orderBy('revision', 'desc'));
      return (await getDocs(revisions)).docs.map(recordFromSnapshot);
    }
  };
}
