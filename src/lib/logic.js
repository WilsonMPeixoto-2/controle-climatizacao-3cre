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

import {
  CLOSED_STATUSES as DOMAIN_CLOSED_STATUSES,
  SUSPENDED_STATUSES as DOMAIN_SUSPENDED_STATUSES
} from '../domain/statuses.js';
import { normalizeSector as domainNormalizeSector } from '../domain/sectors.js';
import { normalizePriority as domainNormalizePriority } from '../domain/priorities.js';

/** Status que encerram o ciclo de um chamado — excluídos de TODOS os alertas. */
export const CLOSED_STATUSES = DOMAIN_CLOSED_STATUSES;

/** Status de suspensão — não é fechado, mas também não dispara alertas de SLA/Antiguidade. */
export const SUSPENDED_STATUSES = DOMAIN_SUSPENDED_STATUSES;

/**
 * Normaliza o texto de prioridade para comparação estável.
 * Trata variações de acento, caixa e espaços extras.
 */
export function normalizePriority(pri) {
  return domainNormalizePriority(pri);
}

/**
 * Normaliza o nome do setor responsável para comparação e exibição estável.
 * Trata variantes como "Unidade Escolar / GIN" unificando para "GIN / Unidade Escolar".
 */
export function normalizeSector(sector) {
  return domainNormalizeSector(sector);
}

/**
 * Sanitiza strings dinâmicas de dados livres contra injeções XSS em saídas HTML.
 */
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}




/** Limiares do Alerta de SLA (inércia: dias SEM movimentação). */
export const SLA_WARN_DAYS = 7; // âmbar
export const SLA_SEVERE_DAYS = 15; // vermelho

/**
 * Limiares do Alerta de Antiguidade (tempo TOTAL em aberto, desde a abertura).
 * Mede coisa diferente do SLA: um chamado pode estar atualizado recentemente
 * (SLA verde) e, ainda assim, estar aberto há tempo demais (antiguidade alta).
 * Tons de roxo, conforme o Excel. Faixas calibradas para o ritmo do POP-002/25.
 */
export const AGE_WARN_DAYS = 30; // roxo claro — em aberto há mais de 1 mês
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
  if (!isoStr) return '';
  const match = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
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

/** Chamado suspenso — não faz parte do ciclo ativo, mas não é "fechado". */
export function isSuspended(ticket) {
  return SUSPENDED_STATUSES.includes(ticket?.status_atual);
}

/** Chamado inativo para fins de contagem (fechado OU suspenso). */
export function isInactive(ticket) {
  return isClosed(ticket) || isSuspended(ticket);
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
  if (isClosed(ticket) || isSuspended(ticket)) return 'ok';
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
  if (isClosed(ticket) || isSuspended(ticket)) return 'ok';
  const d = ageDays(ticket, ref);
  if (d >= AGE_SEVERE_DAYS) return 'severe';
  if (d >= AGE_WARN_DAYS) return 'warning';
  return 'ok';
}

/**
 * Classifica a inatividade em faixas para distinguir os níveis de urgência.
 * Adiciona o nível "Crítico" para demandas paradas há mais de 60 dias.
 */
export function severidadeInatividade(dias) {
  if (dias >= 60) return { nivel: 'CRITICO', rotulo: 'Crítico — revisar caso', token: 'vermelho' };
  if (dias >= 15) return { nivel: 'ALTO',    rotulo: 'Vermelho',            token: 'vermelho' };
  if (dias >= 7)  return { nivel: 'ATENCAO', rotulo: 'Âmbar',               token: 'ambar' };
  return { nivel: 'OK', rotulo: 'Em dia', token: 'verde' };
}

/**
 * Compara dois chamados por urgência (estável e determinista).
 * 1º Inatividade decrescente -> 2º Antiguidade decrescente -> 3º Ordem alfabética de ID de chamado
 */
export function compararUrgencia(a, b, ref = new Date()) {
  const aInactivity = inactivityDays(a, ref);
  const bInactivity = inactivityDays(b, ref);
  const aAge = ageDays(a, ref);
  const bAge = ageDays(b, ref);
  
  return (bInactivity - aInactivity)
    || (bAge - aAge)
    || (a.id_chamado || '').localeCompare(b.id_chamado || '');
}

/**
 * Centraliza a regra de ordenação por urgência de chamados (estável e determinista).
 */
export function ordenarPorUrgencia(tickets, ref = new Date()) {
  return [...tickets].sort((a, b) => compararUrgencia(a, b, ref));
}


// ---------------------------------------------------------------------------
// Métricas agregadas (Painel)
// ---------------------------------------------------------------------------

export function computeMetrics(tickets, ref = new Date()) {
  const total = tickets.length;
  let open = 0,
    slaWarn = 0,
    slaSevere = 0,
    ageWarn = 0,
    ageSevere = 0,
    closed = 0;

  for (const t of tickets) {
    if (isClosed(t) || isSuspended(t)) {
      closed++;
      continue;
    }
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
    inactivePlus15: slaSevere, // vermelho
    // Antiguidade (tempo em aberto)
    agePlus30: ageWarn + ageSevere, // roxo claro OU pior
    agePlus60: ageSevere // roxo intenso
  };
}

/** Ranking dos N chamados ativos mais parados (maior inatividade primeiro). */
export function stuckRanking(tickets, ref = new Date(), n = 5) {
  const active = tickets.filter((t) => !isClosed(t) && !isSuspended(t));
  const sorted = ordenarPorUrgencia(active, ref);
  return sorted
    .map((t) => ({ ...t, inactivityDays: inactivityDays(t, ref), ageDays: ageDays(t, ref) }))
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Agrupamento por etapa do fluxo (legenda do Mapa Operacional)
// ---------------------------------------------------------------------------

/**
 * Mapeia um chamado a um dos 4 grupos do fluxo POP, a partir do número da etapa
 * em `status_atual` ("4 - Aguardando orçamento" → 4). Independe de data (ao
 * contrário do SLA), então a leitura por etapa é estável mesmo com dados antigos.
 *   triagem   → etapas 1–3 (recebido / vistoria)
 *   orcamento → etapas 4–5 (orçamento)
 *   execucao  → etapas 6–9 (adequação / execução)
 *   concluido → etapa 10/11 e "Suspenso / pendente" (ciclo encerrado)
 */
export function stageGroup(ticket) {
  if (isClosed(ticket) || isSuspended(ticket)) return 'concluido';
  const m = String(ticket?.status_atual || '').match(/^\s*(\d+)/);
  const s = m ? parseInt(m[1], 10) : 0;
  if (s >= 6) return 'execucao';
  if (s >= 4) return 'orcamento';
  return 'triagem';
}

/** Contagem de chamados por grupo de etapa. A soma é sempre tickets.length. */
export function stageGroupCounts(tickets) {
  const g = { triagem: 0, orcamento: 0, execucao: 0, concluido: 0 };
  for (const t of Array.isArray(tickets) ? tickets : []) g[stageGroup(t)]++;
  return g;
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
  // Tokeniza por '/' e compara o token EXATO (para todos os setores), evitando
  // falso-positivo por substring (ex.: 'CTO-NORTE' não casaria 'CTO'; 'GINASIO'
  // não casaria 'GIN'). Mantém o casamento de valores compostos como 'GIN / CPS'.
  return resp
    .split('/')
    .map((s) => s.trim())
    .includes(sector);
}

export function filterBySector(tickets, sector) {
  return tickets.filter((t) => ticketInSector(t, sector));
}

/** Indicadores próprios de uma visão de setor (para o cabeçalho da aba). */
export function sectorSummary(tickets, sector, ref = new Date()) {
  const subset = filterBySector(tickets, sector);
  const open = subset.filter((t) => !isClosed(t) && !isSuspended(t)).length;
  const stuck = subset.filter((t) => slaLevel(t, ref) !== 'ok').length;
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
  if (txt.includes('confirma')) return 'red'; // "Solicitar confirmação à unidade"
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
  const q = normalizeString(query);
  if (!q) return list.slice(0, limit);
  return list
    .filter(
      (s) =>
        normalizeString(s.unidade_escolar).includes(q) ||
        normalizeString(s.designacao).includes(q) ||
        normalizeString(s.sici).includes(q) ||
        normalizeString(s.bairro).includes(q)
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
    .replace(/{DATA}/g, dataStr)
    .replace(/{STATUS}/g, ticket.status_atual ?? '')
    .replace(/{SETOR}/g, ticket.setor_responsavel ?? '')
    .replace(/{PRIORIDADE}/g, ticket.prioridade ?? '')
    .replace(/{LOCAL_DEMANDA}/g, ticket.local_demanda ?? '')
    .replace(/{PROXIMA_PROVIDENCIA}/g, ticket.proxima_providencia ?? '')
    .replace(/{DESIGNACAO}/g, ticket.designacao ?? '');
}

// ---------------------------------------------------------------------------
// Normalização e Agregação por Bairro
// ---------------------------------------------------------------------------

/**
 * Normaliza strings para cruzamento estável de bairros/escolas usando regex Unicode seguro.
 * Remove acentos, espaços extras duplicados e padroniza para caixa baixa.
 */
export function normalizeString(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Cruza um registro (chamado OU evento de histórico) a uma escola usando a MESMA
 * regra leniente e normalizada do resto do sistema: igualdade de designação OU de
 * nome da unidade, sem acento/caixa/espaço. Evita que uma designação nula ou com
 * grafia divergente faça o registro sumir do dossiê — alinhado a aggregateBairroStats
 * e à Linha do Tempo do App. (Compara designação só quando ambas existem, para que
 * dois registros com designação vazia NÃO casem por engano.)
 */
export function matchesSchool(record, school) {
  if (!record || !school) return false;
  const recD = normalizeString(record.designacao);
  const schD = normalizeString(school.designacao);
  if (recD && schD && recD === schD) return true;
  const recU = normalizeString(record.unidade_escolar);
  const schU = normalizeString(school.unidade_escolar);
  return Boolean(recU && schU && recU === schU);
}

/**
 * Cruza chamados e escolas de forma dinâmica e gera estatísticas consolidadas por bairro.
 * Possui fallbacks por unidade escolar e órfãos seguros (bairro_desconhecido).
 */
export function aggregateBairroStats(tickets, schools, ref = new Date()) {
  const tks = Array.isArray(tickets) ? tickets : [];
  const schs = Array.isArray(schools) ? schools : [];

  const schoolByDesignacao = new Map();
  const schoolByNameNormalized = new Map();

  for (const s of schs) {
    if (s.designacao) {
      schoolByDesignacao.set(normalizeString(s.designacao), s);
    }
    if (s.unidade_escolar) {
      schoolByNameNormalized.set(normalizeString(s.unidade_escolar), s);
    }
  }

  const statsByBairro = new Map();

  // Inicializa todos os bairros das escolas cadastradas para garantir contagem de escolas (mesmo com 0 chamados)
  for (const s of schs) {
    const bairro = s.bairro || 'Desconhecido';
    const normalized = normalizeString(bairro);
    if (!statsByBairro.has(normalized)) {
      statsByBairro.set(normalized, {
        nome_exibicao: bairro,
        escolas_cadastradas: 0,
        chamados_ativos: 0,
        criticos: 0,
        atencao: 0,
        chamados_lista: []
      });
    }
    statsByBairro.get(normalized).escolas_cadastradas++;
  }

  // Agrega chamados ativos nos bairros
  for (const t of tks) {
    // Cruza chamado com escola correspondente (Regra -> Fallback)
    let matchedSchool = null;
    if (t.designacao) {
      matchedSchool = schoolByDesignacao.get(normalizeString(t.designacao));
    }
    if (!matchedSchool && t.unidade_escolar) {
      matchedSchool = schoolByNameNormalized.get(normalizeString(t.unidade_escolar));
    }

    const bairro = matchedSchool?.bairro || 'Desconhecido';
    const normalized = normalizeString(bairro);

    if (!statsByBairro.has(normalized)) {
      statsByBairro.set(normalized, {
        nome_exibicao: bairro,
        escolas_cadastradas: 0,
        chamados_ativos: 0,
        criticos: 0,
        atencao: 0,
        chamados_lista: []
      });
    }

    const bairroStats = statsByBairro.get(normalized);

    if (!isClosed(t) && !isSuspended(t)) {
      bairroStats.chamados_ativos++;

      const sla = slaLevel(t, ref);
      const age = ageLevel(t, ref);

      const isSevere = sla === 'severe' || age === 'severe';
      const isWarning = sla === 'warning' || age === 'warning';

      if (isSevere) {
        bairroStats.criticos++;
      } else if (isWarning) {
        bairroStats.atencao++;
      }

      bairroStats.chamados_lista.push({
        id_chamado: t.id_chamado,
        unidade_escolar: t.unidade_escolar,
        status_atual: t.status_atual,
        setor_responsavel: t.setor_responsavel,
        prioridade: t.prioridade,
        inactivityDays: inactivityDays(t, ref),
        ageDays: ageDays(t, ref),
        isCritical: isSevere,
        isWarning: isWarning
      });
    }
  }

  const result = {};
  for (const [key, value] of statsByBairro.entries()) {
    result[key] = value;
  }
  return result;
}
