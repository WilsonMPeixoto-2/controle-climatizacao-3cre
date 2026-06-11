/**
 * historicoService.js — Isolamento de chamadas Supabase para dados de histórico (linha do tempo).
 */

export async function fetchHistorico(supabaseClient) {
  if (!supabaseClient) throw new Error('Base online não conectada.');

  const { data, error } = await supabaseClient
    .from('historico')
    .select('*')
    .order('data', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertHistoryEvent(supabaseClient, newEvent) {
  if (!supabaseClient) throw new Error('Base online não conectada.');

  const { data, error } = await supabaseClient
    .from('historico')
    .insert([newEvent])
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
