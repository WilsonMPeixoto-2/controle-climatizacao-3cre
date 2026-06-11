/**
 * escolasService.js — Isolamento de chamadas Supabase para dados de Unidades Escolares.
 */

export async function fetchEscolas(supabaseClient) {
  if (!supabaseClient) throw new Error('Base online não conectada.');
  
  const { data, error } = await supabaseClient
    .from('escolas')
    .select('*')
    .order('unidade_escolar');

  if (error) throw error;
  return data || [];
}
