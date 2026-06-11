/**
 * statuses.js — Definição canônica dos status de chamados (12 Etapas POP).
 * Centraliza a taxonomia compartilhada entre Banco de Dados, Validação, UI e Testes.
 */

export const STATUSES = Object.freeze({
  RECEBIDO: '1 - Recebido — em triagem',
  VISTORIA: '2 - Em vistoria técnica',
  VISTORIA_CONCLUIDA: '3 - Vistoria concluída — pendente laudo',
  AGUARDANDO_ORCAMENTO: '4 - Aguardando orçamento',
  ORCAMENTO_ANALISE: '5 - Orçamento em análise/decisão',
  AGUARDANDO_ADEQUACAO: '6 - Aguardando adequação elétrica',
  ADEQUACAO_EXECUCAO: '7 - Adequação em execução',
  ADEQUACAO_CONCLUIDA: '8 - Adequação concluída',
  AGUARDANDO_APARELHO: '9 - Aguardando aparelho/instalação',
  CONCLUIDO: '10 - Concluído',
  ENCERRADO: '11 - Encerrado',
  SUSPENSO: 'Suspenso / pendente'
});

export const STATUS_LIST = Object.freeze(Object.values(STATUSES));

export const CLOSED_STATUSES = Object.freeze([
  STATUSES.CONCLUIDO,
  STATUSES.ENCERRADO
]);

export const SUSPENDED_STATUSES = Object.freeze([
  STATUSES.SUSPENSO
]);

export function isClosed(status) {
  return CLOSED_STATUSES.includes(status);
}

export function isSuspended(status) {
  return SUSPENDED_STATUSES.includes(status);
}

// Mapeamento de rótulos antigos/divergentes do frontend para os valores canônicos do banco
export const STATUS_ALIASES = Object.freeze({
  '3 - Vistoria concluída': STATUSES.VISTORIA_CONCLUIDA,
  '6 - Recurso / remanejamento': STATUSES.AGUARDANDO_ADEQUACAO,
  '8 - Autorizado — CTO acionada': STATUSES.ADEQUACAO_CONCLUIDA
});

/**
 * Normaliza o status para garantir compatibilidade com o banco de dados.
 */
export function normalizeStatus(status) {
  const val = String(status || '').trim();
  return STATUS_ALIASES[val] || val;
}
