/**
 * aptidao.js — Definição canônica dos resultados de aptidão técnica das escolas.
 */

export const APTIDAO = Object.freeze({
  APTA: 'Apta',
  APTA_PARCIALMENTE: 'Apta parcialmente',
  NAO_APTA: 'Não apta',
  PENDENTE: 'Pendente'
});

export const APTIDAO_LIST = Object.freeze(Object.values(APTIDAO));

/**
 * Normaliza o valor de aptidão técnica.
 */
export function normalizeAptidao(value) {
  const val = String(value || '').trim();
  if (!val) return APTIDAO.PENDENTE;
  
  const lower = val.toLowerCase();
  if (lower === 'apta') return APTIDAO.APTA;
  if (lower === 'não apta' || lower === 'nao apta') return APTIDAO.NAO_APTA;
  if (lower === 'apta parcialmente' || lower === 'parcialmente apta') return APTIDAO.APTA_PARCIALMENTE;
  
  return APTIDAO.PENDENTE;
}
