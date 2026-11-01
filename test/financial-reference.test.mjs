/**
 * Testes de fundação E1: regras isoladas, sem Firestore, valores contratuais ou dados reais.
 * Executar: node test/financial-reference.test.mjs
 */
import assert from 'node:assert/strict';
import {
  REFERENCE_STATUS,
  normalizeEquipmentType,
  parseCapacityBtu,
  consultContractReference,
  formatReferenceUnits4,
  sumReportedValues
} from '../src/domain/financialReference.js';

const catalog = {
  status: 'validated',
  sourceRef: 'FONTE_FICTICIA_EXCLUSIVA_DE_TESTE',
  version: 'TESTE-1',
  categories: [
    { code: 'T-S1', type: 'SPLIT', minBtu: 1, maxBtu: 12000, priceUnits4: 123456 },
    { code: 'T-S2', type: 'SPLIT', minBtu: 12001, maxBtu: 24000, priceUnits4: 234567 },
    { code: 'T-C1', type: 'CASSETE', minBtu: 18000, maxBtu: 30000, priceUnits4: 345678 },
    { code: 'T-P1', type: 'PISO TETO', minBtu: 30000, maxBtu: 36000, priceUnits4: 456789 }
  ]
};

// Normalização estrita: variantes permitidas sem adivinhar aparelhos.
assert.equal(normalizeEquipmentType('piso-teto'), 'PISO TETO');
assert.equal(normalizeEquipmentType('janela'), 'ACJ');
assert.equal(normalizeEquipmentType('cassette'), 'CASSETE');
assert.equal(normalizeEquipmentType('centrifugador'), null);
assert.equal(parseCapacityBtu('24.000 BTUs'), 24000);
assert.equal(parseCapacityBtu(24000), 24000);
assert.equal(parseCapacityBtu('12,5'), null);
assert.equal(parseCapacityBtu('12.00'), null);
assert.equal(parseCapacityBtu(''), null);
assert.equal(parseCapacityBtu(0), null);

// Nunca classificar sem dados, catálogo validado ou fonte rastreável.
assert.equal(consultContractReference({ type: '', btu: 24000 }, catalog).status, REFERENCE_STATUS.PENDING_EQUIPMENT);
assert.equal(consultContractReference({ type: 'SPLIT', btu: '' }, catalog).status, REFERENCE_STATUS.PENDING_EQUIPMENT);
assert.equal(consultContractReference({ type: 'SPLIT', btu: 24000 }).status, REFERENCE_STATUS.PENDING_CATALOG);
assert.equal(consultContractReference({ type: 'SPLIT', btu: 24000 }, { ...catalog, status: 'draft' }).status, REFERENCE_STATUS.PENDING_CATALOG);
assert.equal(consultContractReference({ type: 'SPLIT', btu: 24000 }, { ...catalog, sourceRef: '' }).status, REFERENCE_STATUS.PENDING_CATALOG);
assert.equal(consultContractReference({ type: 'SPLIT', btu: 24000, outsideScope: true }, catalog).status, REFERENCE_STATUS.PENDING_SCOPE);

// Faixas estritas, inclusive para Cassete e Piso-Teto.
const identified = consultContractReference({ type: 'split', btu: '24.000 BTUs' }, catalog);
assert.equal(identified.status, REFERENCE_STATUS.IDENTIFIED);
assert.equal(identified.categoryCode, 'T-S2');
assert.equal(identified.priceUnits4, 234567);
assert.equal(identified.catalogVersion, 'TESTE-1');
assert.equal(consultContractReference({ type: 'CASSETE', btu: 12000 }, catalog).status, REFERENCE_STATUS.UNMATCHED);
assert.equal(consultContractReference({ type: 'PISO TETO', btu: 18000 }, catalog).status, REFERENCE_STATUS.UNMATCHED);
assert.equal(consultContractReference({ type: 'SPLIT', btu: 70000 }, catalog).status, REFERENCE_STATUS.UNMATCHED);

// Não presume fora de escopo pelo tipo; exige referência explícita.
assert.equal(
  consultContractReference({ type: 'SPLIT', btu: 24000, outsideScope: true, outsideEvidence: 'REGISTRO-DE-VALIDACAO' }, catalog).status,
  REFERENCE_STATUS.OUTSIDE_CONFIRMED
);

// Catálogo defeituoso ou sobreposto não pode gerar precificação silenciosa.
assert.equal(
  consultContractReference({ type: 'SPLIT', btu: 24000 }, { ...catalog, categories: [...catalog.categories, { code: 'X', type: 'SPLIT', minBtu: 22000, maxBtu: 30000, priceUnits4: 111111 }] }).status,
  REFERENCE_STATUS.AMBIGUOUS
);
assert.equal(
  consultContractReference({ type: 'SPLIT', btu: 24000 }, { ...catalog, categories: [{ code: 'X', type: 'SPLIT', minBtu: 0, maxBtu: 24000, priceUnits4: 111111 }] }).status,
  REFERENCE_STATUS.INVALID_CATALOG
);

// Preservar precisão interna de 4 casas, sem arredondar o preço do contrato.
assert.equal(formatReferenceUnits4(234567), '23.4567');
assert.equal(formatReferenceUnits4(1), '0.0001');
assert.equal(formatReferenceUnits4(0), '0.0000');
assert.equal(formatReferenceUnits4(null), null);

// Null não significa zero. Zero efetivamente informado é número legítimo.
assert.deepEqual(sumReportedValues([{ valueUnits4: 0 }, { valueUnits4: 234567 }], 'valueUnits4'), {
  total: 234567, knownSubtotal: 234567, missingCount: 0, invalidCount: 0, complete: true
});
assert.deepEqual(sumReportedValues([{ valueUnits4: null }, { valueUnits4: 234567 }], 'valueUnits4'), {
  total: null, knownSubtotal: 234567, missingCount: 1, invalidCount: 0, complete: false
});
assert.equal(sumReportedValues([{ valueUnits4: -1 }], 'valueUnits4').total, null);
assert.equal(sumReportedValues([], 'valueUnits4').total, null);

console.log('E1 | financialReference: todos os cenários passaram.');
