/**
 * Projeção de PRIMEIRO CICLO SEMESTRAL, NÃO execução ou pagamento.
 *
 * Fonte: 01_Planejamento_e_Pedidos_Escolas_V4_Editorial.xlsx (Biblioteca),
 * aba AGENDAR VISITAS, A8:I141, salvo em 27/10/2026.
 * A=escola, D=aparelhos, F=mês RELATIVO 1–6, I=orçamento da planilha.
 * Células G (data) sem preenchimento e H='A agendar' para as 134 escolas.
 * Somente a escola 312001 tem 37 aparelhos classificados individualmente na
 * mesma planilha; demais linhas baseiam orçamento na projeção por parque.
 * Não confundir 'Mês 1' com janeiro, novembro/2026 ou competência financeira.
 * Valores extraídos dos resultados calculados em R$ com 2 casas decimais.
 */
export const CRE03_PLANNING_SOURCE = Object.freeze({
  workbook: '01_Planejamento_e_Pedidos_Escolas_V4_Editorial.xlsx',
  sheet: 'AGENDAR VISITAS',
  range: 'A8:I141',
  updated: '2026-10-27',
  status: 'proposta_nao_aprovada',
  firstCycleOnly: true,
  noDatedVisits: true
});
const RAW = "312001,3,43,771736|312002,2,27,448948|312003,2,10,166277|312004,2,29,482203|312005,2,48,798129|312006,2,23,382437|312008,3,45,748246|312009,4,40,665108|312010,1,14,232788|312011,1,25,415692|312012,2,35,581969|312013,2,17,282671|312014,1,45,748246|312015,1,14,232788|312016,1,44,731618|312017,1,25,415692|312018,1,24,399065|312019,1,32,532086|312020,1,24,399065|312021,1,34,565341|312022,1,22,365809|312023,1,25,415692|312024,1,21,349181|312025,1,16,266043|312027,1,32,532086|312029,2,12,199532|312030,2,18,299298|312031,2,33,548714|312032,2,32,532086|312033,2,37,615225|312034,2,22,365809|312035,2,32,532086|312037,3,27,448948|312041,1,29,482203|312043,4,64,1064172|312044,4,45,748246|312501,2,31,515458|312502,2,15,249415|312503,1,37,615225|312601,1,13,216160|312602,2,14,232788|312603,2,10,166277|312801,1,9,149649|312802,3,10,166277|312803,3,13,216160|312804,2,14,232788|312805,1,13,216160|312806,1,11,182905|312807,2,7,116394|312809,3,21,349181|312810,2,14,232788|312811,3,19,315926|312812,2,14,232788|312813,4,29,482203|313001,4,23,382437|313002,4,29,482203|313003,4,42,698363|313005,4,12,199532|313006,4,25,415692|313007,4,18,299298|313008,4,26,432320|313011,5,34,565341|313012,5,24,399065|313013,5,46,764874|313014,4,17,282671|313015,5,37,615225|313016,5,18,299298|313018,5,28,465575|313019,5,12,199532|313020,5,42,698363|313021,3,27,448948|313022,5,46,764874|313023,6,22,365809|313024,3,30,498831|313025,5,21,349181|313026,5,7,116394|313027,5,37,615225|313029,5,23,382437|313030,5,33,548714|313031,5,19,315926|313032,6,23,382437|313033,6,22,365809|313034,6,17,282671|313035,6,17,282671|313036,6,46,764874|313037,6,14,232788|313038,6,19,315926|313040,6,40,665108|313041,6,30,498831|313042,6,26,432320|313043,6,18,299298|313044,6,50,831385|313046,6,29,482203|313048,6,7,116394|313049,6,38,631852|313051,3,25,415692|313052,3,35,581969|313053,3,29,482203|313054,3,21,349181|313055,6,8,133022|313056,4,32,532086|313501,4,30,498831|313502,4,29,482203|313503,5,36,598597|313601,6,7,116394|313602,5,10,166277|313603,6,9,149649|313604,4,13,216160|313606,4,6,99766|313607,5,12,199532|313608,6,14,232788|313609,5,9,149649|313610,5,9,149649|313611,4,14,232788|313612,3,13,216160|313801,4,10,166277|313802,3,9,149649|313803,5,17,282671|313804,5,15,249415|313805,6,14,232788|313806,6,13,216160|313807,6,12,199532|313808,4,11,182905|313809,6,10,166277|313830,6,19,315926|328501,3,27,448948|328601,3,10,166277|328602,3,5,83138|328604,3,8,133022|328801,3,11,182905|329001,3,39,648480|329801,3,11,182905|330601,3,9,149649|330602,3,16,266043";

/** Formato compacto verificável: designação, mês relativo, aparelhos, R$ em centavos. */
export const CRE03_PLANNING_BASELINE = Object.freeze(RAW.split('|').map(line => {
  const [schoolId, month, equipmentCount, budgetCents] = line.split(',');
  return Object.freeze({
    schoolId,
    month: Number(month),
    equipmentCount: Number(equipmentCount),
    budgetUnits4: Number(budgetCents) * 100,
    hasIndividuallyClassifiedEquipment: schoolId === '312001'
  });
}));

export function normalizeCreSchoolId(value) {
  if (value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  return digits ? digits.replace(/^0+/, '') : '';
}

/**
 * Planejamento não é realizado, faturado nem medido. Agregado somente sobre
 * escolas visíveis no cadastro quando supplied schoolIds não vazio.
 */
export function aggregatePlanningBaseline(schoolId = '') {
  const code = normalizeCreSchoolId(schoolId);
  const selected = CRE03_PLANNING_BASELINE.filter(row => !code || row.schoolId === code);
  const byMonth = Array.from({ length: 6 }, (_, index) => {
    const month = index + 1, scoped = selected.filter(row => row.month === month);
    return {
      month, schools: scoped.length,
      equipmentCount: scoped.reduce((sum, row) => sum + row.equipmentCount, 0),
      budgetUnits4: scoped.reduce((sum, row) => sum + row.budgetUnits4, 0)
    };
  });
  return {
    schools: selected.length,
    equipmentCount: selected.reduce((sum, row) => sum + row.equipmentCount, 0),
    budgetUnits4: selected.reduce((sum, row) => sum + row.budgetUnits4, 0),
    withIndividualEquipment: selected.filter(row => row.hasIndividuallyClassifiedEquipment).length,
    byMonth,
    rows: selected
  };
}
