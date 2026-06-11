/**
 * chamadosService.js — Isolamento de chamadas Supabase para dados de chamados (tickets).
 */

import { normalizeSector } from '../domain/sectors.js';

export async function fetchChamados(supabaseClient) {
  if (!supabaseClient) throw new Error('Base online não conectada.');

  const { data, error } = await supabaseClient
    .from('chamados')
    .select('*')
    .order('id_chamado', { ascending: false });

  if (error) throw error;

  // Normaliza os setores de forma consistente
  return (data || []).map((t) => ({
    ...t,
    setor_responsavel: normalizeSector(t.setor_responsavel)
  }));
}

export async function createTicketWithHistory(supabaseClient, ticketRecord, initialEvent) {
  if (!supabaseClient) throw new Error('Base online não conectada.');

  const { data, error } = await supabaseClient.rpc(
    'create_ticket_with_history',
    {
      p_ticket: ticketRecord,
      p_event: initialEvent
    }
  );

  if (error) throw error;
  if (!data) throw new Error('Nenhum registro retornado pelo banco após salvar.');

  return {
    ticket: data,
    event: {
      ...initialEvent,
      id_chamado: data.id_chamado
    }
  };
}

export async function updateTicketWithHistory(supabaseClient, updatedRecord, novosEventos) {
  if (!supabaseClient) throw new Error('Base online não conectada.');

  const { data, error } = await supabaseClient.rpc(
    'save_ticket_with_history',
    {
      p_ticket: updatedRecord,
      p_events: novosEventos
    }
  );

  if (error) throw error;
  if (!data) throw new Error('Não foi retornado nenhum registro após salvar.');

  return data;
}
