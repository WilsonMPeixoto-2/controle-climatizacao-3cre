/**
 * src/lib/schoolDossier.js
 * 
 * Helpers puros para gerar a Ficha Executiva Editorial e o Dossiê
 * da Unidade Escolar no Controle de Climatização GOP / 3ª CRE.
 */

import { isClosed, isSuspended, inactivityDays, normalizePriority } from './logic.js';

/**
 * Calcula o percentual de climatização das salas de aula.
 * Retorna null se não houver salas cadastradas ou se o total de salas for zero.
 */
export function calculateCoveragePercent(school) {
  if (!school) return null;
  const totalSalas = Number(school.qtd_salas_de_aula || 0);
  const salasClimatizadas = Number(school.aparelhos_em_sala || 0);
  
  if (totalSalas <= 0) return null;
  return Math.min(100, Math.round((salasClimatizadas / totalSalas) * 100));
}

/**
 * Retorna o status de climatização geral da escola: 'critica', 'atencao' ou 'regular'.
 */
export function getSchoolClimateStatus(school, activeTickets, coveragePercent, refDate = new Date()) {
  if (!school) return 'regular';

  // 1. Condições de Situação Crítica
  // a) Qualquer chamado ativo com prioridade "Crítica" ou "Alta"
  const hasCriticalActiveTicket = activeTickets.some(t => {
    const p = normalizePriority(t.prioridade);
    return p === 'Crítica' || p === 'Alta';
  });

  // b) Percentual de climatização inferior a 30%
  const isCoverageCritical = coveragePercent !== null && coveragePercent < 30;

  // c) Necessidade estimada > 0 E chamado ativo sem movimentação há +15 dias
  const hasStuckActiveTicketWithNeed = Number(school.necessidade_aparelhos || 0) > 0 && activeTickets.some(t => {
    return inactivityDays(t, refDate) >= 15;
  });

  if (hasCriticalActiveTicket || isCoverageCritical || hasStuckActiveTicketWithNeed) {
    return 'critica';
  }

  // 2. Condições de Situação Em Atenção
  // a) Existe chamado ativo
  const hasActiveTickets = activeTickets.length > 0;

  // b) Não confirmado pela unidade
  const notConfirmed = school.confirmado_pela_unidade !== 'Sim';

  // c) Não validado pela GOP
  const notValidated = school.validado_pela_gop !== 'Sim';

  // d) Há salas sem aparelho
  const hasRoomsWithoutAppliances = Number(school.salas_sem_aparelho || 0) > 0;

  // e) Há necessidade estimada de aparelhos
  const hasEstimatedNeed = Number(school.necessidade_aparelhos || 0) > 0;

  // f) Percentual de climatização abaixo de 70%
  const isCoverageAttention = coveragePercent !== null && coveragePercent < 70;

  if (hasActiveTickets || notConfirmed || notValidated || hasRoomsWithoutAppliances || hasEstimatedNeed || isCoverageAttention) {
    return 'atencao';
  }

  // 3. Situação Regular
  return 'regular';
}

/**
 * Agrega e calcula todos os dados necessários para o Dossiê Executivo da escola.
 */
export function getSchoolDossierData({ school, tickets, history, schoolLogs, refDate = new Date() }) {
  if (!school) return null;

  const schoolTickets = tickets.filter(t => t.designacao === school.designacao);
  const activeTickets = schoolTickets.filter(t => !isClosed(t) && !isSuspended(t));
  const closedTickets = schoolTickets.filter(t => isClosed(t) || isSuspended(t));

  const criticalTickets = activeTickets.filter(t => {
    const p = normalizePriority(t.prioridade);
    return p === 'Crítica' || p === 'Alta';
  });

  const coveragePercent = calculateCoveragePercent(school);
  const status = getSchoolClimateStatus(school, activeTickets, coveragePercent, refDate);

  // Encontra o último andamento (evento mais recente da escola no histórico ou anotações)
  const dbEvents = history.filter(h => h.designacao === school.designacao);
  const localList = schoolLogs[school.designacao] || [];
  
  const allEvents = [
    ...dbEvents.map(e => ({ data: e.data, description: e.marco_relevante })),
    ...localList.map(n => ({ data: n.date, description: n.content }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  const latestUpdate = allEvents.length > 0 ? allEvents[0] : null;

  // Encontra o chamado ativo mais antigo
  const oldestActiveTicket = activeTickets.length > 0
    ? [...activeTickets].sort((a, b) => new Date(a.data_solicitacao) - new Date(b.data_solicitacao))[0]
    : null;

  return {
    coveragePercent,
    status,
    activeCount: activeTickets.length,
    closedCount: closedTickets.length,
    criticalCount: criticalTickets.length,
    latestUpdate,
    oldestActiveTicket,
    activeTickets,
    schoolTickets
  };
}
