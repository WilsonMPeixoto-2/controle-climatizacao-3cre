/**
 * GOP Clima — Etapa 2 — consulta de REFERÊNCIA contratual (E1, fundação).
 *
 * Funções puras: não acessam Firestore nem modificam chamados, notas, pagamentos ou histórico.
 * Nenhuma tabela de preços está embutida neste arquivo. Um catálogo só é consultável
 * quando explicitamente validado e acompanhado de fonte e versão.
 *
 * ATENÇÃO: preço de categoria ≠ valor medido ≠ valor devido ≠ pagamento.
 * Tipo e BTUs podem identificar categoria, mas não demonstram, sozinhos,
 * a cobertura de um serviço corretivo nem sua elegibilidade para faturamento.
 */

export const REFERENCE_STATUS = Object.freeze({
  PENDING_CATALOG: 'catalogo_pendente',
  PENDING_EQUIPMENT: 'dados_tecnicos_pendentes',
  PENDING_SCOPE: 'validacao_escopo_pendente',
  UNMATCHED: 'categoria_nao_identificada',
  AMBIGUOUS: 'catalogo_ambiguo',
  INVALID_CATALOG: 'catalogo_inconsistente',
  IDENTIFIED: 'referencia_identificada',
  OUTSIDE_CONFIRMED: 'fora_do_escopo_confirmado'
});

/**
 * Reconhece apenas tipos explícitos: desconhecido permanece desconhecido.
 * Não confundir Split, Cassete e Piso-Teto.
 */
export function normalizeEquipmentType(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  const aliases = {
    ACJ: 'ACJ',
    JANELA: 'ACJ',
    'AR DE JANELA': 'ACJ',
    SPLIT: 'SPLIT',
    CASSETE: 'CASSETE',
    CASSETTE: 'CASSETE',
    'PISO TETO': 'PISO TETO'
  };
  return aliases[text] || null;
}

/**
 * Aceita inteiro numérico ou texto decimal inteiro sem separador ("24000")
 * e separador brasileiro de milhar ("24.000"/"24.000 BTUs").
 * Não usa Number("24.000") porque isso produziria 24, e não 24.000.
 * Qualquer conteúdo ambíguo, negativo ou fracionário retorna null.
 */
export function parseCapacityBtu(input) {
  if (typeof input === 'number') {
    return Number.isSafeInteger(input) && input > 0 ? input : null;
  }
  if (typeof input !== 'string') return null;
  const raw = input.trim().toUpperCase().replace(/\s*BTU(?:S|\/H)?\s*$/, '').trim();
  if (!/^\d+$/.test(raw) && !/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    return null;
  }
  const result = Number(raw.replaceAll('.', ''));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}

/**
 * Regras de catálogo:
 * - status 'validated', identificador de versão e fonte documental são obrigatórios;
 * - preço (quando expresso) usa unidades de R$ 0,0001, para não perder 4 casas;
 * - categorias devem ter tipo, intervalo íntegro e código não vazio;
 * - a função NÃO declara cobertura do serviço ou cria direito financeiro.
 */
export function consultContractReference({ type, btu, outsideScope = false, outsideEvidence = '' } = {}, catalog = null) {
  if (outsideScope === true) {
    const validEvidence = typeof outsideEvidence === 'string' && outsideEvidence.trim();
    return {
      status: validEvidence ? REFERENCE_STATUS.OUTSIDE_CONFIRMED : REFERENCE_STATUS.PENDING_SCOPE,
      categoryCode: null,
      priceUnits4: null,
      sourceRef: validEvidence || null,
      message: validEvidence
        ? 'Fora do escopo conforme referência de validação informada.'
        : 'Indicação de fora do escopo sem evidência de validação; verificar enquadramento.'
    };
  }

  const kind = normalizeEquipmentType(type);
  const capacity = parseCapacityBtu(btu);
  if (!kind || capacity === null) {
    return {
      status: REFERENCE_STATUS.PENDING_EQUIPMENT,
      categoryCode: null,
      priceUnits4: null,
      sourceRef: null,
      message: 'Tipo ou capacidade não confirmados; não foi presumida categoria.'
    };
  }

  if (catalog?.status !== 'validated' || !String(catalog?.sourceRef || '').trim()
    || !String(catalog?.version || '').trim() || !Array.isArray(catalog?.categories)) {
    return {
      status: REFERENCE_STATUS.PENDING_CATALOG,
      categoryCode: null,
      priceUnits4: null,
      sourceRef: null,
      message: 'Parâmetros contratuais ainda não validados; cálculo indisponível.'
    };
  }

  const relevant = catalog.categories.filter((item) => normalizeEquipmentType(item?.type) === kind);
  if (relevant.some((item) =>
    typeof item?.code !== 'string' || !item.code.trim()
    || !Number.isSafeInteger(item.minBtu) || item.minBtu <= 0
    || !Number.isSafeInteger(item.maxBtu) || item.maxBtu < item.minBtu
    || !Number.isSafeInteger(item.priceUnits4) || item.priceUnits4 <= 0
  )) {
    return {
      status: REFERENCE_STATUS.INVALID_CATALOG,
      categoryCode: null,
      priceUnits4: null,
      sourceRef: catalog.sourceRef,
      message: 'Tabela de referência inconsistente; não é seguro calcular.'
    };
  }

  const matches = relevant.filter((item) => capacity >= item.minBtu && capacity <= item.maxBtu);
  if (matches.length > 1) {
    return {
      status: REFERENCE_STATUS.AMBIGUOUS,
      categoryCode: null,
      priceUnits4: null,
      sourceRef: catalog.sourceRef,
      message: 'Mais de uma categoria atende ao equipamento; é preciso corrigir a referência.'
    };
  }
  if (matches.length === 0) {
    return {
      status: REFERENCE_STATUS.UNMATCHED,
      categoryCode: null,
      priceUnits4: null,
      sourceRef: catalog.sourceRef,
      message: 'Não foi encontrada categoria válida para tipo e capacidade informados.'
    };
  }

  return {
    status: REFERENCE_STATUS.IDENTIFIED,
    categoryCode: matches[0].code,
    priceUnits4: matches[0].priceUnits4,
    sourceRef: catalog.sourceRef,
    catalogVersion: catalog.version,
    message: 'Categoria e preço de referência identificados. A cobertura e a apuração do serviço exigem verificação própria.'
  };
}

/** Exibição exata de quatro casas; arredondamento para NF depende de regra posterior. */
export function formatReferenceUnits4(units) {
  if (!Number.isSafeInteger(units) || units < 0) return null;
  const value = String(units).padStart(5, '0');
  return `${value.slice(0, -4)}.${value.slice(-4)}`;
}

/**
 * Soma somente registros explicitamente INFORMADOS, preservando ausência como null.
 * Não deve ser usado para converter valores de referência em faturamento.
 */
export function sumReportedValues(rows, field) {
  if (!Array.isArray(rows) || typeof field !== 'string' || !field) {
    return { total: null, knownSubtotal: null, missingCount: 0, invalidCount: 0, complete: false };
  }
  let total = 0;
  let knownCount = 0;
  let missingCount = 0;
  let invalidCount = 0;
  for (const row of rows) {
    const amount = row?.[field];
    if (amount === null || amount === undefined || amount === '') {
      missingCount += 1;
    } else if (typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0) {
      total += amount;
      knownCount += 1;
    } else {
      invalidCount += 1;
    }
  }
  const safe = Number.isSafeInteger(total);
  return {
    total: safe && missingCount === 0 && invalidCount === 0 && knownCount > 0 ? total : null,
    knownSubtotal: safe && knownCount > 0 ? total : null,
    missingCount,
    invalidCount: invalidCount + (safe ? 0 : 1),
    complete: safe && knownCount > 0 && missingCount === 0 && invalidCount === 0
  };
}
