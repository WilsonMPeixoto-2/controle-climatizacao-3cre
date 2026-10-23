import { fetchEscolas } from '../../services/escolasService.js';
import { fetchHistorico, insertHistoryEvent as insertHistory } from '../../services/historicoService.js';
import {
  fetchChamados,
  createTicketWithHistory as createTicket,
  updateTicketWithHistory as updateTicket
} from '../../services/chamadosService.js';

const ensureClient = (client) => {
  if (!client) throw new Error('Base online não conectada.');
  return client;
};

async function fetchEmailTemplates(client) {
  const { data, error } = await client
    .from('modelos_email')
    .select('*')
    .order('id');

  if (error) throw error;
  return data || [];
}

/**
 * Adapter transitório do Supabase para o contrato neutro de persistência.
 *
 * A UI não deve depender de `.from()`, `.rpc()`, `.channel()` ou outras APIs
 * específicas do Supabase. Durante a migração, somente este adapter conhece
 * esses detalhes. O Firestore implementará o mesmo contrato.
 */
export function createSupabasePersistence(supabaseClient) {
  const client = ensureClient(supabaseClient);

  return {
    provider: 'supabase',
    capabilities: Object.freeze({
      realtime: true,
      attachments: true,
      offlineOfficialWrites: false
    }),

    async loadInitialData() {
      const [schools, tickets, history, emailTemplates] = await Promise.all([
        fetchEscolas(client),
        fetchChamados(client),
        fetchHistorico(client),
        fetchEmailTemplates(client)
      ]);

      return { schools, tickets, history, emailTemplates };
    },

    createTicketWithHistory(ticketRecord, initialEvent) {
      return createTicket(client, ticketRecord, initialEvent);
    },

    updateTicketWithHistory(updatedRecord, events) {
      return updateTicket(client, updatedRecord, events);
    },

    insertHistoryEvent(event) {
      return insertHistory(client, event);
    },

    subscribeOperationalData({ onTickets, onHistory, onError } = {}) {
      let active = true;
      let timer;

      const refresh = async () => {
        try {
          const [tickets, history] = await Promise.all([
            fetchChamados(client),
            fetchHistorico(client)
          ]);
          if (!active) return;
          onTickets?.(tickets);
          onHistory?.(history);
        } catch (error) {
          if (active) onError?.(error);
        }
      };

      const scheduleRefresh = () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 400);
      };

      const channel = client
        .channel('gop-chamados-historico')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'historico' }, scheduleRefresh)
        .subscribe();

      return () => {
        active = false;
        clearTimeout(timer);
        client.removeChannel(channel);
      };
    },

    /**
     * Exceção transitória e deliberada: anexos ainda usam Supabase Storage.
     * Não utilizar para novos recursos. Será removida no cutover Spark.
     */
    getLegacyAttachmentClient() {
      return client;
    }
  };
}
