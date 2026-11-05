/**
 * O teste P0 de 05/11/2026 comprovou escrita real no Firestore, mas seu
 * atendimento sintético não representa trabalho do contrato. Preservar toda a
 * trilha documental e oferecer consulta expressa sem contá-lo por padrão.
 * Excluir somente este marcador comprovado, nunca presumir que ano futuro
 * ou preço zero significa teste.
 */
export const P0_TEST_MARKER = 'TESTE SINTETICO P0 GOP MEMORIA V8.7.2 2026-11-05';

export function partitionFinancialRecords(records) {
  const operational = [];
  const homologation = [];
  for (const record of Array.isArray(records) ? records : []) {
    (record?.cycle === P0_TEST_MARKER ? homologation : operational).push(record);
  }
  return { operational, homologation };
}
