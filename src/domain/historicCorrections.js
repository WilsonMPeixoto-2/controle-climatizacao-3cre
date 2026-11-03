/**
 * Dados OPERACIONAIS históricos extraídos da planilha SETEMBRO.xlsx, aba
 * "Setembro", linhas 3–87. A coluna "Data" refere-se aos lançamentos,
 * NÃO à competência de medição/faturamento.
 *
 * Agregado por escola e mês para demonstração pública sem expor endereço,
 * salas, nomes de responsáveis ou detalhes sensíveis. Mesmo após o campo
 * "RESOLVIDO", nada aqui significa execução contratual atestada.
 * Duplicidades possíveis não são excluídas automaticamente: há registros
 * que podem representar aparelhos/ocorrências distintos.
 */
export const HISTORIC_CORRECTIVE_SOURCE = Object.freeze({
  workbook: 'SETEMBRO.xlsx',
  worksheet: 'Setembro',
  sourceRows: '3–87',
  dateColumn: 'E',
  statusColumn: 'K',
  dateRange: '25/09/2026–20/10/2026',
  provenance: 'Biblioteca do projeto CLIMATIZAÇÃO · arquivo de referência, não sincronizado'
});

// schoolId, schoolName, month, resolved, ongoing, unserviceable, pending,
// possibleDuplicatedRows, recoveredSchoolIdFromText, split, acj, Excel row refs.
const GROUPS = [
  ['03.12.002','EM Alcide de Gásperi','2026-10',0,1,0,0,0,0,1,0,[78]],
  ['03.12.009','EM George Sumner','2026-09',0,2,0,0,1,0,2,0,[70,71]],
  ['03.12.010','EM Pace','2026-10',1,0,0,0,0,0,1,0,[40]],
  ['03.12.012','EM Manoel Bonfim','2026-10',4,0,0,0,2,0,4,0,[3,4,5,6]],
  ['03.12.014','EM Nereu Sampaio','2026-10',0,4,0,0,0,0,4,0,[72,73,74,75]],
  ['03.12.016','EM Ceará','2026-10',0,10,0,0,3,2,10,0,[56,57,58,59,60,61,62,63,64,65]],
  ['03.12.017','EM Lauro Sodré','2026-10',0,2,0,0,1,0,2,0,[76,77]],
  ['03.12.020','EM Gustavo Armbrust','2026-10',5,0,0,0,0,0,5,0,[35,36,37,38,39]],
  ['03.12.022','EM Rubens Berardo','2026-09',1,0,0,0,0,0,0,1,[13]],
  ['03.12.022','EM Rubens Berardo','2026-10',1,0,0,0,0,0,0,1,[14]],
  ['03.12.024','EM Domingos Bebiano','2026-09',2,0,0,1,0,0,3,0,[53,54,55]],
  ['03.12.035','EM Antônio Pereira','2026-10',0,8,0,0,0,0,0,8,[79,80,81,82,83,84,85,86]],
  ['03.12.037','EM Professora Vera Saback Sampaio','2026-10',2,0,0,0,0,0,2,0,[32,33]],
  ['03.12.044','EM Elza Soares','2026-09',3,0,0,0,1,0,3,0,[19,20,21]],
  ['03.12.810','EDI Maria Mazzetti','2026-10',1,0,0,0,0,0,1,0,[34]],
  ['03.13.006','EM Rio de Janeiro','2026-09',6,0,0,0,0,2,3,3,[7,8,9,10,11,12]],
  ['03.13.015','EM República do Peru','2026-09',0,2,0,0,0,0,2,0,[66,67]],
  ['03.13.015','EM República do Peru','2026-10',0,2,0,0,0,0,2,0,[68,69]],
  ['03.13.019','EM Affonso Taunay','2026-10',0,1,0,0,0,0,1,0,[87]],
  ['03.13.021','EM Francisco Jobim','2026-09',5,0,1,0,0,0,0,6,[42,45,46,47,48,49]],
  ['03.13.035','EM Edgard Sussekind De Mendonça','2026-09',2,0,0,1,0,0,0,3,[50,51,52]],
  ['03.13.038','EM Londres','2026-09',3,0,0,0,0,2,3,0,[41,43,44]],
  ['03.13.041','EM Tobias Barreto','2026-09',2,0,0,0,0,0,1,1,[22,23]],
  ['03.13.046','EM República de El Salvador','2026-09',3,0,0,0,0,0,0,3,[24,25,26]],
  ['03.13.046','EM República de El Salvador','2026-10',0,0,2,0,0,0,0,2,[27,28]],
  ['03.13.049','EM Virgílio de Melo Franco','2026-09',2,0,0,0,0,0,2,0,[17,18]],
  ['03.13.054','EM Engenheiro Roberto Magno de Carvalho','2026-09',3,0,0,0,0,0,3,0,[29,30,31]],
  ['03.13.501','EM Senegal','2026-09',2,0,0,0,0,0,2,0,[15,16]]
];

export const HISTORIC_CORRECTIVE_ROWS = Object.freeze(GROUPS.map((row) => {
  const [schoolId,schoolName,month,resolvido,emAndamento,imprestabilidade,pendente,
    possibleDuplicates,recoveredIdentifiers,split,acj,sourceRows] = row;
  const total = resolvido+emAndamento+imprestabilidade+pendente;
  if (sourceRows.length !== total || split+acj !== total) {
    throw new Error('Inconsistência na extração histórica da escola ' + schoolId + ' / ' + month);
  }
  return Object.freeze({
    schoolId,schoolName,month,total,
    byStatus:Object.freeze({resolvido,emAndamento,imprestabilidade,pendente}),
    byType:Object.freeze({split,acj}),
    possibleDuplicates,recoveredIdentifiers,
    sourceRows:Object.freeze(sourceRows)
  });
}));

function emptyStatus() {
  return {resolvido:0,emAndamento:0,imprestabilidade:0,pendente:0};
}
function emptyTypes() {
  return {split:0,acj:0};
}
function sumRows(rows,month='') {
  const byStatus=emptyStatus();
  const byType=emptyTypes();
  const schools=new Set();
  let total=0,possibleDuplicates=0,recoveredIdentifiers=0;
  for(const row of rows) {
    total+=row.total;
    schools.add(row.schoolId);
    possibleDuplicates+=row.possibleDuplicates;
    recoveredIdentifiers+=row.recoveredIdentifiers;
    for(const key of Object.keys(byStatus)) byStatus[key]+=row.byStatus[key];
    for(const key of Object.keys(byType)) byType[key]+=row.byType[key];
  }
  return {month,total,schoolCount:schools.size,byStatus,byType,possibleDuplicates,recoveredIdentifiers};
}

/**
 * Seleção pura e auditável. Sem extrapolações de valores monetários ou
 * inferências de atesto. Status "resolvido" é somente texto da fonte.
 */
export function aggregateHistoricCorrections({schoolId='',month=''}={}) {
  const filtered=HISTORIC_CORRECTIVE_ROWS.filter(row=>
    (!schoolId||row.schoolId===String(schoolId))&&(!month||row.month===month));
  const months=[...new Set(filtered.map(row=>row.month))].sort();
  return {
    ...sumRows(filtered),
    rows:filtered,
    byMonth:months.map(m=>sumRows(filtered.filter(row=>row.month===m),m))
  };
}
