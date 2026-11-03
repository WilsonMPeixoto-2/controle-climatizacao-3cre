import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { normalizeAttendance } from '../../domain/attendanceEstimate.js';

const ATTENDANCES = 'atendimentos_economicos';
const REVISIONS = 'revisoes';
const VALID_ID = /^[A-Za-z0-9_.:-]{1,128}$/;

const asIsoDate = (value) => value?.toDate?.().toISOString() ?? null;

const toRecord = (snapshot) => {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return {
    ...data,
    createdAt: asIsoDate(data.createdAt),
    updatedAt: asIsoDate(data.updatedAt)
  };
};

const toRecords = (snapshot) => snapshot.docs.map(toRecord);

const conflictError = (expectedRevision, actualRevision) => Object.assign(
  new Error('Este atendimento mudou em outra sessão. Reabra a versão atual antes de salvar.'),
  { code: 'attendance/conflict', expectedRevision, actualRevision }
);

/**
 * Fronteira de persistência financeira. A configuração de desenvolvimento
 * conecta este adapter ao emulador isolado; autorização individual é futura
 * (DP-004). Responsável informado e sessão não comprovam identidade.
 */
export function createAttendancePersistence(db) {
  if (!db) throw new Error('Firestore não inicializado.');

  const attendancesQuery = query(collection(db, ATTENDANCES), orderBy('updatedAt', 'desc'));

  return {
    async loadAttendances() {
      return toRecords(await getDocs(attendancesQuery));
    },

    subscribeAttendances({ onData, onError } = {}) {
      return onSnapshot(
        attendancesQuery,
        (snapshot) => onData?.(toRecords(snapshot)),
        (error) => onError?.(error)
      );
    },

    async saveAttendance(content, { id, expectedRevision = 0 } = {}) {
      if (id !== undefined && (typeof id !== 'string' || !VALID_ID.test(id))) {
        throw new Error('Identificador de atendimento inválido.');
      }
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
        throw new Error('Versão esperada de atendimento inválida.');
      }
      if (!id && expectedRevision !== 0) {
        throw new Error('Informe o atendimento para atualizar uma versão existente.');
      }

      const normalized = normalizeAttendance(content);
      const attendanceRef = id
        ? doc(db, ATTENDANCES, id)
        : doc(collection(db, ATTENDANCES));

      try {
        await runTransaction(db, async (transaction) => {
          const previous = await transaction.get(attendanceRef);
          const actualRevision = previous.exists() ? previous.data().revision : 0;
          if (actualRevision !== expectedRevision) {
            throw conflictError(expectedRevision, actualRevision);
          }

          const record = {
            ...normalized,
            id: attendanceRef.id,
            revision: actualRevision + 1,
            createdAt: previous.exists() ? previous.data().createdAt : serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          transaction.set(attendanceRef, record);
          transaction.set(doc(attendanceRef, REVISIONS, `v${record.revision}`), record);
        });
      } catch (error) {
        // Uma disputa pode ser recusada pelas rules CAS antes de o SDK
        // receber aborted/reexecutar a transação. Confirme a revisão atual
        // para oferecer o mesmo contrato de conflito, sem repetir a escrita.
        if (error.code === 'permission-denied' || error.code === 'aborted') {
          const current = await getDoc(attendanceRef);
          const actualRevision = current.exists() ? current.data().revision : 0;
          if (actualRevision !== expectedRevision) {
            throw conflictError(expectedRevision, actualRevision);
          }
        }
        throw error;
      }

      // Ler a revisão imutável devolve exatamente esta gravação, mesmo se
      // outra sessão salvar a revisão seguinte antes desta releitura.
      return toRecord(await getDoc(doc(
        attendanceRef,
        REVISIONS,
        `v${expectedRevision + 1}`
      )));
    },

    async loadAttendanceRevisions(id) {
      if (typeof id !== 'string' || !VALID_ID.test(id)) {
        throw new Error('Identificador de atendimento inválido.');
      }
      const revisionsQuery = query(
        collection(db, ATTENDANCES, id, REVISIONS),
        orderBy('revision', 'desc')
      );
      return toRecords(await getDocs(revisionsQuery));
    }
  };
}
