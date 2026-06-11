/**
 * priorities.js — Definição canônica das prioridades de chamados.
 */

export const PRIORITIES = Object.freeze({
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica'
});

export const PRIORITY_LIST = Object.freeze(Object.values(PRIORITIES));

/**
 * Normaliza a prioridade para garantir que esteja dentro das opções canônicas.
 */
export function normalizePriority(priority) {
  const p = String(priority || '')
    .trim()
    .toLowerCase();
  if (p === 'crítica' || p === 'critica') return PRIORITIES.CRITICA;
  if (p === 'alta') return PRIORITIES.ALTA;
  if (p === 'média' || p === 'media') return PRIORITIES.MEDIA;
  if (p === 'baixa') return PRIORITIES.BAIXA;
  return PRIORITIES.MEDIA;
}
