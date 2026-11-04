/**
 * Faixas técnicas do Anexo de proposta do TR, Lote 3 / CRE03, itens 29–42 (p. 58).
 * A cópia disponibilizada do TR não contém os preços adjudicados:
 * o campo de valor unitário está em branco. Nunca converter ausência em zero.
 *
 * Esta tabela é somente de enquadramento. A referência monetária só é
 * aplicada depois de carregar fonte/versionamento da planilha válida.
 * Enquadramento ou orçamento nominal NÃO constituem medição nem faturamento.
 */
import { normalizeEquipmentType, parseCapacityBtu } from './financialReference.js';
import { resolveAttendanceReference, formatMoneyUnits4 } from './attendanceEstimate.js';

export const CRE03_CATALOG_ID = 'CRE03-TR-LOTE-3';

const entries = [
  [29, 'ACJ', 1, 12000, 418],
  [30, 'ACJ', 12001, 24000, 779],
  [31, 'ACJ', 24001, 30000, 79],
  [32, 'SPLIT', 1, 12000, 224],
  [33, 'SPLIT', 12001, 24000, 1326],
  [34, 'SPLIT', 24001, 30000, 205],
  [35, 'SPLIT', 30001, Number.MAX_SAFE_INTEGER, 6],
  [36, 'CASSETE', 18000, 30000, 7],
  [37, 'CASSETE', 30001, 50000, 0],
  [38, 'CASSETE', 50001, 70000, 0],
  [39, 'PISO TETO', 30000, 36000, 2],
  [40, 'PISO TETO', 36001, 48000, 6],
  [41, 'PISO TETO', 48001, 60000, 9],
  [42, 'PISO TETO', 60001, 90000, 0]
];

export const CRE03_TR_ITEMS = Object.freeze(entries.map(([number, type, minBtu, maxBtu, estimatedCount]) =>
  Object.freeze({ number, code: 'CRE03-' + number, type, minBtu, maxBtu, estimatedCount })
));

export function findCre03TrItem(type, capacityBtu) {
  const kind = normalizeEquipmentType(type);
  const btu = parseCapacityBtu(capacityBtu);
  if (!kind || btu === null) return null;
  return CRE03_TR_ITEMS.find(item => item.type === kind && btu >= item.minBtu && btu <= item.maxBtu) || null;
}

/**
 * A fonte adjudicada é guardada em um único módulo, não reintroduzida em cada
 * atendimento. Permite preenchimento parcial por item, sempre com fonte/versão
 * e números positivos de quatro casas; rejeita valores sem lastro.
 */
export function createValidatedCre03Catalog(schedule) {
  if (!schedule || typeof schedule.sourceRef !== 'string' || !schedule.sourceRef.trim()
    || typeof schedule.version !== 'string' || !schedule.version.trim()) return null;
  const prices = schedule.pricesByItem;
  if (!prices || typeof prices !== 'object' || Array.isArray(prices)) return null;
  const known = new Set(CRE03_TR_ITEMS.map(item => String(item.number)));
  for (const [number, value] of Object.entries(prices)) {
    if (!known.has(number) || !Number.isSafeInteger(value) || value <= 0 || value > 10000000000) {
      throw new TypeError('Planilha contratual inválida: item ou preço sem validação.');
    }
  }
  return {
    id: CRE03_CATALOG_ID,
    status: 'validated',
    sourceRef: schedule.sourceRef.trim(),
    version: schedule.version.trim(),
    serviceKinds: ['preventiva', 'corretiva'],
    categories: CRE03_TR_ITEMS.filter(item => Object.hasOwn(prices, String(item.number))).map(item => ({
      code: item.code, type: item.type, minBtu: item.minBtu, maxBtu: item.maxBtu,
      priceUnits4: prices[item.number]
    }))
  };
}

/**
 * Só preenche um rascunho sem preço manual. Se tipo/BTU de um preço preenchido
 * automaticamente mudarem, revoga o preço anterior e reconsulta o catálogo.
 * Nunca aplica valores ausentes e nunca decide cobertura de corretivas.
 */
export function applyCre03TrPriceToDraft(item, serviceKind, schedule) {
  if (!item || !['preventiva', 'corretiva'].includes(serviceKind)) return item;
  const wasAutomatic = item.catalogId === CRE03_CATALOG_ID && item.referenceNature === 'contratual_informada';
  const hasOwnPrice = String(item.priceText ?? '').trim() !== '' || item.unitPriceUnits4 !== null
    && item.unitPriceUnits4 !== undefined;
  if (hasOwnPrice && !wasAutomatic) return item;

  const base = wasAutomatic ? {
    ...item, priceText: '', unitPriceUnits4: null, sourceRef: '',
    referenceNature: 'provisoria', referenceVersion: '', catalogId: '', categoryCode: ''
  } : item;

  const match = findCre03TrItem(base.equipmentType, base.capacityBtu);
  if (!match) return base;
  const catalog = createValidatedCre03Catalog(schedule);
  if (!catalog?.categories.some(entry => entry.code === match.code)) return base;

  const capacity = parseCapacityBtu(base.capacityBtu);
  const reference = resolveAttendanceReference({
    ...base, capacityBtu: capacity, unitPriceUnits4: null
  }, catalog, serviceKind);
  if (reference.unitPriceUnits4 === null) return base;
  return {
    ...base,
    priceText: formatMoneyUnits4(reference.unitPriceUnits4).replace(/^R\$\s*/, ''),
    unitPriceUnits4: reference.unitPriceUnits4,
    sourceRef: reference.sourceRef,
    referenceNature: reference.referenceNature,
    referenceVersion: reference.referenceVersion,
    catalogId: reference.catalogId,
    categoryCode: reference.categoryCode
  };
}
