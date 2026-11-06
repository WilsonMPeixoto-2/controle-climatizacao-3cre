/**
 * Planejamento ajustável, sem alterar a referência V4.
 * Cada escola tem no máximo um ajuste ativo. Ajustes arquivados reativam a
 * referência original; novas escolas deixam de aparecer no planejamento.
 * Os valores são estimativas, nunca execução/medição ou faturamento.
 */
import { CRE03_PLANNING_BASELINE, normalizeCreSchoolId } from '../data/cre03PlanningBaseline.js';

const MAX_BUDGET_UNITS4 = 1000000000000;
export const MAX_PLANNED_EQUIPMENT = 100000;
export function normalizePlanningAdjustment(data) {
  const schoolId = normalizeCreSchoolId(data?.schoolId);
  if (!/^[0-9]{6}$/.test(schoolId)) throw new Error('Informe um código de escola com seis números.');
  const month = Number(data.month);
  if (!Number.isSafeInteger(month) || month < 1 || month > 6) {
    throw new Error('Selecione um mês de 1 a 6 no ciclo.');
  }
  const equipmentCount = Number(data.equipmentCount);
  if (!Number.isSafeInteger(equipmentCount) || equipmentCount < 0 || equipmentCount > MAX_PLANNED_EQUIPMENT) {
    throw new Error('Informe uma quantidade inteira válida de equipamentos.');
  }
  const budgetUnits4 = data.budgetUnits4 == null ? null : Number(data.budgetUnits4);
  if (budgetUnits4 !== null && (!Number.isSafeInteger(budgetUnits4) || budgetUnits4 < 0 || budgetUnits4 > MAX_BUDGET_UNITS4)) {
    throw new Error('Informe um orçamento válido ou deixe-o em branco.');
  }
  const schoolLabel = String(data.schoolLabel ?? '').trim();
  if (schoolLabel.length > 160) throw new Error('Nome de escola muito longo.');
  return { schoolId, month, equipmentCount, budgetUnits4, schoolLabel, archived: Boolean(data.archived) };
}
export function proratedPlanningBudget({equipmentCount: previousCount, budgetUnits4: previousBudget}, nextCount) {
  if (!Number.isSafeInteger(nextCount) || nextCount < 0) return null;
  if (!Number.isSafeInteger(previousCount) || previousCount <= 0
    || !Number.isSafeInteger(previousBudget) || previousBudget < 0) return null;
  // Arredondamento determinístico em inteiros de R$ 0,0001; sem ponto flutuante.
  const numerator = BigInt(previousBudget) * BigInt(nextCount);
  return Number((numerator + BigInt(previousCount) / 2n) / BigInt(previousCount));
}
export function aggregateAdjustedPlanning(adjustments = [], selectedSchoolId = '', baseline = CRE03_PLANNING_BASELINE) {
  const byId = new Map(baseline.map(row => [normalizeCreSchoolId(row.schoolId), {...row, source: 'referencia', schoolLabel: ''}]));
  for (const item of Array.isArray(adjustments) ? adjustments : []) {
    const adjustment = normalizePlanningAdjustment(item);
    if (adjustment.archived) continue;
    // A fonte original é preservada, mesmo quando um ajuste a substitui.
    byId.set(adjustment.schoolId, { ...adjustment, source: 'ajustado',
      hasIndividuallyClassifiedEquipment: byId.get(adjustment.schoolId)?.hasIndividuallyClassifiedEquipment || false });
  }
  const wanted = normalizeCreSchoolId(selectedSchoolId);
  const rows = [...byId.values()].filter(row => !wanted || normalizeCreSchoolId(row.schoolId) === wanted)
    .sort((a,b)=>a.schoolId.localeCompare(b.schoolId));
  const byMonth = Array.from({length:6},(_,i)=>{
    const selected = rows.filter(row=>row.month===i+1);
    return {month:i+1, schools:selected.length,
      equipmentCount:selected.reduce((n,row)=>n+row.equipmentCount,0),
      budgetUnits4:selected.reduce((n,row)=>n+(row.budgetUnits4??0),0),
      unknownBudgetCount:selected.filter(row=>row.budgetUnits4===null).length };
  });
  return {
    schools: rows.length,
    equipmentCount: rows.reduce((n,row)=>n+row.equipmentCount,0),
    budgetUnits4: rows.reduce((n,row)=>n+(row.budgetUnits4??0),0),
    unknownBudgetCount: rows.filter(row=>row.budgetUnits4===null).length,
    adjustedCount: rows.filter(row=>row.source==='ajustado').length,
    withIndividualEquipment: rows.filter(row=>row.hasIndividuallyClassifiedEquipment).length,
    rows, byMonth
  };
}
