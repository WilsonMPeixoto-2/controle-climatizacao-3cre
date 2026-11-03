import assert from 'node:assert/strict';
import { normalizeAttendance } from '../src/domain/attendanceEstimate.js';
import {
  buildAttendanceForecast,
  formatForecastMoneyUnits4,
  getForecastYearMonths,
  selectCurrentAttendances,
  summarizeAttendanceForecast
} from '../src/domain/attendanceForecast.js';

// Composições e valores exclusivamente sintéticos, sem referência contratual real.
const item = (id, overrides = {}) => ({
  id, quantity: 2, unitPriceUnits4: 100000, coverage: 'adicional',
  sourceRef: 'Orçamento nominal FICTÍCIO de teste',
  coverageSourceRef: 'Incidência adicional FICTÍCIA de teste',
  referenceNature: 'provisoria', ...overrides
});
const attendance = (id, overrides = {}) => ({
  ...normalizeAttendance({
    schoolId: 'escola-A', plannedMonth: '2026-11', serviceKind: 'preventiva',
    sessionId: 'sessao-sintetica', items: [item('grupo-A')], ...overrides
  }),
  id, revision: overrides.revision ?? 1
});
const a = attendance('atendimento-A', { items: [item('adicional'), item('incluido', {
  quantity: 3, unitPriceUnits4: 50000, coverage: 'incluido'
})] });
const b = attendance('atendimento-B', { schoolId: 'escola-B', items: [
  item('cobertura-pendente', { quantity: 2, unitPriceUnits4: 70000, coverage: 'a_confirmar', coverageSourceRef: '' }),
  { id: 'preco-pendente', quantity: 1 }
] });
const zero = attendance('zero-informado', { plannedMonth: '2026-12', items: [item('zero', {
  quantity: 0, unitPriceUnits4: 0
})] });
const input = [a, b, zero];
const initial = structuredClone(input);
const forecast = buildAttendanceForecast(input, { months: getForecastYearMonths(2026), month: '2026-11' });

// As duas grandezas pertencem aos mesmos registros, sem serem somadas entre si.
assert.equal(forecast.summary.count, 2);
assert.equal(forecast.summary.attendanceCount, 2);
assert.equal(forecast.summary.itemCount, 4);
assert.deepEqual(forecast.summary.recordIds, ['atendimento-A', 'atendimento-B']);
assert.equal(forecast.summary.nominal.knownSubtotalUnits4, 490000n);
assert.equal(forecast.summary.nominal.totalUnits4, null);
assert.equal(forecast.summary.nominal.complete, false);
assert.equal(forecast.summary.nominal.knownGroupCount, 3);
assert.equal(forecast.summary.nominal.missingGroupCount, 1);
assert.equal(forecast.summary.nominal.incompleteAttendanceCount, 1);
assert.equal(forecast.summary.additional.knownSubtotalUnits4, 200000n);
assert.equal(forecast.summary.additional.totalUnits4, null);
assert.equal(forecast.summary.additional.knownGroupCount, 2);
assert.equal(forecast.summary.additional.missingGroupCount, 2);
assert.equal(forecast.summary.additional.incompleteAttendanceCount, 1);
assert.equal(forecast.summary.coveragePendingCount, 2);
assert.equal(forecast.summary.coveragePendingAttendanceCount, 1);
assert.equal(forecast.summary.incompleteAttendanceCount, 1);
assert.equal(forecast.summary.referenceMissingCount, 1);
assert.equal('totalUnits4' in forecast.summary, false);
assert.equal(forecast.schools.find(row => row.schoolId === 'escola-A').nominal.totalUnits4, 350000n);
assert.equal(forecast.schools.find(row => row.schoolId === 'escola-A').additional.totalUnits4, 200000n);
assert.deepEqual(forecast.monthly.find(row => row.month === '2026-11').recordIds, forecast.summary.recordIds);
assert.deepEqual(input, initial);

// Nenhum registro no mês é distinto de registro com valor zero explicitamente informado.
const emptyMonth = forecast.monthly.find(row => row.month === '2026-10');
assert.equal(emptyMonth.count, 0);
assert.equal(emptyMonth.nominal.knownSubtotalUnits4, null);
assert.equal(emptyMonth.nominal.totalUnits4, null);
assert.equal(emptyMonth.nominal.complete, false);
assert.equal(emptyMonth.additional.knownSubtotalUnits4, null);
const zeroMonth = forecast.monthly.find(row => row.month === '2026-12');
assert.equal(zeroMonth.count, 1);
assert.equal(zeroMonth.nominal.totalUnits4, 0n);
assert.equal(zeroMonth.nominal.complete, true);
assert.equal(zeroMonth.additional.totalUnits4, 0n);
assert.equal(zeroMonth.additional.knownGroupCount, 1);
const allUnknown = buildAttendanceForecast([attendance('sem-preco', {
  items: [{ id: 'desconhecido', quantity: 1 }]
})]).summary;
assert.equal(allUnknown.count, 1);
assert.equal(allUnknown.nominal.knownSubtotalUnits4, null);
assert.equal(allUnknown.nominal.missingGroupCount, 1);
assert.equal(allUnknown.additional.totalUnits4, null);

// Origem nominal isolada e natureza informada sem preço não confirmam acréscimo.
const priceOnly = summarizeAttendanceForecast(attendance('so-preco', {
  items: [item('sem-decisao-cobertura', { coverageSourceRef: '' })]
}));
assert.equal(priceOnly.nominal.totalUnits4, 200000n);
assert.equal(priceOnly.additional.knownSubtotalUnits4, null);
assert.equal(priceOnly.additional.missingGroupCount, 1);
const coveredUnknownNominal = summarizeAttendanceForecast(attendance('coberto', {
  items: [item('incluido', { coverage: 'incluido', quantity: 3, unitPriceUnits4: null, sourceRef: '', referenceNature: 'informada' })]
}));
assert.equal(coveredUnknownNominal.nominal.totalUnits4, null);
assert.equal(coveredUnknownNominal.nominal.missingGroupCount, 1);
assert.equal(coveredUnknownNominal.additional.totalUnits4, 0n);
assert.equal(coveredUnknownNominal.additional.complete, true);
assert.equal(coveredUnknownNominal.referenceMissingCount, 1);
assert.equal(coveredUnknownNominal.coveragePendingCount, 0);
assert.equal(coveredUnknownNominal.incompleteAttendanceCount, 1);

// Prévia sem ID/revisão usa as mesmas métricas, sem relaxar a gravação da E1.
const previewContent = {
  schoolId: 'escola-A', plannedMonth: '2026-11',
  items: [item('preco-sem-origem', { sourceRef: '' }), item('conhecido')]
};
assert.throws(() => summarizeAttendanceForecast(previewContent), /origem|sourceRef/);
const preview = summarizeAttendanceForecast(previewContent, { draft: true });
assert.equal(preview.nominal.knownSubtotalUnits4, 200000n);
assert.equal(preview.nominal.missingGroupCount, 1);
assert.equal(preview.additional.knownSubtotalUnits4, 200000n);
assert.deepEqual(preview.recordIds, []);
assert.equal(preview.count, 1);

// A versão atual é escolhida antes dos filtros: o mês/escola antigos não ressurgem.
const moved = attendance(a.id, { revision: 2, plannedMonth: '2026-12', items: a.items });
const versions = [a, b, moved, a, { ...moved }];
const movedForecast = buildAttendanceForecast(versions, { months: ['2026-11', '2026-12'], month: '2026-11' });
assert.deepEqual(movedForecast.records.map(record => record.id), [b.id]);
assert.equal(movedForecast.monthly.find(row => row.month === '2026-11').count, 1);
assert.equal(movedForecast.monthly.find(row => row.month === '2026-12').count, 1);
assert.equal(movedForecast.monthly.find(row => row.month === '2026-12').nominal.totalUnits4, 350000n);
assert.equal(movedForecast.currentRecords.length, 2);
const corrected = attendance(a.id, { revision: 3, plannedMonth: '2026-12', items: [item('corrigido', {
  quantity: 3, unitPriceUnits4: 1234567
})] });
const correctionForecast = buildAttendanceForecast([...versions, corrected], { month: '2026-12' });
assert.equal(correctionForecast.summary.count, 1);
assert.equal(correctionForecast.summary.nominal.totalUnits4, 3703701n);
assert.equal(correctionForecast.summary.additional.totalUnits4, 3703701n);
assert.equal(correctionForecast.summary.records[0].revision, 3);
assert.equal(formatForecastMoneyUnits4(correctionForecast.summary.nominal.totalUnits4), 'R$ 370,3701');
const schoolMoved = attendance(a.id, { revision: 4, schoolId: 'escola-B', plannedMonth: '2027-01' });
assert.equal(buildAttendanceForecast([...versions, corrected, schoolMoved], {
  schoolId: 'escola-A', month: '2026-11'
}).summary.count, 0);
assert.deepEqual(selectCurrentAttendances([corrected, a, moved]).map(record => record.revision), [3]);

// Os filtros do período não apagam a evolução da escola no horizonte explícito.
const schoolForecast = buildAttendanceForecast(input, {
  schoolId: 'escola-A', month: '2026-11', months: getForecastYearMonths('2026')
});
assert.equal(schoolForecast.summary.count, 1);
assert.equal(schoolForecast.monthly.find(row => row.month === '2026-12').count, 1);
assert.equal(schoolForecast.schools.length, 1);
const yearScope = buildAttendanceForecast([...input, attendance('fora-do-ano', { plannedMonth: '2027-01' })], {
  months: getForecastYearMonths(2026)
});
assert.equal(yearScope.summary.count, 3);
assert.equal(yearScope.records.some(record => record.id === 'fora-do-ano'), false);
assert.equal(yearScope.monthly.length, 12);
const monthOutsideHorizon = buildAttendanceForecast([attendance('fora-do-ano', { plannedMonth: '2027-01' })], {
  month: '2027-01', months: getForecastYearMonths(2026)
});
assert.equal(monthOutsideHorizon.summary.count, 1);

// Ligações compartilhadas não deduplicam serviços legítimos nem adicionam valores.
const linked = attendance('vinculado-1', { ticketIds: ['GOP-AR-2026-0001'], visitId: 'visita-1' });
const alsoLinked = attendance('vinculado-2', { ticketIds: linked.ticketIds, visitId: linked.visitId });
const linksForecast = buildAttendanceForecast([
  { ...linked, revisions: [linked, moved], visit: { amount: 999999 }, tickets: [{ amount: 888888 }] },
  alsoLinked
]);
assert.equal(linksForecast.summary.count, 2);
assert.equal(linksForecast.summary.nominal.totalUnits4, 400000n);
assert.equal(linksForecast.summary.additional.totalUnits4, 400000n);

// Agregações excedem Number.MAX_SAFE_INTEGER sem perder um único R$ 0,0001.
const maximumRecords = Array.from({ length: 6 }, (_, index) => attendance(`max-${index}`, {
  items: Array.from({ length: 4 }, (_, group) => item(`max-grupo-${group}`, {
    quantity: 45000, unitPriceUnits4: 10000000000
  }))
}));
const large = buildAttendanceForecast(maximumRecords).summary;
assert.equal(large.nominal.totalUnits4, 10800000000000000n);
assert.equal(large.additional.totalUnits4, 10800000000000000n);
assert.equal(formatForecastMoneyUnits4(large.nominal.totalUnits4), 'R$ 1.080.000.000.000,0000');
assert.equal(formatForecastMoneyUnits4(9007199254740993n), 'R$ 900.719.925.474,0993');
assert.equal(formatForecastMoneyUnits4(1234567n, { digits: 2 }), 'R$ 123,46');
assert.equal(formatForecastMoneyUnits4(10000), 'R$ 1,0000');
assert.equal(formatForecastMoneyUnits4(0n), 'R$ 0,0000');
assert.equal(formatForecastMoneyUnits4(null), 'Não informado');
for (const invalid of [-1n, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '10000', {}]) {
  assert.throws(() => formatForecastMoneyUnits4(invalid));
}
assert.throws(() => formatForecastMoneyUnits4(1n, { digits: 5 }));

// Anos e entradas estruturais inválidas não geram competências/valores falsos.
assert.deepEqual(getForecastYearMonths(1).slice(0, 2), ['0001-01', '0001-02']);
assert.equal(getForecastYearMonths(9999).at(-1), '9999-12');
for (const invalid of [0, 10000, -1, 2026.5, NaN, '', '1e3', '2026x']) {
  assert.throws(() => getForecastYearMonths(invalid));
}
assert.throws(() => selectCurrentAttendances(null));
assert.throws(() => selectCurrentAttendances([{ ...a, id: '' }]));
assert.throws(() => selectCurrentAttendances([{ ...a, revision: 0 }]));
assert.throws(() => selectCurrentAttendances(new Array(1)));
assert.throws(() => buildAttendanceForecast(input, { month: '2026-13' }));
assert.throws(() => buildAttendanceForecast(input, { months: ['0000-01'] }));
assert.throws(() => buildAttendanceForecast(input, { months: new Array(1) }));
assert.throws(() => buildAttendanceForecast(input, { schoolId: '../invalida' }));
assert.deepEqual(buildAttendanceForecast([]).monthly, []);
assert.deepEqual(buildAttendanceForecast(input, { months: ['2026-12', '2026-11', '2026-11'] }).monthly.map(row => row.month), ['2026-11', '2026-12']);

console.log('Etapa 2 | previsão: grandezas separadas, versões atuais, filtros, ausência/zero e soma exata passaram.');
