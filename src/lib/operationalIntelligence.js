/**
 * src/lib/operationalIntelligence.js
 * 
 * Lógica pura e determinística para gerar resumos de inteligência operacional
 * e filas de ações prioritárias no Controle de Climatização GOP / 3ª CRE.
 */

import { isClosed, isSuspended, inactivityDays, aggregateBairroStats, normalizePriority } from './logic.js';

/**
 * Retorna o score de urgência de um chamado com base nos critérios estabelecidos:
 * - Prioridade Crítica: +50, Alta: +35, Média: +15, Baixa: 0
 * - Inatividade: +30 dias: +40, +15 dias: +25, +7 dias: +10
 * - Aguardando CTO: +15
 * - Aguardando Escola: +10
 * - Chamado sem anexo: +8
 * - Informação não validada: +8
 */
export function calculateUrgencyScore(ticket, allAttachments = [], ref = new Date()) {
  if (!ticket) return 0;
  let score = 0;

  // 1. Prioridade
  const pri = String(ticket.prioridade || '').trim().toLowerCase();
  if (pri === 'crítica' || pri === 'critica') score += 50;
  else if (pri === 'alta') score += 35;
  else if (pri === 'média' || pri === 'media') score += 15;

  // 2. Inatividade
  const inact = inactivityDays(ticket, ref);
  if (inact >= 30) score += 40;
  else if (inact >= 15) score += 25;
  else if (inact >= 7) score += 10;

  // 3. Status Aguardando CTO
  const statusLower = (ticket.status_atual || '').toLowerCase();
  if ((statusLower.includes('cto') || statusLower.startsWith('5 ')) && ticket.comunicacao_cto !== 'Sim') {
    score += 15;
  }

  // 4. Status Aguardando Escola
  const provLower = (ticket.proxima_providencia || '').toLowerCase();
  if (provLower.includes('aguardando escola') || provLower.includes('aguardando retorno da unidade') || statusLower.includes('aguardando escola')) {
    score += 10;
  }

  // 5. Chamado ativo sem anexo
  const hasAttachments = allAttachments.some(a => a.id_chamado === ticket.id_chamado);
  if (!hasAttachments && !isClosed(ticket)) {
    score += 8;
  }

  // 6. Informação não validada
  if (ticket.informacao_validada === 'Pendente de Vistoria') {
    score += 8;
  }

  return score;
}

/**
 * Gera o diagnóstico geral do resumo diário.
 */
export function getOperationalSummary(tickets, schools, allAttachments, ref = new Date()) {
  const activeTks = tickets.filter(t => !isClosed(t) && !isSuspended(t));
  const totalActive = activeTks.length;

  const criticalCount = activeTks.filter(t => { const p = normalizePriority(t.prioridade); return p === 'Crítica' || p === 'Alta'; }).length;
  const stuckCount = activeTks.filter(t => inactivityDays(t, ref) >= 15).length;

  // Concentração por bairros
  const statsBairro = aggregateBairroStats(tickets, schools, ref);
  const sortedBairros = Object.values(statsBairro)
    .filter(b => b.chamados_ativos > 0)
    .sort((a, b) => b.chamados_ativos - a.chamados_ativos);
  
  const topBairros = sortedBairros.slice(0, 2).map(b => b.nome_exibicao);

  // Seleciona até 3 chamados para recomendação baseados no score de urgência
  const prioritizedTickets = [...activeTks]
    .map(t => ({
      id_chamado: t.id_chamado,
      score: calculateUrgencyScore(t, allAttachments, ref)
    }))
    .filter(item => item.score > 0) // Recomenda apenas se houver pontuação de urgência > 0
    .sort((a, b) => b.score - a.score || a.id_chamado.localeCompare(b.id_chamado))
    .slice(0, 3)
    .map(item => item.id_chamado);

  return {
    totalActive,
    criticalCount,
    stuckCount,
    topBairros,
    prioritizedTickets
  };
}

/**
 * Gera a fila de ações urgentes ("O que exige ação agora").
 * Retorna no máximo 5 itens de pendências ordenadas por score de urgência decrescente,
 * sem duplicar o mesmo chamado em múltiplas ações.
 */
export function getActionItems(tickets, schools, allAttachments = [], ref = new Date()) {
  const items = [];
  const processedTickets = new Set();

  // Filtragem e ordenação dos chamados elegíveis (ativos ou concluídos sem fechamento)
  // Ordena os chamados pelo score para processar os mais urgentes primeiro
  const eligibleTickets = tickets
    .filter(t => (!isClosed(t) && !isSuspended(t)) || t.status_atual === '10 - Concluído')
    .map(t => ({
      ticket: t,
      score: calculateUrgencyScore(t, allAttachments, ref)
    }))
    .sort((a, b) => b.score - a.score || a.ticket.id_chamado.localeCompare(b.ticket.id_chamado));

  for (const item of eligibleTickets) {
    const t = item.ticket;
    if (processedTickets.has(t.id_chamado)) continue; // Evita duplicar chamados com múltiplos gatilhos
    const statusLower = (t.status_atual || '').toLowerCase();
    const provLower = (t.proxima_providencia || '').toLowerCase();

    // Regra 1: Chamado crítico/alto ativo sem anexo
    const np = normalizePriority(t.prioridade);
    if (!isClosed(t) && !isSuspended(t) && (np === 'Crítica' || np === 'Alta')) {
      const hasAttachments = allAttachments.some(a => a.id_chamado === t.id_chamado);
      if (!hasAttachments) {
        items.push({
          id: `crit-no-attach-${t.id_chamado}`,
          ticket: t,
          type: 'attachment',
          title: 'Anexar evidência técnica',
          description: `Chamado ${np.toLowerCase()} sem laudo, foto ou documento vinculado no chamado ${t.id_chamado}.`,
          actionLabel: 'Anexar documento',
          score: item.score
        });
        processedTickets.add(t.id_chamado);
        continue;
      }
    }

    // Regra 2: Inatividade há +15 dias
    const inactDays = inactivityDays(t, ref);
    if (!isClosed(t) && !isSuspended(t) && inactDays >= 15) {
      items.push({
        id: `stuck-15-${t.id_chamado}`,
        ticket: t,
        type: 'stuck',
        title: 'Atualizar andamento',
        description: `O chamado ${t.id_chamado} está há ${inactDays} dias sem movimentação registrada.`,
        actionLabel: 'Abrir chamado',
        score: item.score
      });
      processedTickets.add(t.id_chamado);
      continue;
    }

    // Regra 3: Aguardando CTO
    if (!isClosed(t) && !isSuspended(t) && ((statusLower.includes('cto') || statusLower.startsWith('5 ')) && t.comunicacao_cto !== 'Sim')) {
      items.push({
        id: `cto-pending-${t.id_chamado}`,
        ticket: t,
        type: 'cto',
        title: 'Gerar comunicação para CTO',
        description: `Demanda aguardando providência da CTO no chamado ${t.id_chamado}.`,
        actionLabel: 'Minutar e-mail',
        score: item.score
      });
      processedTickets.add(t.id_chamado);
      continue;
    }

    // Regra 4: Aguardando retorno da escola
    if (!isClosed(t) && !isSuspended(t) && (provLower.includes('aguardando escola') || provLower.includes('aguardando retorno da unidade') || statusLower.includes('aguardando escola'))) {
      items.push({
        id: `school-pending-${t.id_chamado}`,
        ticket: t,
        type: 'school',
        title: 'Solicitar retorno da unidade escolar',
        description: `Chamado depende de informação complementar da escola no chamado ${t.id_chamado}.`,
        actionLabel: 'Minutar e-mail',
        score: item.score
      });
      processedTickets.add(t.id_chamado);
      continue;
    }

    // Regra 5: Concluído sem encerramento (status_atual === '10 - Concluído')
    if (t.status_atual === '10 - Concluído') {
      items.push({
        id: `concl-no-close-${t.id_chamado}`,
        ticket: t,
        type: 'completion',
        title: 'Encerrar chamado concluído',
        description: `Demanda marcada como concluída, mas ainda não encerrada no chamado ${t.id_chamado}.`,
        actionLabel: 'Abrir chamado',
        score: item.score
      });
      processedTickets.add(t.id_chamado);
      continue;
    }
  }

  // Retorna no máximo as 5 ações mais urgentes baseadas no score recalculado
  return items
    .sort((a, b) => b.score - a.score || a.ticket.id_chamado.localeCompare(b.ticket.id_chamado))
    .slice(0, 5);
}
