/**
 * TABELA OPERACIONAL DE PREÇOS — CRE03 / contrato 59/2026.
 *
 * Base recuperada da planilha CLIMATIZACAO_V8_7_2_Painel_Lateral.xlsx,
 * aba CATEGORIAS, coluna F (UNIT_CALC), células F6:F16.
 * Fonte de apoio corroborada pelo PDF
 * 03_Faturamento_Conformidade_e_Pagamentos_V4_1_Visualizacao.pdf,
 * página 5 ("Tabela TR P01 a P11", remissão a MEMÓRIA_CRE 03.xlsx).
 *
 * Verificação independente: soma por categoria
 *   QTD_TR × UNIT_CALC × 4 = R$ 2.035.894,2700,
 * exatamente o teto de 4 ciclos informado na mesma planilha.
 *
 * Esta tabela deve ser UTILIZADA no cálculo automático de orçamentos e estimativas
 * da gestão financeira, por decisão expressa do responsável pelo projeto.
 * `status: working` identifica proveniência da memória recuperada, NÃO impede
 * o cálculo. Pagamento/atesto dependem dos procedimentos próprios de fiscalização.
 *
 * Unidades monetárias são inteiros de R$ 0,0001 (quatro casas).
 * Os itens 37, 38 e 42 têm QTD_TR zero e não constam da memória P01-P11:
 * AUSÊNCIA de preço não significa preço zero.
 *
 * Não reescrever snapshots já gravados. Um eventual documento definitivo
 * deverá ser confrontado item a item e versionado explicitamente.
 *
 * O nome histórico da constante é mantido para compatibilidade do código,
 * sem implicar assinatura ou aprovação da planilha atual.
 */
export const CRE03_SIGNED_PRICE_SCHEDULE = Object.freeze({
  status: 'working',
  sourceRef: 'CLIMATIZACAO_V8_7_2_Painel_Lateral.xlsx | CATEGORIAS!F6:F16 (UNIT_CALC) | conferido com o teto R$ 2.035.894,27',
  version: 'MEMORIA_V8.7.2_2026-10-26_EM_CONFERENCIA',
  pricesByItem: Object.freeze({
    29: 695600,   // P01 • ACJ até 12.000 BTU • R$ 69,5600
    30: 889275,   // P02 • ACJ 12.001–24.000 BTU • R$ 88,9275
    31: 1010550,  // P03 • ACJ 24.001–30.000 BTU • R$ 101,0550
    32: 2397350,  // P04 • Split até 12.000 BTU • R$ 239,7350
    33: 2196075,  // P05 • Split 12.001–24.000 BTU • R$ 219,6075
    34: 2278550,  // P06 • Split 24.001–30.000 BTU • R$ 227,8550
    35: 2657750,  // P07 • Split acima de 30.000 BTU • R$ 265,7750
    36: 3745200,  // P08 • Cassete 18.000–30.000 BTU • R$ 374,5200
    39: 2969350,  // P09 • Piso-teto 30.000–36.000 BTU • R$ 296,9350
    40: 4146000,  // P10 • Piso-teto 36.001–48.000 BTU • R$ 414,6000
    41: 4146000   // P11 • Piso-teto 48.001–60.000 BTU • R$ 414,6000
  })
});
