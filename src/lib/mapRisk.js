/**
 * mapRisk.js — Índice de Risco Territorial (IRT) por bairro.
 *
 * Camada PURA (sem React, sem DOM, sem Leaflet) que transforma os dados já
 * agregados por aggregateBairroStats em uma leitura GERENCIAL por bairro:
 *
 *   - risco  : média dos K piores scores de urgência do bairro (K = min(3, n)).
 *              Mede INTENSIDADE ("quão grave é o pior do bairro"), imune a
 *              distorção por volume: 10 chamados leves NÃO superam 2 críticos.
 *   - nivel  : classe discreta para o mapa (critico | alto | moderado |
 *              vigilancia | em-dia | sem-cobertura).
 *   - pressao: banda de VOLUME (0–3) usada como opacidade de preenchimento.
 *              Volume vira presença visual, nunca cor.
 *   - densidade, temCritico, topOfensores: leitura de apoio (tooltip/painel).
 *
 * Fonte única de pesos: calculateUrgencyScore (operationalIntelligence.js).
 * Fonte única de cruzamento chamado↔escola↔bairro: aggregateBairroStats (logic.js).
 * Determinístico: aceita data de referência injetável (padrão do projeto).
 */
import { aggregateBairroStats } from './logic.js';
import { calculateUrgencyScore } from './operationalIntelligence.js';

/**
 * Limiares do IRT, calibrados sobre os pesos reais de calculateUrgencyScore
 * no contexto do mapa (sem dados de anexos => todo ativo carrega +8 uniforme):
 *   Crítica parada 15d  = 50+25+8 = 83  -> CRÍTICO
 *   Alta parada 30d     = 35+40+8 = 83  -> CRÍTICO (negligência prolongada)
 *   Crítica em andamento= 50+ 0+8 = 58  -> ALTO   (grave, mas andando)
 *   Alta parada 15d     = 35+25+8 = 68  -> ALTO
 *   Média parada 7d     = 15+10+8 = 33  -> MODERADO
 *   Leve recém-movida   =  0– 23       -> VIGILÂNCIA
 */
export const RISK_THRESHOLDS = Object.freeze({
  CRITICO: 75,
  ALTO: 50,
  MODERADO: 25
});

export const RISK_LEVELS = Object.freeze([
  'critico',
  'alto',
  'moderado',
  'vigilancia',
  'em-dia',
  'sem-cobertura'
]);

/** Quantos piores chamados sustentam o nível do bairro. */
export const TOP_K = 3;

/**
 * Classifica o score do bairro em nível discreto.
 * @param {number} risco - média dos top-K scores (0 quando não há ativos)
 * @param {number} ativos - chamados ativos do bairro
 * @param {number} escolas - escolas cadastradas do bairro
 * @returns {string} um de RISK_LEVELS
 */
export function riskLevel(risco, ativos, escolas) {
  if (!ativos || ativos <= 0) {
    return escolas > 0 ? 'em-dia' : 'sem-cobertura';
  }
  if (risco >= RISK_THRESHOLDS.CRITICO) return 'critico';
  if (risco >= RISK_THRESHOLDS.ALTO) return 'alto';
  if (risco >= RISK_THRESHOLDS.MODERADO) return 'moderado';
  return 'vigilancia';
}

/**
 * Banda de volume (pressão) usada como degrau de opacidade do preenchimento.
 * @param {number} ativos
 * @returns {0|1|2|3}
 */
export function pressureBand(ativos) {
  if (!ativos || ativos <= 0) return 0;
  if (ativos <= 2) return 1;
  if (ativos <= 5) return 2;
  return 3;
}

/**
 * Calcula o IRT de todos os bairros.
 *
 * @param {Array<object>} tickets  - chamados crus (mesma entrada do mapa hoje)
 * @param {Array<object>} schools  - escolas cruas
 * @param {object}  [opts]
 * @param {Array<object>} [opts.attachments=[]] - anexos (opcional; sem eles o
 *        termo "+8 sem anexo" aplica-se uniformemente aos ativos e NÃO altera
 *        a ordenação relativa entre bairros)
 * @param {Date}    [opts.ref=new Date()] - data de referência injetável
 * @returns {Object<string, object>} mapa bairroNormalizado -> {
 *   nome_exibicao, escolas_cadastradas, chamados_ativos, criticos, atencao,
 *   risco, nivel, pressao, densidade, temCritico,
 *   topOfensores: [{ id_chamado, unidade_escolar, score, inactivityDays }]
 * }
 */
export function computeBairroRisk(tickets, schools, opts = {}) {
  const { attachments = [], ref = new Date() } = opts;

  const stats = aggregateBairroStats(tickets, schools, ref);

  // Índice id_chamado -> ticket cru, para pontuar com a função oficial
  const ticketById = new Map();
  for (const t of Array.isArray(tickets) ? tickets : []) {
    if (t && t.id_chamado != null) ticketById.set(String(t.id_chamado), t);
  }

  const result = {};

  for (const [bairroNorm, b] of Object.entries(stats)) {
    const scored = [];
    for (const item of b.chamados_lista || []) {
      const raw = ticketById.get(String(item.id_chamado));
      if (!raw) continue; // defensivo: lista e fonte sempre coerentes, mas não quebra
      scored.push({
        id_chamado: item.id_chamado,
        unidade_escolar: item.unidade_escolar,
        inactivityDays: item.inactivityDays,
        score: calculateUrgencyScore(raw, attachments, ref)
      });
    }

    scored.sort((a, b2) => b2.score - a.score);

    const k = Math.min(TOP_K, scored.length);
    const risco =
      k === 0
        ? 0
        : Math.round(
            (scored.slice(0, k).reduce((acc, s) => acc + s.score, 0) / k) * 10
          ) / 10;

    const ativos = b.chamados_ativos || 0;
    const escolas = b.escolas_cadastradas || 0;

    result[bairroNorm] = {
      nome_exibicao: b.nome_exibicao,
      escolas_cadastradas: escolas,
      chamados_ativos: ativos,
      criticos: b.criticos || 0,
      atencao: b.atencao || 0,
      risco,
      nivel: riskLevel(risco, ativos, escolas),
      pressao: pressureBand(ativos),
      densidade: Math.round((ativos / Math.max(1, escolas)) * 100) / 100,
      temCritico: scored.length > 0 && scored[0].score >= RISK_THRESHOLDS.CRITICO,
      topOfensores: scored.slice(0, 3),
      chamados_lista: b.chamados_lista || []
    };
  }

  return result;
}

/**
 * Resumo executivo do território (legenda com contadores e aria-live).
 * @param {Object<string, object>} riskByBairro - saída de computeBairroRisk
 * @returns {{critico:number, alto:number, moderado:number, vigilancia:number,
 *            bairrosComDemanda:number, totalAtivos:number, piorBairro: ?object}}
 */
export function buildRiskSummary(riskByBairro) {
  const sum = {
    critico: 0,
    alto: 0,
    moderado: 0,
    vigilancia: 0,
    bairrosComDemanda: 0,
    totalAtivos: 0,
    piorBairro: null
  };
  for (const b of Object.values(riskByBairro || {})) {
    if (b.chamados_ativos > 0) {
      sum.bairrosComDemanda++;
      sum.totalAtivos += b.chamados_ativos;
      if (sum[b.nivel] != null) sum[b.nivel]++;
      if (!sum.piorBairro || b.risco > sum.piorBairro.risco) sum.piorBairro = b;
    }
  }
  return sum;
}

/**
 * Seleciona os bairros que recebem rótulo permanente no mapa:
 * os N piores por risco, desde que nível >= alto.
 * @param {Object<string, object>} riskByBairro
 * @param {number} [n=3]
 * @returns {Array<[string, object]>} pares [bairroNormalizado, dados]
 */
export function topRiskBairros(riskByBairro, n = 3) {
  return Object.entries(riskByBairro || {})
    .filter(([, b]) => b.nivel === 'critico' || b.nivel === 'alto')
    .sort((a, b) => b[1].risco - a[1].risco)
    .slice(0, n);
}
