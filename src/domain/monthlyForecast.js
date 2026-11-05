/**
 * Etapa 2: leitura financeira mensal dos atendimentos já registrados.
 *
 * Nunca soma preço nominal, acréscimo confirmado e referências pendentes
 * como se fossem um único valor devido. Operação e faturamento permanecem
 * fora deste domínio. Todos os preços usam inteiros de R$ 0,0001.
 */
import { calculateAttendance } from './attendanceEstimate.js';

const MONTH_PATTERN = /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function monthIsValid(value) {
  return typeof value === 'string' && MONTH_PATTERN.test(value);
}

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return String(date.getUTCFullYear()).padStart(4, '0') + '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0');
}

function preferredRevision(candidate, previous) {
  if (!previous) return true;
  const currentVersion = Number.isSafeInteger(candidate.revision) ? candidate.revision : 0;
  const oldVersion = Number.isSafeInteger(previous.revision) ? previous.revision : 0;
  if (currentVersion !== oldVersion) return currentVersion > oldVersion;
  return String(candidate.updatedAtISO || candidate.updatedAt || '') >=
    String(previous.updatedAtISO || previous.updatedAt || '');
}

function currentRecords(records) {
  if (!Array.isArray(records)) throw new TypeError('Atendimentos: forneça uma lista.');
  const latest = new Map();
  for (const item of records) {
    const id = item && typeof item.id === 'string' ? item.id : '';
    // Registros malformados continuam visíveis como pendência, não são descartados.
    const key = id || 'sem-id-' + latest.size;
    if (preferredRevision(item || {}, latest.get(key))) latest.set(key, item);
  }
  return [...latest.values()];
}

function safeAmount(sum, knownCount) {
  if (knownCount === 0 || sum > MAX_SAFE) return null;
  return Number(sum);
}

function summarizeMonth(month, records) {
  const totals = { nominal: 0n, additional: 0n, pending: 0n, included: 0n };
  const known = { nominal: 0, additional: 0, pending: 0, included: 0 };
  const rows = [];
  const schools = new Set();
  let missingNominalCount = 0;
  let coveragePendingCount = 0;
  let incompleteRecordCount = 0;
  let invalidRecordCount = 0;

  for (const item of records) {
    if (item.plannedMonth !== month) continue;
    if (item.schoolId) schools.add(item.schoolId);
    try {
      if (typeof item.id !== 'string' || !item.id.trim()) throw new TypeError('Identificador do atendimento ausente.');
      const result = calculateAttendance(item);
      const byNature = { nominal: 0n, additional: 0n, pending: 0n, included: 0n };
      const recordKnown = { nominal: 0, additional: 0, pending: 0, included: 0 };
      for (const line of result.lines) {
        const nominal = line.nominalTotalUnits4;
        if (nominal === null) missingNominalCount++;
        else {
          byNature.nominal += BigInt(nominal);
          recordKnown.nominal++;
        }
        const confirmedCoverage = Boolean(line.coverageSourceRef) &&
          (line.coverage === 'adicional' || line.coverage === 'incluido');
        if (!confirmedCoverage) coveragePendingCount++;
        if (line.coverage === 'incluido' && confirmedCoverage) {
          if (nominal !== null) {
            byNature.included += BigInt(nominal);
            recordKnown.included++;
          }
        } else if (line.coverage === 'adicional' && confirmedCoverage) {
          if (nominal !== null) {
            byNature.additional += BigInt(nominal);
            recordKnown.additional++;
          }
        } else if (nominal !== null) {
          byNature.pending += BigInt(nominal);
          recordKnown.pending++;
        }
      }
      const incomplete = result.nominalMissingCount > 0 || result.coveragePendingCount > 0;
      if (incomplete) incompleteRecordCount++;
      for (const nature of Object.keys(totals)) {
        totals[nature] += byNature[nature];
        known[nature] += recordKnown[nature];
      }
      const overflowByNature = Object.fromEntries(Object.entries(byNature).map(([nature, value]) => [nature, value > MAX_SAFE]));
      rows.push({
        record: item,
        invalid: false,
        incomplete,
        nominalUnits4: safeAmount(byNature.nominal, recordKnown.nominal),
        additionalUnits4: safeAmount(byNature.additional, recordKnown.additional),
        pendingUnits4: safeAmount(byNature.pending, recordKnown.pending),
        includedNominalUnits4: safeAmount(byNature.included, recordKnown.included),
        missingNominalCount: result.nominalMissingCount,
        coveragePendingCount: result.coveragePendingCount,
        overflowByNature,
        overflow: Object.values(overflowByNature).some(Boolean)
      });
    } catch (error) {
      invalidRecordCount++;
      incompleteRecordCount++;
      rows.push({
        record: item, invalid: true, incomplete: true,
        error: error.message || 'Registro econômico inválido.',
        nominalUnits4: null, additionalUnits4: null,
        pendingUnits4: null, includedNominalUnits4: null
      });
    }
  }
  rows.sort((a, b) => String(a.record.schoolId).localeCompare(String(b.record.schoolId)) ||
    String(a.record.id).localeCompare(String(b.record.id)));
  return {
    month,
    records: rows,
    recordCount: rows.length,
    schoolCount: schools.size,
    nominalUnits4: safeAmount(totals.nominal, known.nominal),
    additionalUnits4: safeAmount(totals.additional, known.additional),
    pendingUnits4: safeAmount(totals.pending, known.pending),
    includedNominalUnits4: safeAmount(totals.included, known.included),
    additionalKnownLineCount: known.additional,
    pendingKnownLineCount: known.pending,
    missingNominalCount,
    coveragePendingCount,
    incompleteRecordCount,
    invalidRecordCount,
    overflowByNature: Object.fromEntries(Object.entries(totals).map(([nature, value]) => [nature, value > MAX_SAFE])),
    overflow: Object.values(totals).some(value => value > MAX_SAFE)
  };
}

export function buildSchoolForecast(summary) {
  const grouped = new Map();
  for (const { record } of summary.records) {
    if (!record.schoolId) continue;
    const id = String(record.schoolId);
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(record);
  }
  return [...grouped].map(([schoolId, records]) => ({
    ...summarizeMonth(summary.month, records), schoolId
  }));
}

export function currentForecastMonth() {
  const now = new Date();
  return String(now.getFullYear()).padStart(4, '0') + '-' +
    String(now.getMonth() + 1).padStart(2, '0');
}

/**
 * A entrada são snapshots correntes do backend de desenvolvimento, sem
 * depender de hora de pagamento ou do status do chamado. As seis colunas
 * são COMPETÊNCIAS de previsão, nunca meses de caixa.
 */
export function buildMonthlyForecast(records, {
  schoolId = '', selectedMonth = '', anchorMonth = '', months = 6
} = {}) {
  if (!Number.isInteger(months) || months < 1 || months > 12) {
    throw new RangeError('Previsão: informe entre 1 e 12 competências.');
  }
  const latest = currentRecords(records);
  const visible = latest.filter(item => !schoolId || String(item?.schoolId) === String(schoolId));
  const recordedMonths = [...new Set(visible.map(item => item?.plannedMonth).filter(monthIsValid))].sort();
  const present = currentForecastMonth();
  const anchor = monthIsValid(anchorMonth) ? anchorMonth
    : monthIsValid(selectedMonth) ? selectedMonth
      : recordedMonths.at(-1) || present;
  const selection = monthIsValid(selectedMonth) ? selectedMonth : anchor;
  const periodMonths = Array.from({ length: months }, (_, index) => shiftMonth(anchor, index - months + 1));
  const summaries = new Map();
  const summaryFor = month => {
    if (!summaries.has(month)) summaries.set(month, summarizeMonth(month, visible));
    return summaries.get(month);
  };
  return {
    anchorMonth: anchor,
    selectedMonth: selection,
    recordedMonths,
    months: periodMonths.map(summaryFor),
    selected: summaryFor(selection),
    // Não ocultar uma competência inválida: ela não pode entrar em série mensal.
    invalidMonthRecordCount: visible.filter(item => !monthIsValid(item?.plannedMonth)).length
  };
}
