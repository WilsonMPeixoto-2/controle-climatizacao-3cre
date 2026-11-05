import assert from 'node:assert/strict';
import { buildOperationalFinancialBridge } from '../src/domain/operationalFinancialBridge.js';
import { CRE03_PLANNING_BASELINE, aggregatePlanningBaseline } from '../src/data/cre03PlanningBaseline.js';
import { HISTORIC_CORRECTIVE_PROFILE } from '../src/data/historicCorrectivePriceProfile.js';

{
  assert.equal(CRE03_PLANNING_BASELINE.length, 134);
  const total = aggregatePlanningBaseline();
  assert.equal(total.schools, 134);
  assert.equal(total.equipmentCount, 3080);
  assert.equal(total.budgetUnits4, 5127003500);
  assert.deepEqual(total.byMonth.map(item => [item.month, item.schools, item.budgetUnits4]), [
    [1, 21, 846349400], [2, 22, 821408000], [3, 24, 842047400],
    [4, 20, 856326100], [5, 22, 889581400], [6, 25, 871291200]
  ]);
  assert.equal(aggregatePlanningBaseline('03.12.001').budgetUnits4, 77173600);
  assert.equal(aggregatePlanningBaseline('312001').budgetUnits4, 77173600);
  assert.equal(aggregatePlanningBaseline('312003').budgetUnits4, 16627700);
  assert.equal(aggregatePlanningBaseline('999999').schools, 0);
  assert.equal(CRE03_PLANNING_BASELINE.filter(x => x.hasIndividuallyClassifiedEquipment).length, 1);
}
{
  assert.equal(HISTORIC_CORRECTIVE_PROFILE.totalRows, 85);
  assert.equal(HISTORIC_CORRECTIVE_PROFILE.possibleDuplicateRows, 8);
  assert.equal(HISTORIC_CORRECTIVE_PROFILE.unserviceableRows, 3);
  assert.equal(HISTORIC_CORRECTIVE_PROFILE.knownGrossUnits4, 151565975);
  assert.equal(HISTORIC_CORRECTIVE_PROFILE.categories.reduce((sum, row) => sum + row.count, 0), 85);
  assert.equal(HISTORIC_CORRECTIVE_PROFILE.categories.reduce((sum, row) => sum + row.count * row.unitPriceUnits4, 0), HISTORIC_CORRECTIVE_PROFILE.knownGrossUnits4);
}
{
  const ticket = (id, demand = 'Substituição/Instalação de Aparelho', extra = {}) => ({
    id_chamado: id, designacao: '312001', tipo_demanda: demand,
    tipo_aparelho: 'Split', btu_pretendido: '12000',
    status_atual: '4 - Aguardando orçamento', criado_em: '2026-10-10T12:00:00Z',
    ...extra
  });
  const ticketA = ticket('GOP-001');
  const ticketB = ticket('GOP-002', 'Manutenção corretiva', { btu_existente: '12000' });
  const ticketC = ticket('GOP-003', 'Manutenção preventiva', { btu_existente: null });
  const all = buildOperationalFinancialBridge([ticketA,ticketB,ticketC],
    [{id:'fin-1',ticketIds:['GOP-001'],schoolId:'312001'}]);
  assert.equal(all.totalTickets, 3);
  assert.equal(all.linked, 1);
  assert.equal(all.withoutFinancialRecord, 2);
  assert.equal(all.maintenanceTickets, 2);
  assert.equal(all.identifiableUnitPrices, 1);
  assert.equal(all.installationOrOther, 1);
  assert.equal(all.totalBillableUnits4, null);
  assert.equal(all.tickets.find(x => x.id === 'GOP-001').unitPriceUnits4, null);
  assert.equal(all.tickets.find(x => x.id === 'GOP-002').unitPriceUnits4, 2397350);
  assert.equal(all.tickets.find(x => x.id === 'GOP-003').unitPriceUnits4, null);
  assert.equal(buildOperationalFinancialBridge([ticketA,ticketA],[]).totalTickets, 1);
  assert.equal(buildOperationalFinancialBridge([ticketA,ticketB],[], '312002').totalTickets, 0);
  assert.equal(buildOperationalFinancialBridge([ticketA,ticketB],[], '03.12.001').totalTickets, 2);
  assert.equal(buildOperationalFinancialBridge([ticketB],[]).totalBillableUnits4,null);
  assert.equal(buildOperationalFinancialBridge([],[]).linked, 0);
}
console.log('Integração operacional e fontes financeiras: 134 escolas, 6 meses, 85 corretivas, preço unitário e anti-duplicação PASS.');
