/**
 * sectors.js — Definição canônica dos setores responsáveis pela resolução dos chamados.
 */

export const SECTORS = Object.freeze({
  GOP: 'GOP',
  CPS: 'CPS',
  GIN: 'GIN',
  CTO: 'CTO',
  CTIN: 'CTIN',
  UNIDADE_ESCOLAR: 'Unidade Escolar',
  GIN_UNIDADE_ESCOLAR: 'GIN / Unidade Escolar',
  CPS_UNIDADE_ESCOLAR: 'CPS / Unidade Escolar',
  GIN_CPS: 'GIN / CPS',
  COMP: 'COMP',
  GMP: 'GMP'
});

export const SECTOR_LIST = Object.freeze(Object.values(SECTORS));

// Aliases históricos ou divergentes para garantir normalização estável
export const SECTOR_ALIASES = Object.freeze({
  'Unidade Escolar / GIN': SECTORS.GIN_UNIDADE_ESCOLAR,
  'GIN / Unidade': SECTORS.GIN_UNIDADE_ESCOLAR,
  'CPS / Unidade': SECTORS.CPS_UNIDADE_ESCOLAR
});

/**
 * Normaliza o nome do setor responsável para comparação e exibição estável.
 * Trata variantes como "Unidade Escolar / GIN" unificando para "GIN / Unidade Escolar".
 */
export function normalizeSector(sector) {
  const sec = String(sector || '').trim();
  return SECTOR_ALIASES[sec] || sec;
}
