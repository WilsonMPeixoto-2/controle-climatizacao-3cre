import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { normalizeSector } from '../../domain/sectors.js';

const COLLECTIONS = Object.freeze({
  schools: 'escolas',
  tickets: 'chamados',
  history: 'historico',
  emailTemplates: 'modelos_email',
  counters: 'contadores'
});

const omitUndefined = (record) => Object.fromEntries(
  Object.entries(record || {}).filter(([, value]) => value !== undefined)
);

const docsToRows = (snapshot) => snapshot.docs.map((item) => item.data());

const normalizeTicket = (ticket) => ({
  ...ticket,
  setor_responsavel: normalizeSector(ticket?.setor_responsavel)
});

const parseReferenceYear = (ticketRecord, fallbackDate) => {
  const candidate = ticketRecord?.data_solicitacao || fallbackDate;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? new Date(fallbackDate).getFullYear() : parsed.getFullYear();
};

const formatTicketId = (year, sequence) => `GOP-AR-${year}-${String(sequence).padStart(4, '0')}`;

async function fetchOrdered(db, collectionName, field, direction = 'asc') {
  const snapshot = await getDocs(query(collection(db, collectionName), orderBy(field, direction)));
  return docsToRows(snapshot);
}

/**
 * Implementação Firestore do contrato neutro de persistência.
 * Não inclui Storage/anexos nesta fase Spark.
 */
export function createFirestorePersistence(db, { now = () => new Date().toISOString() } = {}) {
  if (!db) throw new Error('Firestore não inicializado.');

  return {
    provider: 'firestore',
    capabilities: Object.freeze({
      realtime: true,
      attachments: false,
      offlineOfficialWrites: false
    }),

    async loadInitialData() {
      const [schools, tickets, history, emailTemplates] = await Promise.all([
        fetchOrdered(db, COLLECTIONS.schools, 'unidade_escolar', 'asc'),
        fetchOrdered(db, COLLECTIONS.tickets, 'id_chamado', 'desc'),
        fetchOrdered(db, COLLECTIONS.history, 'data', 'desc'),
        fetchOrdered(db, COLLECTIONS.emailTemplates, 'id', 'asc')
      ]);

      return {
        schools,
        tickets: tickets.map(normalizeTicket),
        history,
        emailTemplates
      };
    },

    async createTicketWithHistory(ticketRecord, initialEvent) {
      if (!initialEvent?.id_evento) {
        throw new Error('Evento inicial sem id_evento.');
      }

      const operationTime = now();
      const year = parseReferenceYear(ticketRecord, operationTime);
      const yearText = String(year);
      const counterRef = doc(db, COLLECTIONS.counters, `chamados-${yearText}`);

      return runTransaction(db, async (transaction) => {
        const counterSnapshot = await transaction.get(counterRef);
        const current = counterSnapshot.exists()
          ? Number(counterSnapshot.data()?.ultimoNumero || 0)
          : 0;
        const next = current + 1;
        const ticketId = formatTicketId(yearText, next);
        const ticketRef = doc(db, COLLECTIONS.tickets, ticketId);
        const historyRef = doc(db, COLLECTIONS.history, initialEvent.id_evento);

        // Timestamps de criação são definidos pelo adapter para manter o vínculo
        // transacional auditável entre chamado e contador, independentemente da UI.
        const finalTicket = omitUndefined({
          ...ticketRecord,
          id_chamado: ticketId,
          criado_em: operationTime,
          modificado_em: operationTime
        });
        const finalEvent = omitUndefined({
          ...initialEvent,
          id_chamado: ticketId
        });

        transaction.set(counterRef, {
          ano: yearText,
          ultimoNumero: next,
          ultimoId: ticketId,
          atualizado_em: operationTime
        });
        transaction.set(ticketRef, finalTicket);
        transaction.set(historyRef, finalEvent);

        return {
          ticket: normalizeTicket(finalTicket),
          event: finalEvent
        };
      });
    },

    async updateTicketWithHistory(updatedRecord, events = []) {
      if (!updatedRecord?.id_chamado) {
        throw new Error('Chamado sem id_chamado.');
      }

      const batch = writeBatch(db);
      const finalTicket = omitUndefined({
        ...updatedRecord,
        modificado_em: updatedRecord.modificado_em || now()
      });
      batch.set(
        doc(db, COLLECTIONS.tickets, updatedRecord.id_chamado),
        finalTicket,
        { merge: true }
      );

      for (const event of events) {
        if (!event?.id_evento) throw new Error('Evento de histórico sem id_evento.');
        batch.set(doc(db, COLLECTIONS.history, event.id_evento), omitUndefined(event));
      }

      await batch.commit();
      return normalizeTicket(finalTicket);
    },

    async insertHistoryEvent(event) {
      if (!event?.id_evento) throw new Error('Evento de histórico sem id_evento.');
      const finalEvent = omitUndefined(event);
      await setDoc(doc(db, COLLECTIONS.history, event.id_evento), finalEvent);
      return finalEvent;
    },

    subscribeOperationalData({ onTickets, onHistory, onError } = {}) {
      const ticketsQuery = query(
        collection(db, COLLECTIONS.tickets),
        orderBy('id_chamado', 'desc')
      );
      const historyQuery = query(
        collection(db, COLLECTIONS.history),
        orderBy('data', 'desc')
      );

      const unsubscribeTickets = onSnapshot(
        ticketsQuery,
        (snapshot) => onTickets?.(docsToRows(snapshot).map(normalizeTicket)),
        (error) => onError?.(error)
      );
      const unsubscribeHistory = onSnapshot(
        historyQuery,
        (snapshot) => onHistory?.(docsToRows(snapshot)),
        (error) => onError?.(error)
      );

      return () => {
        unsubscribeTickets();
        unsubscribeHistory();
      };
    }
  };
}

export { formatTicketId, parseReferenceYear };
