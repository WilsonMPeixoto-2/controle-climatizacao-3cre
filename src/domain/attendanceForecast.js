/**
 * Previsão mensal derivada dos atendimentos compartilhados (Etapa 2).
 * As duas grandezas são relacionadas, nunca aditivas: nominal e acréscimo
 * conforme cobertura informada. Nenhuma delas representa valor devido.
 */
import { calculateAttendance } from './attendanceEstimate.js';

const ID_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;
const MONTH_PATTERN = /^(?!0000)[0-9]{4}-(0[1-9]|1[0-2])$/;

function monthValue(value, { optional = false } = {}) {
  if (typeof value !== 'string') throw new TypeError('Competência prevista inválida.');
  const month = value.trim();
  if ((optional && !month) || MONTH_PATTERN.test(month)) return month;
  throw new TypeError('Informe a competência prevista no formato AAAA-MM.');
}

/** Seleciona a versão atual antes de aplicar qualquer recorte temporal/escolar. */
export function selectCurrentAttendances(records) {
  if (!Array.isArray(records)) throw new TypeError('Informe uma lista de atendimentos.');
  const current = new Map();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)
      || typeof record.id !== 'string' || !ID_PATTERN.test(record.id)
      || !Number.isSafeInteger(record.revision) || record.revision < 1) {
      throw new TypeError('Atendimento compartilhado sem ID ou revisão válidos.');
    }
    const previous = current.get(record.id);
    if (!previous || record.revision > previous.revision) current.set(record.id, record);
  }
  return [...current.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function emptyMetric() {
  return {
    knownSubtotalUnits4: null,
    totalUnits4: null,
    complete: false,
    knownGroupCount: 0,
    missingGroupCount: 0,
    incompleteAttendanceCount: 0
  };
}

function includeValue(metric, value) {
  if (value === null) {
    metric.missingGroupCount += 1;
    return;
  }
  metric.knownSubtotalUnits4 = (metric.knownSubtotalUnits4 ?? 0n) + value;
  metric.knownGroupCount += 1;
}

function finishMetric(metric) {
  metric.complete = metric.knownGroupCount > 0 && metric.missingGroupCount === 0;
  metric.totalUnits4 = metric.complete ? metric.knownSubtotalUnits4 : null;
  return metric;
}

/**
 * A origem do preço não comprova incidência adicional. Uma informação de
 * cobertura própria é necessária tanto para inclusão quanto para adicional.
 */
function additionalValue(line) {
  if (!line.coverageSourceRef || line.quantity === null) return null;
  if (line.coverage === 'incluido') return 0n;
  if (line.coverage === 'adicional' && line.nominalTotalUnits4 !== null) {
    return BigInt(line.nominalTotalUnits4);
  }
  return null;
}

function summarizeRecords(records, { draft = false } = {}) {
  const nominal = emptyMetric();
  const additional = emptyMetric();
  let itemCount = 0;
  let coveragePendingCount = 0;
  let coveragePendingAttendanceCount = 0;
  let incompleteAttendanceCount = 0;
  let referenceMissingCount = 0;

  for (const record of records) {
    const calculation = calculateAttendance(record, { draft });
    let nominalMissing = false;
    let additionalMissing = false;
    for (const line of calculation.lines) {
      const nominalValue = line.nominalTotalUnits4 === null ? null : BigInt(line.nominalTotalUnits4);
      const additionalAmount = additionalValue(line);
      includeValue(nominal, nominalValue);
      includeValue(additional, additionalAmount);
      nominalMissing ||= nominalValue === null;
      additionalMissing ||= additionalAmount === null;
    }
    itemCount += calculation.lines.length;
    coveragePendingCount += calculation.coveragePendingCount;
    coveragePendingAttendanceCount += Number(calculation.coveragePendingCount > 0);
    referenceMissingCount += calculation.referenceMissingCount;
    nominal.incompleteAttendanceCount += Number(nominalMissing);
    additional.incompleteAttendanceCount += Number(additionalMissing);
    incompleteAttendanceCount += Number(nominalMissing || additionalMissing);
  }

  return {
    records: [...records],
    recordIds: records.map(record => record.id).filter(Boolean),
    count: records.length,
    attendanceCount: records.length,
    itemCount,
    nominal: finishMetric(nominal),
    additional: finishMetric(additional),
    coveragePendingCount,
    coveragePendingAttendanceCount,
    incompleteAttendanceCount,
    referenceMissingCount
  };
}

/** Mesmas bases da consolidação, também para prévia ainda sem ID/revisão. */
export function summarizeAttendanceForecast(content, { draft = false } = {}) {
  return summarizeRecords([content], { draft });
}

/**
 * Apenas documentos atuais de atendimento são fonte de valores. Chamados,
 * visitas e revisões anexas não são percorridos nem somados novamente.
 * O horizonte mantém a evolução visível ao selecionar uma competência.
 */
export function buildAttendanceForecast(records, { schoolId = '', month = '', months = [] } = {}) {
  if (typeof schoolId !== 'string' || (schoolId && !ID_PATTERN.test(schoolId))) {
    throw new TypeError('Identificador de escola inválido.');
  }
  const selectedMonth = monthValue(month, { optional: true });
  if (!Array.isArray(months)) throw new TypeError('Informe uma lista de competências para o horizonte.');
  const requestedMonths = [...new Set(Array.from(months, value => monthValue(value)))].sort();
  const currentRecords = selectCurrentAttendances(records);
  const schoolRecords = currentRecords.filter(record => !schoolId || record.schoolId === schoolId);
  const horizon = requestedMonths.length ? requestedMonths
    : [...new Set(schoolRecords.map(record => monthValue(record.plannedMonth)))].sort();
  const horizonSet = new Set(horizon);
  const periodRecords = schoolRecords.filter(record => selectedMonth
    ? record.plannedMonth === selectedMonth : horizonSet.has(record.plannedMonth));
  const schoolIds = [...new Set(periodRecords.map(record => record.schoolId))].sort();

  return {
    currentRecords,
    records: periodRecords,
    summary: summarizeRecords(periodRecords),
    monthly: horizon.map(value => ({
      month: value,
      ...summarizeRecords(schoolRecords.filter(record => record.plannedMonth === value))
    })),
    schools: schoolIds.map(value => ({
      schoolId: value,
      ...summarizeRecords(periodRecords.filter(record => record.schoolId === value))
    }))
  };
}

export function getForecastYearMonths(year) {
  const value = typeof year === 'string' && /^[0-9]{1,4}$/.test(year) ? Number(year) : year;
  if (!Number.isInteger(value) || value < 1 || value > 9999) {
    throw new RangeError('Informe um ano entre 1 e 9999.');
  }
  return Array.from({ length: 12 }, (_, index) => `${String(value).padStart(4, '0')}-${String(index + 1).padStart(2, '0')}`);
}

/** Formata a soma exata; Number é admitido somente quando inteiro seguro. */
export function formatForecastMoneyUnits4(units, { digits = 4 } = {}) {
  if (units === null || units === undefined) return 'Não informado';
  if ((typeof units !== 'bigint' && !Number.isSafeInteger(units)) || units < 0) {
    throw new TypeError('Valor monetário de previsão inválido.');
  }
  if (!Number.isInteger(digits) || digits < 0 || digits > 4) {
    throw new RangeError('Use entre zero e quatro casas decimais.');
  }
  const divisor = 10n ** BigInt(4 - digits);
  const rounded = (BigInt(units) + divisor / 2n) / divisor;
  const decimalScale = 10n ** BigInt(digits);
  const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(rounded / decimalScale);
  const fraction = digits ? `,${String(rounded % decimalScale).padStart(digits, '0')}` : '';
  return `R$ ${whole}${fraction}`;
}
