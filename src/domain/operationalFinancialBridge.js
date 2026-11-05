/**
 * Ponte LEITURA entre chamados operacionais e Gestão Financeira.
 * Nunca cria `atendimentos_economicos`, presume quantidade, cobertura,
 * execução, medição, nota fiscal ou pagamento.
 */
import { getTicketReferenceContext, ticketOpeningDate } from './financialPresentation.js';
import { normalizeCreSchoolId } from '../data/cre03PlanningBaseline.js';
import { findCre03TrItem } from './cre03TrCatalog.js';
import { CRE03_SIGNED_PRICE_SCHEDULE } from '../data/cre03SignedPriceSchedule.js';

function unitPriceForMaintenance(ticket) {
  const context = getTicketReferenceContext(ticket);
  // BTU pretendido em instalação/substituição não representa um aparelho
  // existente elegível à referência de manutenção.
  if (!context.maintenance || !context.existingBtu) return null;
  const match = findCre03TrItem(ticket.tipo_aparelho, context.existingBtu);
  const units4 = match && CRE03_SIGNED_PRICE_SCHEDULE.pricesByItem[match.number];
  return Number.isSafeInteger(units4) && units4 > 0 ? {
    units4, category: match.code, source: CRE03_SIGNED_PRICE_SCHEDULE.sourceRef
  } : null;
}

export function buildOperationalFinancialBridge(tickets = [], attendances = [], schoolId = '') {
  const schoolKey = normalizeCreSchoolId(schoolId);
  const unique = new Map();
  for (const row of Array.isArray(tickets) ? tickets : []) {
    const id = String(row?.id_chamado || '').trim();
    if (!id || unique.has(id) ||
      (schoolKey && normalizeCreSchoolId(row.designacao) !== schoolKey)) continue;
    unique.set(id, row);
  }
  const activeAttendances = new Map();
  for (const row of Array.isArray(attendances) ? attendances : []) {
    const id = typeof row?.id === 'string' ? row.id : null;
    if (!id) continue;
    const prior = activeAttendances.get(id);
    if (!prior || (Number(row.revision) || 0) > (Number(prior.revision) || 0)) activeAttendances.set(id, row);
  }
  const links = new Set([...activeAttendances.values()]
    .flatMap(row => Array.isArray(row.ticketIds) ? row.ticketIds.map(String) : []));
  const items = [...unique.values()].map(ticket => {
    const id = String(ticket.id_chamado);
    const context = getTicketReferenceContext(ticket);
    const unit = unitPriceForMaintenance(ticket);
    return {
      id, ticket, schoolId: normalizeCreSchoolId(ticket.designacao),
      opened: ticketOpeningDate(ticket), status: String(ticket.status_atual || 'Sem status'),
      type: String(ticket.tipo_demanda || 'Não informada'),
      maintenance: context.maintenance, linked: links.has(id),
      technicalDataMissing: context.maintenance && !unit,
      unitPriceUnits4: unit?.units4 ?? null,
      categoryCode: unit?.category ?? null,
      priceSource: unit?.source ?? null,
      // Quantidade não é inferida da demanda; total permanece ausente.
      totalReferenceUnits4: null
    };
  }).sort((a,b) => (b.opened || '').localeCompare(a.opened || '') || a.id.localeCompare(b.id));
  const linked = items.filter(x=>x.linked).length;
  return {
    totalTickets: items.length,
    linked,
    withoutFinancialRecord: items.length - linked,
    maintenanceTickets: items.filter(x=>x.maintenance).length,
    identifiableUnitPrices: items.filter(x=>x.unitPriceUnits4!==null).length,
    installationOrOther: items.filter(x=>!x.maintenance).length,
    withMissingTechnicalData: items.filter(x=>x.technicalDataMissing).length,
    totalBillableUnits4: null,
    tickets: items
  };
}
