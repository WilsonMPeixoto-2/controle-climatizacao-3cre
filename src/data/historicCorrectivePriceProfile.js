/**
 * Cenário BRUTO de preços unitários identificáveis nos 85 lançamentos de
 * SETEMBRO.xlsx, aba Setembro, H/I (tipo e BTU) e K (situação), linhas 3–87.
 *
 * Cada linha = uma ocorrência lançada, NÃO necessariamente um aparelho
 * distinto nem um serviço executado. 8 possíveis duplicidades e 3 indicações
 * de imprestabilidade NÃO podem virar valor devido/medido/aceito.
 * A projeção por categoria é meramente INFORMATIVA e não se soma à previsão
 * mensal de atendimentos ou ao planejamento preventivo.
 */
import { CRE03_SIGNED_PRICE_SCHEDULE } from './cre03SignedPriceSchedule.js';

export const HISTORIC_CORRECTIVE_PROFILE = Object.freeze({
  workbook: 'SETEMBRO.xlsx',
  worksheet: 'Setembro',
  rows: '3–87',
  period: '2026-09 a 2026-10',
  totalRows: 85,
  possibleDuplicateRows: 8,
  unserviceableRows: 3,
  resolvedRows: 48,
  ongoingRows: 32,
  pendingRows: 2,
  // Contagens por preço de referência técnico CRE03 (não são novas notas nem OES).
  categories: Object.freeze([[29,2],[30,22],[31,4],[32,2],[33,43],[34,12]]
    .map(([item, count]) => Object.freeze({
      item, count, unitPriceUnits4: CRE03_SIGNED_PRICE_SCHEDULE.pricesByItem[item]
    }))),
  get knownGrossUnits4() {
    return this.categories.reduce((sum, item) => sum + item.count * item.unitPriceUnits4, 0);
  }
});
