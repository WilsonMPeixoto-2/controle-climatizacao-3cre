import assert from 'node:assert/strict';
import { getOpeningTrend } from '../src/domain/operationalPulse.js';

const schools = [
  { designacao: '03.10.001', unidade_escolar: 'Escola de teste A' },
  { designacao: '03.10.002', unidade_escolar: 'Escola de teste B' }
];
const tickets = Object.freeze([
  { designacao: schools[0].designacao, criado_em: '2026-08-05' },
  { designacao: schools[0].designacao, criado_em: '2026-09-13' },
  { designacao: schools[0].designacao, criado_em: '2026-09-28' },
  { designacao: schools[1].designacao, criado_em: '2026-10-02' },
  { designacao: schools[1].designacao, criado_em: '' },
  { designacao: schools[1].designacao, criado_em: '2026-13-02' }
]);
const snapshot = JSON.stringify(tickets);
const trend = getOpeningTrend(tickets);
assert.equal(trend.length, 6);
assert.equal(trend.at(-1).month, '2026-10');
assert.deepEqual(trend.slice(-3).map(item => item.count), [1, 2, 1]);
assert.equal(trend.at(-1).label, 'out');
assert.equal(trend.every(item => item.selected === false), true);
const filtered = getOpeningTrend(tickets, { school: schools[0] });
assert.equal(filtered.at(-1).month, '2026-09');
assert.equal(filtered.at(-1).count, 2);
const selected = getOpeningTrend(tickets, { selectedMonth: '2026-11' });
assert.equal(selected.at(-1).month, '2026-11');
assert.equal(selected.at(-1).count, 0);
assert.equal(selected.at(-1).selected, true);
assert.equal(selected.find(item => item.month === '2026-10').count, 1);
assert.deepEqual(getOpeningTrend([{ criado_em: '' }]), []);
assert.deepEqual(getOpeningTrend([]), []);
assert.equal(getOpeningTrend([], { selectedMonth: '2026-09' }).at(-1).count, 0);
assert.deepEqual(getOpeningTrend([], { selectedMonth: '2026-99' }), []);
assert.equal(getOpeningTrend(tickets, { periods: 30 }).length, 12);
assert.equal(JSON.stringify(tickets), snapshot);
console.log('Etapa 2 | Tendência real de abertura: meses, filtros e ausência de datas passaram.');
