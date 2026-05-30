/**
 * logic.js — Núcleo de regras de negócio do Controle de Climatização (GOP / 3ª CRE).
 *
 * Funções PURAS, sem React e sem DOM, para que possam ser testadas em Node.
 * Toda a aritmética de datas/alertas/visões vive aqui; o App.jsx apenas consome.
 *
 * Princípio de projeto: toda função que depende de "hoje" aceita um parâmetro
 * opcional `ref` (Date). Em produção, App.jsx chama sem o parâmetro (usa a data
 * real do dia). Nos testes, passa-se uma data fixa para resultados determinísticos.
 */

// ---------------------------------------------------------------------------
// Constantes de domínio
// ---------------------------------------------------------------------------

/** Status que encerram o ciclo de um chamado — excluídos de TODOS os alertas. */
export const CLOSED_STATUSES = ['10 - Concluído', '11 - Encerrado', 'Suspenso / pendente'];

/** Limiares do Alerta de SLA (inércia: dias SEM movimentação). */
export const SLA_WARN_DAYS = 7;   // âmbar
export const SLA_SEVERE_DAYS = 15; // vermelho

/**
 * Limiares do Alerta de Antiguidade (tempo TOTAL em aberto, desde a abertura).
 * Mede coisa diferente do SLA: um chamado pode estar atualizado recentemente
 * (SLA verde) e, ainda assim, estar aberto há tempo demais (antiguidade alta).
 * Tons de roxo, conforme o Excel. Faixas calibradas para o ritmo do POP-002/25.
 */
export const AGE_WARN_DAYS = 30;   // roxo claro — em aberto há mais de 1 mês
export const AGE_SEVERE_DAYS = 60; // roxo intenso — em aberto há mais de 2 meses

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

/** Converte um valor ISO em Date; retorna null se inválido/ausente. */
export function toDate(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Diferença em dias inteiros entre `ref` (hoje, por padrão) e uma data ISO.
 * Retorna 0 para datas ausentes/inválidas. Nunca negativa.
 */
export function diffDays(isoStr, ref = new Date()) {
  const d = toDate(isoStr);
  if (!d) return 0;
  const diff = ref.getTime() - d.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Formata uma data ISO para o padrão brasileiro (dd/mm/aaaa). */
export function formatDateBrazilian(isoStr) {
  const d = toDate(isoStr);
  if (!d) return isoStr || '';
  return d.toLocaleDateString('pt-BR');
}

// ---------------------------------------------------------------------------
// Cálculos por chamado
// ---------------------------------------------------------------------------

export function isClosed(ticket) {
  return CLOSED_STATUSES.includes(ticket?.status_atual);
}

/** Dias SEM movimentação (inatividade), a partir de `modificado_em`. */
export function inactivityDays(ticket, ref = new Date()) {
  return diffDays(ticket?.modificado_em, ref);
}

/** Dias TOTAIS em aberto, a partir de `criado_em` (ou `data_solicitacao`). */
export function ageDays(ticket, ref = new Date()) {
  const opened = ticket?.criado_em || ticket?.data_solicitacao;
  return diffDays(opened, ref);
}

/**
 * Alerta de SLA (inércia). Retorna 'severe' | 'warning' | 'ok'.
 * Chamados encerrados nunca disparam alerta.
 */
export function slaLevel(ticket, ref = new Date()) {
  if (isClosed(ticket)) return 'ok';
  const d = inactivityDays(ticket, ref);
  if (d >= SLA_SEVERE_DAYS) return 'severe';
  if (d >= SLA_WARN_DAYS) return 'warning';
  return 'ok';
}

/**
 * Alerta de Antiguidade (tempo total em aberto). Retorna 'severe' | 'warning' | 'ok'.
 * Chamados encerrados nunca disparam alerta — senão um chamado concluído há meses
 * apareceria eternamente como "antigo".
 */
export function ageLevel(ticket, ref = new Date()) {
  if (isClosed(ticket)) return 'ok';
  const d = ageDays(ticket, ref);
  if (d >= AGE_SEVERE_DAYS) return 'severe';
  if (d >= AGE_WARN_DAYS) return 'warning';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Métricas agregadas (Painel)
// ---------------------------------------------------------------------------

export function computeMetrics(tickets, ref = new Date()) {
  const total = tickets.length;
  let open = 0, slaWarn = 0, slaSevere = 0, ageWarn = 0, ageSevere = 0, closed = 0;

  for (const t of tickets) {
    if (isClosed(t)) { closed++; continue; }
    open++;
    const s = slaLevel(t, ref);
    if (s === 'severe') slaSevere++;
    else if (s === 'warning') slaWarn++;
    const a = ageLevel(t, ref);
    if (a === 'severe') ageSevere++;
    else if (a === 'warning') ageWarn++;
  }

  return {
    total,
    open,
    closed,
    // SLA (inércia)
    inactivePlus7: slaWarn + slaSevere, // âmbar OU pior
    inactivePlus15: slaSevere,          // vermelho
    // Antiguidade (tempo em aberto)
    agePlus30: ageWarn + ageSevere,     // roxo claro OU pior
    agePlus60: ageSevere,               // roxo intenso
  };
}

/** Ranking dos N chamados ativos mais parados (maior inatividade primeiro). */
export function stuckRanking(tickets, ref = new Date(), n = 5) {
  return tickets
    .filter(t => !isClosed(t))
    .map(t => ({ ...t, inactivityDays: inactivityDays(t, ref), ageDays: ageDays(t, ref) }))
    .sort((a, b) => b.inactivityDays - a.inactivityDays)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Visões por setor (Bloco C)
// ---------------------------------------------------------------------------

/**
 * Setores reais presentes nos dados operacionais. A ordem define a exibição.
 * Observação: o Excel cita "CTIN", mas os chamados usam GIN/CPS — então as
 * visões seguem os setores que de fato ocorrem, para nenhuma nascer vazia.
 */
export const SECTORS = ['GOP', 'GIN', 'CPS', 'CTO'];

/** Um chamado "pertence" a um setor se o nome aparece em `setor_responsavel`. */
export function ticketInSector(ticket, sector) {
  const resp = ticket?.setor_responsavel || '';
  if (sector === 'GOP') {
    // GOP é frequentemente o dono isolado; trata tanto "GOP" exato quanto composto.
    return resp.split('/').map(s => s.trim()).includes('GOP');
  }
  return resp.includes(sector);
}

export function filterBySector(tickets, sector) {
  return tickets.filter(t => ticketInSector(t, sector));
}

/** Indicadores próprios de uma visão de setor (para o cabeçalho da aba). */
export function sectorSummary(tickets, sector, ref = new Date()) {
  const subset = filterBySector(tickets, sector);
  const open = subset.filter(t => !isClosed(t)).length;
  const stuck = subset.filter(t => slaLevel(t, ref) !== 'ok').length;
  return { sector, total: subset.length, open, closed: subset.length - open, stuck };
}

// ---------------------------------------------------------------------------
// Cadastro vivo das escolas — Ação Sugerida colorida (Bloco A)
// ---------------------------------------------------------------------------

/**
 * Deriva a cor da "Ação Sugerida" a partir do estado de validação da escola.
 * Retorna 'red' | 'amber' | 'green', conforme o manual:
 *   vermelho  → falta a confirmação da unidade;
 *   âmbar     → confirmada, mas há necessidade de instalação pendente;
 *   verde     → inventário em dia (confirmado e sem necessidade aberta).
 *
 * Usa os campos reais do db.json: `confirmado_pela_unidade`, `validado_pela_gop`,
 * `necessidade_aparelhos` e, como reforço, o texto de `acao_sugerida`.
 */
export function suggestedActionColor(school) {
  if (!school) return 'green';

  const txt = String(school.acao_sugerida || '').toLowerCase();
  const confirmed = isTruthyFlag(school.confirmado_pela_unidade);
  const need = Number(school.necessidade_aparelhos) || 0;

  // Sinais textuais explícitos têm prioridade (robustez a dados legados).
  if (txt.includes('confirma')) return 'red';      // "Solicitar confirmação à unidade"
  if (txt.includes('instal') || txt.includes('necessidade')) return 'amber';

  if (!confirmed) return 'red';
  if (need > 0) return 'amber';
  return 'green';
}

/** Interpreta flags que podem vir como boolean, "Sim"/"Não", "true"/"false". */
export function isTruthyFlag(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'sim' || s === 'true' || s === '1' || s === 'x';
}

// ---------------------------------------------------------------------------
// Modelos de e-mail — substituição de variáveis
// ---------------------------------------------------------------------------

/**
 * Filtra a lista de escolas por um termo de busca (case-insensitive), comparando
 * nome da unidade, designação, SICI e bairro. Termo vazio devolve a lista inteira.
 * Resultado limitado a `limit` itens (default 8) para a caixa de sugestões.
 */
export function searchSchools(schools, query, limit = 8) {
  const list = Array.isArray(schools) ? schools : [];
  const q = String(query || '').trim().toLowerCase();
  if (!q) return list.slice(0, limit);
  return list
    .filter(s =>
      String(s.unidade_escolar || '').toLowerCase().includes(q) ||
      String(s.designacao || '').toLowerCase().includes(q) ||
      String(s.sici || '').toLowerCase().includes(q) ||
      String(s.bairro || '').toLowerCase().includes(q)
    )
    .slice(0, limit);
}

/**
 * Compila um modelo de e-mail substituindo as variáveis {ID_CHAMADO},
 * {UNIDADE} e {DATA}. `dateRef` é a data a usar quando o chamado não tiver
 * `modificado_em` (em produção, hoje).
 */
export function compileEmailTemplate(templateText, ticket, dateRef = new Date()) {
  if (!templateText) return '';
  if (!ticket) return templateText;
  const dataStr = formatDateBrazilian(ticket.modificado_em || dateRef.toISOString());
  return templateText
    .replace(/{ID_CHAMADO}/g, ticket.id_chamado ?? '')
    .replace(/{UNIDADE}/g, ticket.unidade_escolar ?? '')
    .replace(/{DATA}/g, dataStr);
}
