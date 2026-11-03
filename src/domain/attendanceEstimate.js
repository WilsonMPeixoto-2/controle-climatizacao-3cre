/**
 * Atendimento previsto com composição de referência econômica (Etapa 1).
 * Funções puras: nenhum status operacional produz valor devido, atesto ou cobrança.
 * Preços usam inteiros de R$ 0,0001; o snapshot aplicado não consulta novamente o catálogo.
 */
import { consultContractReference, createManualReference, REFERENCE_STATUS } from './financialReference.js';

// Teto técnico medido nas Rules de desenvolvimento, incluindo oito vínculos.
export const MAX_ATTENDANCE_ITEMS = 4;
export const MAX_TICKET_LINKS = 8;

const MAX_QUANTITY = 1000000;
const MAX_UNIT_PRICE_UNITS4 = 10000000000;
const MAX_LINE_TOTAL_UNITS4 = 450000000000000;
const ID_PATTERN = /^[A-Za-z0-9_.:-]+$/;
const SERVICE_KINDS = ['preventiva', 'corretiva', 'outra'];
const COVERAGES = ['a_confirmar', 'incluido', 'adicional'];
const REFERENCE_NATURES = ['nao_informada', 'provisoria', 'informada', 'contratual_informada'];

function record(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field}: informe um objeto válido.`);
  }
  return value;
}

function text(value, field, limit = 120) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new TypeError(`${field}: informe um texto.`);
  const result = value.trim();
  if (result.length > limit) throw new RangeError(`${field}: limite de ${limit} caracteres.`);
  return result;
}

function identifier(value, field, required = false) {
  const result = text(value, field, 128);
  if ((!result && required) || (result && !ID_PATTERN.test(result))) {
    throw new TypeError(`${field}: identificador inválido.`);
  }
  return result;
}

function choice(value, field, choices, fallback) {
  const result = value === undefined || value === null || value === '' ? fallback : value;
  if (!choices.includes(result)) throw new TypeError(`${field}: opção inválida.`);
  return result;
}

function integerOrNull(value, field, maximum, minimum = 0) {
  if (value === undefined || value === null || value === '') return null;
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${field}: informe um inteiro entre ${minimum} e ${maximum}, ou deixe ausente.`);
  }
  return value;
}

function nominalTotal(quantity, unitPriceUnits4) {
  if (quantity === null || unitPriceUnits4 === null) return null;
  const product = BigInt(quantity) * BigInt(unitPriceUnits4);
  if (product > BigInt(MAX_LINE_TOTAL_UNITS4)) {
    throw new RangeError('lineTotalUnits4: composição nominal acima do limite técnico seguro.');
  }
  return Number(product);
}

function normalizeItem(input) {
  const item = record(input, 'item');
  const quantity = integerOrNull(item.quantity, 'quantity', MAX_QUANTITY);
  const unitPriceUnits4 = integerOrNull(item.unitPriceUnits4, 'unitPriceUnits4', MAX_UNIT_PRICE_UNITS4);
  const coverage = choice(item.coverage, 'coverage', COVERAGES, 'a_confirmar');
  const referenceNature = choice(item.referenceNature, 'referenceNature', REFERENCE_NATURES,
    unitPriceUnits4 === null ? 'nao_informada' : 'informada');
  const sourceRef = text(item.sourceRef, 'sourceRef (origem)', 300);
  const coverageSourceRef = text(item.coverageSourceRef, 'coverageSourceRef (origem da cobertura)', 300);
  const referenceVersion = text(item.referenceVersion, 'referenceVersion');
  const catalogId = text(item.catalogId, 'catalogId');

  if (unitPriceUnits4 !== null) {
    if (!sourceRef) throw new TypeError('sourceRef: informe a origem do preço de referência.');
    if (referenceNature === 'nao_informada') {
      throw new TypeError('referenceNature: informe a natureza do preço de referência.');
    }
    // Reaproveita a validação consultiva E1; não transforma a informação em atesto.
    const manual = createManualReference({ priceUnits4: unitPriceUnits4, sourceRef });
    if (manual.status === REFERENCE_STATUS.INVALID_MANUAL) throw new TypeError(manual.message);
  }
  if (referenceNature === 'contratual_informada' && (!catalogId || !referenceVersion || !sourceRef)) {
    throw new TypeError('Referência contratual informada exige catalogId, versão e origem.');
  }

  // O custo nominal continua íntegro e seguro mesmo quando o incremento informado é zero.
  let lineTotalUnits4 = nominalTotal(quantity, unitPriceUnits4);
  if (quantity !== null && coverage === 'incluido' && coverageSourceRef) {
    // Registra apenas o incremento adicional conforme a cobertura informada pelo responsável.
    // Origem de preço, isoladamente, não demonstra essa decisão de cobertura.
    lineTotalUnits4 = 0;
  }

  return {
    id: identifier(item.id, 'item.id', true),
    description: text(item.description, 'description', 500),
    equipmentType: text(item.equipmentType, 'equipmentType'),
    capacityBtu: integerOrNull(item.capacityBtu, 'capacityBtu', Number.MAX_SAFE_INTEGER, 1),
    equipmentRef: text(item.equipmentRef, 'equipmentRef'),
    quantity,
    coverage,
    referenceNature,
    unitPriceUnits4,
    sourceRef,
    coverageSourceRef,
    referenceVersion,
    catalogId,
    categoryCode: text(item.categoryCode, 'categoryCode'),
    lineTotalUnits4
  };
}

function normalizeMonth(value) {
  const month = text(value, 'plannedMonth', 7);
  if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(month) || month.startsWith('0000-')) {
    throw new TypeError('plannedMonth: informe a competência no formato AAAA-MM.');
  }
  return month;
}

function normalizeDate(value, month) {
  const result = text(value, 'plannedDate', 10);
  if (!result) return '';
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(result) || result.slice(0, 7) !== month) {
    throw new TypeError('plannedDate: informe uma data civil dentro da competência prevista.');
  }
  const year = Number(result.slice(0, 4));
  const monthNumber = Number(result.slice(5, 7));
  const day = Number(result.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > monthDays[monthNumber - 1]) throw new TypeError('plannedDate: data civil inválida.');
  return result;
}

/**
 * Normaliza apenas o conteúdo compartilhável. Metadados de persistência pertencem ao adaptador.
 * Descarta campos desconhecidos e refaz os totais/espelho, sem alterar o objeto recebido.
 * Validações técnicas não exigem inventário individual nem impõem decisões administrativas.
 */
export function normalizeAttendance(input) {
  const attendance = record(input, 'atendimento');
  const plannedMonth = normalizeMonth(attendance.plannedMonth);
  if (!Array.isArray(attendance.items) || attendance.items.length < 1 || attendance.items.length > MAX_ATTENDANCE_ITEMS) {
    throw new RangeError(`items: informe entre 1 e ${MAX_ATTENDANCE_ITEMS} grupos.`);
  }
  const items = Array.from(attendance.items, normalizeItem);
  const itemIds = items.map((item) => item.id);
  if (new Set(itemIds).size !== itemIds.length) throw new TypeError('items: identificadores de grupo devem ser únicos.');

  const rawTicketIds = attendance.ticketIds ?? [];
  if (!Array.isArray(rawTicketIds) || rawTicketIds.length > MAX_TICKET_LINKS) {
    throw new RangeError(`ticketIds: limite de ${MAX_TICKET_LINKS} chamados vinculados.`);
  }
  const ticketIds = Array.from(rawTicketIds, (id) => identifier(id, 'ticketIds', true));
  if (new Set(ticketIds).size !== ticketIds.length) throw new TypeError('ticketIds: chamados devem ser únicos.');

  return {
    schoolId: identifier(attendance.schoolId, 'schoolId', true),
    plannedMonth,
    plannedDate: normalizeDate(attendance.plannedDate, plannedMonth),
    serviceKind: choice(attendance.serviceKind, 'serviceKind', SERVICE_KINDS, 'outra'),
    cycle: text(attendance.cycle, 'cycle'),
    visitId: identifier(attendance.visitId, 'visitId'),
    ticketIds,
    // Rótulo informado e sessão não comprovam autoria individual autenticada (DP-004).
    responsibleLabel: text(attendance.responsibleLabel, 'responsibleLabel', 160),
    sessionId: identifier(attendance.sessionId, 'sessionId'),
    items,
    itemIds
  };
}

/**
 * Estimativa de referência; ausência nunca vira zero nem valor devido.
 * Na prévia do formulário, preço sem origem é parcela ainda desconhecida.
 * A opção draft não altera o formulário nem relaxa a normalização para salvar.
 */
export function calculateAttendance(attendance, { draft = false } = {}) {
  const calculationInput = draft && Array.isArray(attendance?.items) ? {
    ...attendance,
    items: attendance.items.map((item) => {
      const missingSource = item?.sourceRef === undefined || item?.sourceRef === null
        || (typeof item.sourceRef === 'string' && !item.sourceRef.trim());
      return missingSource ? { ...item, unitPriceUnits4: null } : item;
    })
  } : attendance;
  const { items } = normalizeAttendance(calculationInput);
  const lines = items.map((item) => ({
    ...item,
    nominalTotalUnits4: nominalTotal(item.quantity, item.unitPriceUnits4),
    amountNature: item.coverage === 'incluido' && item.coverageSourceRef && item.quantity !== null
      ? 'incremento_adicional' : 'estimativa_nominal',
    referenceComplete: item.unitPriceUnits4 !== null && Boolean(item.sourceRef)
  }));
  const known = lines.filter((line) => line.lineTotalUnits4 !== null);
  const knownSubtotalUnits4 = known.length
    ? known.reduce((sum, line) => sum + line.lineTotalUnits4, 0)
    : null;
  const missingCount = lines.length - known.length;
  const complete = missingCount === 0;
  return {
    totalUnits4: complete ? knownSubtotalUnits4 : null,
    knownSubtotalUnits4,
    missingCount,
    complete,
    // Completude aritmética e disponibilidade nominal não significam cobertura validada.
    compositionComplete: complete,
    coveragePendingCount: lines.filter((line) => line.coverage === 'a_confirmar' || !line.coverageSourceRef).length,
    referenceMissingCount: lines.filter((line) => !line.referenceComplete).length,
    nominalMissingCount: lines.filter((line) => line.nominalTotalUnits4 === null).length,
    lines
  };
}

/**
 * Converte texto pt-BR ou decimal com ponto em unidades inteiras de R$ 0,0001.
 * Um ponto único seguido de três dígitos ("1.234") é ambíguo e exige explicitação.
 */
export function parseMoneyUnits4(value) {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value !== 'string') throw new TypeError('Preço: informe um texto monetário.');
  const raw = value.trim().replace(/^R\$\s*/, '');
  let whole;
  let fraction = '';
  if (raw.includes(',')) {
    const match = /^(\d+|[1-9]\d{0,2}(?:\.\d{3})+),(\d{1,4})$/.exec(raw);
    if (!match) throw new TypeError('Preço: formato monetário inválido ou mais de quatro casas decimais.');
    whole = match[1].replaceAll('.', '');
    fraction = match[2];
  } else if (/^\d+$/.test(raw)) {
    whole = raw;
  } else if (/^[1-9]\d{0,2}(?:\.\d{3}){2,}$/.test(raw)) {
    whole = raw.replaceAll('.', '');
  } else {
    const match = /^(\d+)\.(\d{1,4})$/.exec(raw);
    if (!match || (match[1].length <= 3 && match[2].length === 3)) {
      throw new TypeError('Preço: formato inválido ou ambíguo; explicite as casas decimais.');
    }
    whole = match[1];
    fraction = match[2];
  }
  const units = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'));
  if (units > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Preço: valor acima da precisão segura.');
  return Number(units);
}

/** Formatação exata pt-BR; o arredondamento de exibição não modifica o snapshot. */
export function formatMoneyUnits4(units, { digits = 4 } = {}) {
  if (units === null || units === undefined) return 'Não informado';
  if (!Number.isSafeInteger(units) || units < 0) throw new TypeError('Valor monetário inválido.');
  if (!Number.isInteger(digits) || digits < 0 || digits > 4) throw new RangeError('Use entre zero e quatro casas decimais.');
  const divisor = 10n ** BigInt(4 - digits);
  const rounded = (BigInt(units) + divisor / 2n) / divisor;
  const decimalScale = 10n ** BigInt(digits);
  const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(rounded / decimalScale);
  const fraction = digits ? `,${String(rounded % decimalScale).padStart(digits, '0')}` : '';
  return `R$ ${whole}${fraction}`;
}

/**
 * Aplica explicitamente uma consulta E1 ao item e retorna um snapshot estável.
 * Catálogo confirmado continua sendo referência informada, sem confirmar cobertura.
 * Um valor manual existente é preservado; catálogo sem fonte não fornece preço utilizável.
 */
export function resolveAttendanceReference(input, catalog, serviceKind) {
  choice(serviceKind, 'serviceKind', SERVICE_KINDS, 'outra');
  const item = normalizeItem(input);
  if (item.unitPriceUnits4 !== null) return item;
  if (catalog?.serviceKind && catalog.serviceKind !== serviceKind) return item;
  if (Array.isArray(catalog?.serviceKinds) && !catalog.serviceKinds.includes(serviceKind)) return item;
  const reference = consultContractReference({ type: item.equipmentType, btu: item.capacityBtu }, catalog);
  if (reference.priceUnits4 === null || !reference.sourceRef) return item;
  const catalogId = text(catalog?.id ?? catalog?.catalogId, 'catalogId');
  const referenceVersion = text(reference.catalogVersion, 'referenceVersion');
  return normalizeItem({
    ...item,
    unitPriceUnits4: reference.priceUnits4,
    sourceRef: reference.sourceRef,
    referenceVersion,
    catalogId,
    categoryCode: reference.categoryCode,
    referenceNature: reference.status === REFERENCE_STATUS.IDENTIFIED && catalogId && referenceVersion
      ? 'contratual_informada' : 'provisoria'
  });
}
