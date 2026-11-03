import assert from 'node:assert/strict';
import { buildMonthlyForecast } from '../src/domain/monthlyForecast.js';

const price = (id, quantity, units4, coverage = 'a_confirmar', coverageSourceRef = '') => ({
  id, description: id, quantity, unitPriceUnits4: units4,
  referenceNature: units4 === null ? 'nao_informada' : 'informada',
  sourceRef: units4 === null ? '' : 'Tabela sintética / teste',
  coverage, coverageSourceRef
});
const record = (id, plannedMonth, items, schoolId = '03.12.001', revision = 1) => ({
  id, revision, schoolId, plannedMonth, plannedDate: '',
  serviceKind: 'preventiva', items, ticketIds: []
});

{
  // As três grandezas não são somáveis como uma única despesa.
  const rows = [
    record('nom', '2026-11', [price('n', 2, 100000)]),
    record('add', '2026-11', [price('a', 2, 300000, 'adicional', 'Informação de cobertura')]),
    record('inc', '2026-11', [price('i', 1, 200000, 'incluido', 'Contrato informado')]),
    record('pend', '2026-11', [price('p', 1, 500000)])
  ];
  const result = buildMonthlyForecast(rows, { selectedMonth: '2026-11', anchorMonth: '2026-11' });
  assert.equal(result.selected.recordCount, 4);
  assert.equal(result.selected.nominalUnits4, 1500000);
  assert.equal(result.selected.additionalUnits4, 600000);
  assert.equal(result.selected.pendingUnits4, 700000);
  assert.equal(result.selected.includedNominalUnits4, 200000);
  assert.equal(result.selected.coveragePendingCount, 2);
  assert.equal(result.selected.missingNominalCount, 0);
  assert.equal(result.selected.records.length, 4);
  assert.equal(result.months.length, 6);
  assert.equal(result.months.at(-1).month, '2026-11');
  assert.ok(result.selected.records.every(item => item.record.id));
}

{
  // Ausência não é zero informado, nem cobertura confirmada.
  const rows = [
    record('missing', '2026-11', [price('m', 1, null, 'adicional', 'Requer confirmação')]),
    record('zero', '2026-11', [price('z', 1, 0, 'adicional', 'Contrato informado')])
  ];
  const summary = buildMonthlyForecast(rows, { selectedMonth: '2026-11' }).selected;
  assert.equal(summary.additionalUnits4, 0);
  assert.equal(summary.missingNominalCount, 1);
  assert.equal(summary.incompleteRecordCount, 1);
  assert.equal(summary.additionalKnownLineCount, 1);
  assert.equal(summary.nominalUnits4, 0);
}

{
  // O mesmo ID reprogramado conserva apenas sua revisão mais recente.
  const versions = [
    record('visita-1', '2026-11', [price('i', 2, 200000, 'adicional', 'Cobertura')], '03.12.001', 1),
    record('visita-1', '2026-12', [price('i', 3, 200000, 'adicional', 'Cobertura')], '03.12.001', 2),
    record('visita-2', '2026-11', [price('j', 1, 100000, 'adicional', 'Cobertura')], '03.12.002', 1)
  ];
  const all = buildMonthlyForecast(versions, { selectedMonth: '2026-11', anchorMonth: '2026-12' });
  const november = all.months.find(item => item.month === '2026-11');
  const december = all.months.find(item => item.month === '2026-12');
  assert.equal(november.additionalUnits4, 100000);
  assert.equal(december.additionalUnits4, 600000);
  assert.equal(all.selected.recordCount, 1);
  const schoolOne = buildMonthlyForecast(versions, { schoolId: '03.12.001', selectedMonth: '2026-11', anchorMonth: '2026-12' });
  assert.equal(schoolOne.selected.recordCount, 0);
  assert.equal(schoolOne.months.find(item => item.month === '2026-12').additionalUnits4, 600000);
}

{
  // Uma soma monetária além da precisão segura não pode ser apresentada arredondada.
  const huge = Array.from({ length: 30 }, (_, i) =>
    record('r-' + i, '2026-11', [price('i-' + i, 45000, 10000000000, 'adicional', 'Informado')]));
  const result = buildMonthlyForecast(huge, { selectedMonth: '2026-11' });
  assert.equal(result.selected.additionalUnits4, null);
  assert.equal(result.selected.overflow, true);
}

{
  // Dado estruturalmente inválido é relatado como pendência, não vira valor válido.
  const invalid = record('bad', '2026-11', [price('b', 1, 10000)]);
  invalid.items[0].quantity = -2;
  const result = buildMonthlyForecast([invalid], { selectedMonth: '2026-11' });
  assert.equal(result.selected.invalidRecordCount, 1);
  assert.equal(result.selected.nominalUnits4, null);
  assert.equal(result.selected.records[0].invalid, true);
}

console.log('Etapa 2 | Previsão mensal: grandezas, competências, deduplicação, ausência/zero e limites passaram.');
