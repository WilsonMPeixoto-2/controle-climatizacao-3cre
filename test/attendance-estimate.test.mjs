import assert from 'node:assert/strict';
import {
  MAX_ATTENDANCE_ITEMS,
  MAX_TICKET_LINKS,
  normalizeAttendance,
  calculateAttendance,
  parseMoneyUnits4,
  formatMoneyUnits4,
  resolveAttendanceReference
} from '../src/domain/attendanceEstimate.js';

// Todos os preços e fontes abaixo são FICTÍCIOS, restritos a testes.
const manual = (id, extra = {}) => ({
  id, description: 'Grupo fictício', quantity: 2,
  unitPriceUnits4: 1234567, referenceNature: 'provisoria',
  sourceRef: 'Cenário fictício de teste; sem valor contratual', ...extra
});
const attendance = (extra = {}) => ({
  schoolId: '03.01.001', plannedMonth: '2026-11', serviceKind: 'preventiva',
  sessionId: 'sessao-teste-a', items: [manual('grupo-a')], ...extra
});

// Duas escolas, múltiplos grupos, precisão de quatro casas e sem inventário.
const first = normalizeAttendance(attendance({ items: [manual('grupo-a'), manual('grupo-b', {
  quantity: 3, unitPriceUnits4: 234567, equipmentType: 'Tipo ainda não identificado'
})] }));
assert.equal(MAX_ATTENDANCE_ITEMS, 4);
assert.equal(MAX_TICKET_LINKS, 8);
assert.deepEqual(first.itemIds, ['grupo-a', 'grupo-b']);
assert.equal(first.items[0].lineTotalUnits4, 2469134);
assert.equal(first.items[1].lineTotalUnits4, 703701);
assert.equal(first.items[1].capacityBtu, null);
assert.equal(first.items[1].equipmentRef, '');
assert.equal(calculateAttendance(first).totalUnits4, 3172835);
assert.equal(calculateAttendance(attendance({ schoolId: '03.02.002', items: [manual('grupo-c', {
  quantity: 1, unitPriceUnits4: 999999
})] })).totalUnits4, 999999);

// A composição contém apenas o contrato de conteúdo, sem status ou atos financeiros.
assert.deepEqual(Object.keys(first).sort(), [
  'schoolId', 'plannedMonth', 'plannedDate', 'serviceKind', 'cycle', 'visitId', 'ticketIds',
  'responsibleLabel', 'sessionId', 'items', 'itemIds'
].sort());
assert.deepEqual(Object.keys(first.items[0]).sort(), [
  'id', 'description', 'equipmentType', 'capacityBtu', 'equipmentRef', 'quantity', 'coverage',
  'referenceNature', 'unitPriceUnits4', 'sourceRef', 'coverageSourceRef', 'referenceVersion', 'catalogId',
  'categoryCode', 'lineTotalUnits4'
].sort());
assert.equal(calculateAttendance(attendance({ status: 'concluido', paid: true })).totalUnits4, 2469134);
assert.equal('status' in normalizeAttendance(attendance({ status: 'concluido' })), false);

// Ausência é diferente de zero, inclusive sem uma única parcela conhecida.
const absent = normalizeAttendance(attendance({ items: [{ id: 'pendente' }] }));
assert.equal(absent.items[0].quantity, null);
assert.equal(absent.items[0].unitPriceUnits4, null);
assert.equal(absent.items[0].referenceNature, 'nao_informada');
assert.equal(absent.items[0].coverage, 'a_confirmar');
assert.equal(absent.items[0].coverageSourceRef, '');
assert.deepEqual(calculateAttendance(absent), {
  totalUnits4: null, knownSubtotalUnits4: null, missingCount: 1, complete: false,
  compositionComplete: false, coveragePendingCount: 1, referenceMissingCount: 1, nominalMissingCount: 1,
  lines: [{ ...absent.items[0], nominalTotalUnits4: null, amountNature: 'estimativa_nominal', referenceComplete: false }]
});
const zero = calculateAttendance(attendance({ items: [manual('zero', { quantity: 0, unitPriceUnits4: 0 })] }));
assert.equal(zero.totalUnits4, 0);
assert.equal(zero.complete, true);
const partial = calculateAttendance(attendance({ items: [manual('conhecido'), { id: 'sem-preco', quantity: 1 }] }));
assert.equal(partial.totalUnits4, null);
assert.equal(partial.knownSubtotalUnits4, 2469134);
assert.equal(partial.missingCount, 1);
assert.equal(partial.complete, false);
assert.equal(calculateAttendance(attendance({ items: [manual('sem-qtd', { quantity: null })] })).totalUnits4, null);
assert.equal(calculateAttendance(attendance({ items: [{ id: 'zero-sem-preco', quantity: 0 }] })).totalUnits4, null);
const previewInput = attendance({ items: [manual('conhecido'), manual('origem-a-preencher', { sourceRef: '' })] });
const previewSnapshot = structuredClone(previewInput);
const draft = calculateAttendance(previewInput, { draft: true });
assert.equal(draft.totalUnits4, null);
assert.equal(draft.knownSubtotalUnits4, 2469134);
assert.equal(draft.missingCount, 1);
assert.deepEqual(previewInput, previewSnapshot);
assert.throws(() => normalizeAttendance(previewInput), /origem|sourceRef/i);

// Cenário semântico 1: origem de preço não demonstra custo nominal zero nem cobertura.
const includedWithoutPrice = manual('incluido-sem-preco', {
  quantity: 3, coverage: 'incluido', unitPriceUnits4: null,
  sourceRef: 'Tabela nominal FICTÍCIA; preço ainda não informado'
});
const unsubstantiatedIncluded = calculateAttendance(attendance({ items: [includedWithoutPrice] }));
assert.equal(unsubstantiatedIncluded.totalUnits4, null);
assert.equal(unsubstantiatedIncluded.lines[0].nominalTotalUnits4, null);
assert.equal(unsubstantiatedIncluded.lines[0].amountNature, 'estimativa_nominal');
assert.equal(unsubstantiatedIncluded.lines[0].referenceComplete, false);
assert.equal(unsubstantiatedIncluded.coveragePendingCount, 1);
const covered = calculateAttendance(attendance({ serviceKind: 'corretiva', items: [{
  ...includedWithoutPrice, coverageSourceRef: 'Decisão de cobertura FICTÍCIA, apenas teste'
}] }));
assert.equal(covered.totalUnits4, 0); // Grandeza: incremento adicional informado, não preço nominal.
assert.equal(covered.complete, true);
assert.equal(covered.compositionComplete, true);
assert.equal(covered.lines[0].amountNature, 'incremento_adicional');
assert.equal(covered.lines[0].unitPriceUnits4, null);
assert.equal(covered.lines[0].nominalTotalUnits4, null);
assert.equal(covered.lines[0].referenceComplete, false);
assert.equal(covered.referenceMissingCount, 1);
assert.equal(covered.nominalMissingCount, 1);
assert.equal(covered.coveragePendingCount, 0);
const coverageOnly = calculateAttendance(attendance({ items: [{
  id: 'so-origem-cobertura', quantity: 2, coverage: 'incluido',
  coverageSourceRef: 'Decisão de cobertura FICTÍCIA sem tabela nominal'
}] }));
assert.equal(coverageOnly.totalUnits4, 0);
assert.equal(coverageOnly.lines[0].sourceRef, '');
assert.equal(coverageOnly.lines[0].unitPriceUnits4, null);
assert.equal(coverageOnly.lines[0].amountNature, 'incremento_adicional');
assert.equal(coverageOnly.lines[0].referenceComplete, false);

// Cenário semântico 2: natureza informada sem preço permanece referência pendente.
const informedWithoutPrice = calculateAttendance(attendance({ items: [manual('informado-sem-preco', {
  quantity: 2, referenceNature: 'informada', unitPriceUnits4: null
})] }));
assert.equal(informedWithoutPrice.lines[0].referenceNature, 'informada');
assert.equal(informedWithoutPrice.lines[0].referenceComplete, false);
assert.equal(informedWithoutPrice.referenceMissingCount, 1);
assert.equal(informedWithoutPrice.nominalMissingCount, 1);
assert.equal(informedWithoutPrice.totalUnits4, null);
assert.equal(informedWithoutPrice.complete, false);

// Cenário semântico 3: completude aritmética não confirma cobertura.
const pendingCoverage = calculateAttendance(attendance({ items: [manual('cobertura-pendente', { coverage: 'a_confirmar' })] }));
assert.equal(pendingCoverage.totalUnits4, 2469134);
assert.equal(pendingCoverage.lines[0].nominalTotalUnits4, 2469134);
assert.equal(pendingCoverage.lines[0].amountNature, 'estimativa_nominal');
assert.equal(pendingCoverage.complete, true);
assert.equal(pendingCoverage.compositionComplete, true);
assert.equal(pendingCoverage.coveragePendingCount, 1);
assert.equal(pendingCoverage.referenceMissingCount, 0);
assert.equal(pendingCoverage.nominalMissingCount, 0);
assert.equal('coverageConfirmed' in pendingCoverage, false);
assert.equal('coverageConfirmed' in pendingCoverage.lines[0], false);

// Cenários semânticos 4/5: custo nominal e origem preservados; fontes são fatos separados.
const nominalItem = manual('nominal-preservado', {
  coverage: 'incluido', sourceRef: 'Tabela de preço nominal FICTÍCIA'
});
const priceSourceOnly = calculateAttendance(attendance({ items: [nominalItem] }));
assert.equal(priceSourceOnly.totalUnits4, 2469134);
assert.equal(priceSourceOnly.lines[0].amountNature, 'estimativa_nominal');
assert.equal(priceSourceOnly.coveragePendingCount, 1);
const explicitCoverageItem = { ...nominalItem, coverageSourceRef: 'Registro FICTÍCIO de decisão de cobertura' };
const nominalSnapshot = structuredClone(explicitCoverageItem);
const explicitCovered = calculateAttendance(attendance({ items: [explicitCoverageItem] }));
assert.equal(explicitCovered.totalUnits4, 0);
assert.equal(explicitCovered.lines[0].amountNature, 'incremento_adicional');
assert.equal(explicitCovered.lines[0].nominalTotalUnits4, 2469134);
assert.equal(explicitCovered.lines[0].unitPriceUnits4, 1234567);
assert.equal(explicitCovered.lines[0].sourceRef, nominalItem.sourceRef);
assert.equal(explicitCovered.lines[0].coverageSourceRef, explicitCoverageItem.coverageSourceRef);
assert.equal(explicitCovered.lines[0].referenceComplete, true);
assert.equal(explicitCovered.nominalMissingCount, 0);
assert.equal(explicitCovered.referenceMissingCount, 0);
assert.equal(explicitCovered.coveragePendingCount, 0);
assert.deepEqual(explicitCoverageItem, nominalSnapshot);
const normalizedFromCalculation = normalizeAttendance(attendance({ items: explicitCovered.lines }));
assert.equal('nominalTotalUnits4' in normalizedFromCalculation.items[0], false);
assert.equal('amountNature' in normalizedFromCalculation.items[0], false);
assert.equal('referenceComplete' in normalizedFromCalculation.items[0], false);
assert.equal(normalizedFromCalculation.items[0].coverageSourceRef, explicitCoverageItem.coverageSourceRef);
const noQuantity = calculateAttendance(attendance({ items: [{ ...explicitCoverageItem, quantity: null }] }));
assert.equal(noQuantity.lines[0].amountNature, 'estimativa_nominal');
assert.equal(noQuantity.lines[0].nominalTotalUnits4, null);
assert.equal(noQuantity.lines[0].referenceComplete, true);
assert.equal(noQuantity.totalUnits4, null);
assert.equal(noQuantity.referenceMissingCount, 0);
assert.equal(noQuantity.nominalMissingCount, 1);
assert.equal(noQuantity.coveragePendingCount, 0);
assert.equal(calculateAttendance(attendance({ items: [manual('adicional-pendente', { coverage: 'adicional' })] })).coveragePendingCount, 1);
assert.equal(calculateAttendance(attendance({ items: [manual('adicional-informado', {
  coverage: 'adicional', coverageSourceRef: 'Registro FICTÍCIO de incidência adicional'
})] })).coveragePendingCount, 0);
assert.equal(calculateAttendance(attendance({ items: [{ id: 'origem-pendente', quantity: 1, coverage: 'incluido' }] })).totalUnits4, null);
assert.equal(calculateAttendance(attendance({ items: [manual('incluido-sem-qtd', { quantity: null, coverage: 'incluido' })] })).totalUnits4, null);

// Correção é imutável e totais/espelho recebidos não são confiáveis.
const original = attendance({ items: [manual('estavel', { lineTotalUnits4: 1 })], itemIds: ['forjado'] });
const snapshot = structuredClone(original);
const normalized = normalizeAttendance(original);
assert.deepEqual(original, snapshot);
assert.equal(normalized.items[0].lineTotalUnits4, 2469134);
assert.deepEqual(normalized.itemIds, ['estavel']);
const corrected = normalizeAttendance({ ...normalized, items: [{ ...normalized.items[0], quantity: 3, unitPriceUnits4: 100001 }] });
assert.equal(corrected.items[0].id, 'estavel');
assert.equal(corrected.schoolId, original.schoolId);
assert.equal(corrected.items[0].lineTotalUnits4, 300003);
assert.equal(normalized.items[0].lineTotalUnits4, 2469134);
assert.notEqual(calculateAttendance(normalized).lines, normalized.items);

// Valores informados exigem origem; origem contratual exige catálogo e versão.
assert.throws(() => normalizeAttendance(attendance({ items: [manual('sem-fonte', { sourceRef: '' })] })), /origem|sourceRef/i);
assert.throws(() => normalizeAttendance(attendance({ items: [manual('sem-natureza', { referenceNature: 'nao_informada' })] })), /natureza|referenceNature/i);
assert.equal(normalizeAttendance(attendance({ items: [manual('natureza-inferida', { referenceNature: undefined })] })).items[0].referenceNature, 'informada');
assert.throws(() => normalizeAttendance(attendance({ items: [manual('contratual', { referenceNature: 'contratual_informada' })] })), /cat.logo|vers.o|catalogId/i);
assert.equal(normalizeAttendance(attendance({ items: [manual('contratual', {
  referenceNature: 'contratual_informada', catalogId: 'catalogo-ficticio', referenceVersion: 'teste-v1'
})] })).items[0].referenceNature, 'contratual_informada');

// Validações técnicas de estrutura, identidade, competência e limites seguros.
assert.throws(() => normalizeAttendance(null));
assert.throws(() => normalizeAttendance(attendance({ schoolId: '' })));
assert.throws(() => normalizeAttendance(attendance({ schoolId: 'escola/invalida' })));
assert.throws(() => normalizeAttendance(attendance({ plannedMonth: '2026-13' })));
assert.throws(() => normalizeAttendance(attendance({ plannedMonth: '0000-01' })));
assert.throws(() => normalizeAttendance(attendance({ plannedDate: '2026-11-31' })));
assert.throws(() => normalizeAttendance(attendance({ plannedDate: '2026-12-01' })));
assert.equal(normalizeAttendance(attendance({ plannedMonth: '2028-02', plannedDate: '2028-02-29' })).plannedDate, '2028-02-29');
assert.throws(() => normalizeAttendance(attendance({ plannedMonth: '2027-02', plannedDate: '2027-02-29' })));
assert.throws(() => normalizeAttendance(attendance({ items: [] })));
assert.throws(() => normalizeAttendance(attendance({ items: new Array(1) })));
assert.throws(() => normalizeAttendance(attendance({ items: Array.from({ length: 5 }, (_, i) => ({ id: `i-${i}` })) })));
assert.throws(() => normalizeAttendance(attendance({ items: [{ id: 'repete' }, { id: 'repete' }] })));
assert.throws(() => normalizeAttendance(attendance({ ticketIds: ['GOP-AR-2026-0001', 'GOP-AR-2026-0001'] })));
assert.throws(() => normalizeAttendance(attendance({ ticketIds: new Array(1) })));
assert.throws(() => normalizeAttendance(attendance({ ticketIds: Array.from({ length: 9 }, (_, i) => `GOP-${i}`) })));
assert.equal(normalizeAttendance(attendance({ ticketIds: ['GOP-AR-2026-0001', 'GOP-AR-2026-0002'] })).ticketIds.length, 2);
assert.throws(() => normalizeAttendance(attendance({ serviceKind: 'faturado' })));
for (const quantity of [-1, 0.5, NaN, Infinity, '2', 1000001]) {
  assert.throws(() => normalizeAttendance(attendance({ items: [manual('qtd', { quantity })] })));
}
for (const unitPriceUnits4 of [-1, 0.1, NaN, Infinity, '10000', 10000000001]) {
  assert.throws(() => normalizeAttendance(attendance({ items: [manual('preco', { unitPriceUnits4 })] })));
}
assert.throws(() => normalizeAttendance(attendance({ items: [manual('grande', { quantity: 1000000, unitPriceUnits4: 10000000000 })] })));
assert.throws(() => normalizeAttendance(attendance({ items: [manual('nominal-grande-incluido', {
  quantity: 1000000, unitPriceUnits4: 10000000000, coverage: 'incluido', coverageSourceRef: 'Documento FICTÍCIO de cobertura'
})] })));
assert.throws(() => normalizeAttendance(attendance({ items: [manual('fonte-longa', { coverageSourceRef: 'x'.repeat(301) })] })));
assert.throws(() => normalizeAttendance(attendance({ items: [manual('texto', { description: 'x'.repeat(501) })] })));
assert.throws(() => normalizeAttendance(attendance({ sessionId: 'x'.repeat(129) })));
const maximum = calculateAttendance(attendance({ items: Array.from({ length: 4 }, (_, i) => manual(`max-${i}`, {
  quantity: 45000, unitPriceUnits4: 10000000000
})) }));
assert.equal(maximum.totalUnits4, 1800000000000000);
assert.equal(Number.isSafeInteger(maximum.totalUnits4), true);

// Dinheiro é convertido por dígitos inteiros, sem perda por ponto flutuante.
for (const [input, expected] of [
  ['1.234,5678', 12345678], ['1234.5678', 12345678], ['1234,56', 12345600],
  ['R$ 0,0001', 1], ['0', 0], ['0,00', 0], ['1.234.567,89', 12345678900],
  ['1234.567', 12345670], ['900719925474.0991', Number.MAX_SAFE_INTEGER], ['', null], ['  ', null], [null, null], [undefined, null]
]) assert.equal(parseMoneyUnits4(input), expected, `Conversão de ${String(input)}`);
for (const input of ['1.234', '12.345', '0.123', '1,234.56', '-1', '+1', 'NaN', 'Infinity', '1e3', '1,00001', '1234.00001', '12.34,56', '900719925474.0992', 0]) {
  assert.throws(() => parseMoneyUnits4(input), undefined, `Deve rejeitar ${String(input)}`);
}
assert.equal(formatMoneyUnits4(12345678), 'R$ 1.234,5678');
assert.equal(formatMoneyUnits4(1), 'R$ 0,0001');
assert.equal(formatMoneyUnits4(0), 'R$ 0,0000');
assert.equal(formatMoneyUnits4(null), 'Não informado');
assert.equal(formatMoneyUnits4(12345678, { digits: 2 }), 'R$ 1.234,57');
assert.equal(formatMoneyUnits4(Number.MAX_SAFE_INTEGER), 'R$ 900.719.925.474,0991');
assert.throws(() => formatMoneyUnits4(-1));
assert.throws(() => formatMoneyUnits4(1, { digits: 5 }));

// Consulta E1 gera um snapshot explícito, sem reconsultar catálogo ao recalcular.
const catalog = {
  id: 'catalogo-ficticio', status: 'draft', sourceRef: 'Tabela FICTÍCIA, apenas teste', version: 'teste-v1',
  categories: [{ code: 'TESTE-1', type: 'SPLIT', minBtu: 9000, maxBtu: 24000, priceUnits4: 1234567 }]
};
const linkedItem = resolveAttendanceReference({ id: 'catalogado', equipmentType: 'SPLIT', capacityBtu: 12000, quantity: 2 }, catalog, 'preventiva');
assert.equal(linkedItem.referenceNature, 'provisoria');
assert.equal(linkedItem.catalogId, 'catalogo-ficticio');
assert.equal(linkedItem.referenceVersion, 'teste-v1');
assert.equal(linkedItem.coverage, 'a_confirmar');
assert.equal(linkedItem.unitPriceUnits4, 1234567);
const stable = normalizeAttendance(attendance({ items: [linkedItem] }));
catalog.categories[0].priceUnits4 = 9876543;
assert.equal(calculateAttendance(stable).totalUnits4, 2469134);
const confirmedItem = resolveAttendanceReference({ id: 'confirmado', equipmentType: 'SPLIT', capacityBtu: 12000, quantity: 1 }, { ...catalog, status: 'validated' }, 'corretiva');
assert.equal(confirmedItem.referenceNature, 'contratual_informada');
assert.equal(confirmedItem.coverage, 'a_confirmar');
assert.equal(resolveAttendanceReference({ id: 'manual', quantity: 1 }, null, 'outra').unitPriceUnits4, null);
assert.equal(resolveAttendanceReference({ id: 'sem-tipo', quantity: 1 }, catalog, 'preventiva').equipmentType, '');
assert.deepEqual(resolveAttendanceReference(manual('manual-preservado'), catalog, 'preventiva'), normalizeAttendance(attendance({ items: [manual('manual-preservado')] })).items[0]);
assert.equal(resolveAttendanceReference({ id: 'fonte-ausente', equipmentType: 'SPLIT', capacityBtu: 12000 }, { ...catalog, sourceRef: '' }, 'preventiva').unitPriceUnits4, null);
assert.equal(resolveAttendanceReference({ id: 'outro-servico', equipmentType: 'SPLIT', capacityBtu: 12000 }, { ...catalog, serviceKind: 'preventiva' }, 'corretiva').unitPriceUnits4, null);

console.log('Etapa 1 | attendanceEstimate: cenários econômicos e limites estruturais passaram.');
