import assert from 'node:assert/strict';
import { calculateAttendance, normalizeAttendance } from '../src/domain/attendanceEstimate.js';
import {
  CRE03_TR_ITEMS, CRE03_CATALOG_ID, findCre03TrItem,
  createValidatedCre03Catalog, applyCre03TrPriceToDraft
} from '../src/domain/cre03TrCatalog.js';
import { CRE03_SIGNED_PRICE_SCHEDULE } from '../src/data/cre03SignedPriceSchedule.js';

assert.equal(CRE03_TR_ITEMS.length, 14);
assert.equal(CRE03_TR_ITEMS.reduce((total, item) => total + item.estimatedCount, 0), 2861);
assert.equal(findCre03TrItem('Split', '12.000 BTUs')?.number, 32);
assert.equal(findCre03TrItem('split', 12001)?.number, 33);
assert.equal(findCre03TrItem('split', 24000)?.number, 33);
assert.equal(findCre03TrItem('split', 24001)?.number, 34);
assert.equal(findCre03TrItem('split', 30001)?.number, 35);
assert.equal(findCre03TrItem('janela', 12000)?.number, 29);
assert.equal(findCre03TrItem('ACJ', 30001), null);
assert.equal(findCre03TrItem('cassette', 18000)?.number, 36);
assert.equal(findCre03TrItem('cassette', 30001)?.number, 37);
assert.equal(findCre03TrItem('piso teto', 30000)?.number, 39);
assert.equal(findCre03TrItem('piso-teto', 60001)?.number, 42);
assert.equal(findCre03TrItem('cassete', 10000), null);
assert.equal(findCre03TrItem('split', ''), null);

// O próprio TR tem preços em branco; NÃO existe preço zero nem contrato inventado.
assert.equal(createValidatedCre03Catalog(CRE03_SIGNED_PRICE_SCHEDULE), null);
const item = {
  id: 'grupo-1', description: 'Manutenção', equipmentType: 'Split',
  capacityBtu: '12.000 BTUs', equipmentRef: '', quantity: '2',
  coverage: 'a_confirmar', referenceNature: 'provisoria',
  priceText: '', sourceRef: '', coverageSourceRef: '', referenceVersion: '',
  catalogId: '', categoryCode: ''
};
assert.deepEqual(applyCre03TrPriceToDraft(item, 'preventiva', CRE03_SIGNED_PRICE_SCHEDULE), item);

const synthetic = {
  sourceRef: 'FONTE SINTETICA DE TESTE - NAO USAR NO CONTRATO',
  version: 'TESTE-1',
  pricesByItem: { 32: 1234500, 33: 2500000 }
};
const catalog = createValidatedCre03Catalog(synthetic);
assert.equal(catalog.status, 'validated');
assert.equal(catalog.categories.length, 2);
assert.equal(catalog.categories[0].code, 'CRE03-32');
const priced = applyCre03TrPriceToDraft(item, 'preventiva', synthetic);
assert.equal(priced.catalogId, CRE03_CATALOG_ID);
assert.equal(priced.categoryCode, 'CRE03-32');
assert.equal(priced.referenceNature, 'contratual_informada');
assert.equal(priced.unitPriceUnits4, 1234500);
assert.equal(priced.priceText, '123,4500');
const saved = normalizeAttendance({
  schoolId: '03.12.001', plannedMonth: '2026-11', serviceKind: 'preventiva',
  ticketIds: ['GOP-AR-2026-0001'], items: [{ ...priced, quantity: 2 }]
});
assert.deepEqual(saved.ticketIds, ['GOP-AR-2026-0001']);
assert.equal(saved.items[0].categoryCode, 'CRE03-32');
assert.equal(calculateAttendance(saved).totalUnits4, 2469000);
const next = applyCre03TrPriceToDraft({ ...priced, capacityBtu: '18.000 BTUs' }, 'preventiva', synthetic);
assert.equal(next.categoryCode, 'CRE03-33');
assert.equal(next.unitPriceUnits4, 2500000);
assert.equal(next.priceText, '250,0000');
// Mudança para faixa ainda sem preço impede usar preço antigo.
const missing = applyCre03TrPriceToDraft({ ...next, capacityBtu: '27.000 BTUs' }, 'preventiva', synthetic);
assert.equal(missing.priceText, '');
assert.equal(missing.unitPriceUnits4, null);
assert.equal(missing.catalogId, '');
const manual = { ...item, priceText: '199,9900', sourceRef: 'Valor informado pelo fiscal' };
assert.deepEqual(applyCre03TrPriceToDraft(manual, 'preventiva', synthetic), manual);
assert.equal(applyCre03TrPriceToDraft(item, 'outra', synthetic), item);
assert.throws(() => createValidatedCre03Catalog({ ...synthetic, pricesByItem: { 32: -1 } }), /inválida/);
assert.throws(() => createValidatedCre03Catalog({ ...synthetic, pricesByItem: { 100: 1234500 } }), /inválida/);
console.log('CRE03 TR: 14 faixas; vinculação, cálculo, mudança e ausência de preços verificados.');
