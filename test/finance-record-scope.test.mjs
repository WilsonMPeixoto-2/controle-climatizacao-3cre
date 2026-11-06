import assert from 'node:assert/strict';
import { P0_TEST_MARKER, partitionFinancialRecords } from '../src/domain/financeRecordScope.js';

const synthetic = { id: 'p0-verificado', cycle: P0_TEST_MARKER, plannedMonth: '2099-12', revision: 3 };
const real = { id: 'real', cycle: 'Ciclo P0', plannedMonth: '2026-10', revision: 2 };
const futureReal = { id: 'futuro-real', cycle: '', plannedMonth: '2099-12', revision: 1 };
const zeroReal = { id: 'zero-real', cycle: 'Ciclo oficial', totalUnits4: 0 };
const result = partitionFinancialRecords([real, synthetic, futureReal, zeroReal]);
assert.deepEqual(result.homologation, [synthetic]);
assert.deepEqual(result.operational, [real, futureReal, zeroReal]);
assert.deepEqual(partitionFinancialRecords([]), { operational: [], homologation: [] });
assert.deepEqual(partitionFinancialRecords(null), { operational: [], homologation: [] });
console.log('Registros sintéticos de homologação isolados sem esconder registros de valor zero ou futuros legítimos.');
