import assert from 'node:assert/strict';
import { HISTORIC_CORRECTIVE_ROWS, aggregateHistoricCorrections, HISTORIC_CORRECTIVE_SOURCE } from '../src/domain/historicCorrections.js';

assert.equal(HISTORIC_CORRECTIVE_SOURCE.workbook, 'SETEMBRO.xlsx');
assert.equal(HISTORIC_CORRECTIVE_SOURCE.worksheet, 'Setembro');
assert.equal(HISTORIC_CORRECTIVE_ROWS.length, 28);

const all = aggregateHistoricCorrections();
assert.equal(all.total, 85, 'Lançamentos nas linhas 3 a 87, sem desduplicação silenciosa');
assert.equal(all.schoolCount, 25);
assert.equal(all.possibleDuplicates, 8);
assert.equal(all.recoveredIdentifiers, 6);
assert.deepEqual(all.byStatus, { resolvido:48, emAndamento:32, imprestabilidade:3, pendente:2 });
assert.deepEqual(all.byType, { split:57, acj:28 });
assert.deepEqual(all.byMonth.map(item=>({month:item.month,total:item.total,byStatus:item.byStatus})), [
  {month:'2026-09',total:41,byStatus:{resolvido:34,emAndamento:4,imprestabilidade:1,pendente:2}},
  {month:'2026-10',total:44,byStatus:{resolvido:14,emAndamento:28,imprestabilidade:2,pendente:0}}
]);
assert.ok(all.rows.every(item=>item.sourceRows.length===item.total));
assert.equal(new Set(all.rows.flatMap(item=>item.sourceRows)).size,85);
assert.deepEqual(all.rows.flatMap(item=>item.sourceRows).toSorted((a,b)=>a-b),Array.from({length:85},(_,i)=>i+3));
const october=aggregateHistoricCorrections({month:'2026-10'});
assert.equal(october.total,44);
assert.equal(october.schoolCount,14);
assert.equal(october.byStatus.emAndamento,28);
const school=aggregateHistoricCorrections({schoolId:'03.12.016'});
assert.equal(school.total,10);
assert.equal(school.possibleDuplicates,3);
assert.equal(school.recoveredIdentifiers,2);
assert.equal(aggregateHistoricCorrections({month:'2026-09',schoolId:'03.12.016'}).total,0);
assert.equal(aggregateHistoricCorrections({schoolId:'03.12.016',month:'2026-10'}).byStatus.emAndamento,10);
assert.equal(aggregateHistoricCorrections({schoolId:'inexistente'}).total,0);
console.log('Histórico SETEMBRO.xlsx: 85 registros, 25 escolas, 2 meses, vínculos e exceções auditados.');
