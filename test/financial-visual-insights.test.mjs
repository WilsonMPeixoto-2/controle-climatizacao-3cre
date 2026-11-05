import assert from 'node:assert/strict';
import { buildCoverageComposition, buildServiceProfile } from '../src/domain/financialVisualInsights.js';

const full = {
  recordCount: 3, nominalUnits4: 1000000, includedNominalUnits4: 500000,
  additionalUnits4: 300000, pendingUnits4: 200000,
  missingNominalCount: 0, invalidRecordCount: 0, overflow: false
};
{
  const composition = buildCoverageComposition(full);
  assert.equal(composition.totalUnits4, 1000000);
  assert.deepEqual(composition.segments.map(item => [item.key, item.units4, item.percent]), [
    ['included', 500000, 50],
    ['additional', 300000, 30],
    ['pending', 200000, 20]
  ]);
  assert.equal(composition.segments.reduce((sum, item) => sum + item.units4, 0), full.nominalUnits4);
}
{
  // Nenhuma proporção ou gráfico é inventado quando falta preço, há overflow
  // ou a soma da cobertura não fecha com a referência nominal.
  assert.equal(buildCoverageComposition({ ...full, missingNominalCount: 1 }), null);
  assert.equal(buildCoverageComposition({ ...full, overflow: true }), null);
  assert.equal(buildCoverageComposition({ ...full, invalidRecordCount: 1 }), null);
  assert.equal(buildCoverageComposition({ ...full, nominalUnits4: 0 }), null);
  assert.equal(buildCoverageComposition({ ...full, additionalUnits4: 200000 }), null);
  assert.equal(buildCoverageComposition({ ...full, includedNominalUnits4: null, additionalUnits4: null, pendingUnits4: 1000000 }).segments[2].percent, 100);
  assert.equal(buildCoverageComposition({ ...full, nominalUnits4: null }), null);
}
{
  const rows = [
    { record: { id: 'a', serviceKind: 'preventiva', ticketIds: ['GOP-1'] }, incomplete: false },
    { record: { id: 'b', serviceKind: 'corretiva', ticketIds: [] }, incomplete: true, coveragePendingCount: 1 },
    { record: { id: 'c', serviceKind: 'preventiva', ticketIds: ['GOP-2'] }, incomplete: true, coveragePendingCount: 1 },
    { record: { id: 'd', serviceKind: 'outra', ticketIds: [] }, incomplete: false },
    { record: { id: 'e', serviceKind: '', ticketIds: [] }, incomplete: false }
  ];
  const profile = buildServiceProfile(rows);
  assert.equal(profile.total, 5);
  assert.equal(profile.linked, 2);
  assert.equal(profile.incomplete, 2);
  assert.deepEqual(profile.groups.map(item => [item.key, item.count, item.percent]), [
    ['preventiva', 2, 40], ['corretiva', 1, 20], ['outra', 2, 40]
  ]);
  assert.equal(profile.groups.reduce((n, item) => n + item.count, 0), profile.total);
  assert.deepEqual(buildServiceProfile([]).groups.map(item => item.percent), [0, 0, 0]);
  assert.equal(buildServiceProfile([]).total, 0);
}
console.log('Inteligência visual financeira: composição, ausência/overflow, atividades e vínculos PASS.');
