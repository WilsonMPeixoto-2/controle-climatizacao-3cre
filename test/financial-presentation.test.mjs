import assert from 'node:assert/strict';
import { getTicketReferenceContext, getOperationalSlice } from '../src/domain/financialPresentation.js';
import { REFERENCE_STATUS } from '../src/domain/financialReference.js';

// Somente fixtures fictícias; nenhum catálogo ou preço entra na apresentação.
const maintenance = Object.freeze({ tipo_demanda: 'Manutenção Corretiva', tipo_aparelho: 'Split', btu_existente: '12000', btu_pretendido: '18000' });
const context = getTicketReferenceContext(maintenance);
assert.equal(context.reference.status, REFERENCE_STATUS.PENDING_CATALOG);
assert.equal(context.reference.priceUnits4, null);
assert.equal(context.capacitySource, 'BTU existente');
assert.match(context.capacityNote, /confirmação/);
assert.equal(context.existingBtu, 12000);
assert.equal(context.intendedBtu, 18000);
assert.equal(getTicketReferenceContext({ ...maintenance, btu_existente: '' }).capacitySource, 'BTU pretendido');
assert.match(getTicketReferenceContext({ ...maintenance, btu_existente: '' }).capacityNote, /pretendido/);
assert.equal(getTicketReferenceContext({ ...maintenance, btu_existente: '', btu_pretendido: '' }).reference.status, REFERENCE_STATUS.PENDING_EQUIPMENT);
assert.equal(getTicketReferenceContext({ ...maintenance, tipo_aparelho: 'Split e Janela' }).reference.status, REFERENCE_STATUS.PENDING_EQUIPMENT);
for (const tipo_demanda of ['Nova Instalação', 'Substituição de Aparelho', 'Adequação infra/elétrica', '', 'Outros']) {
  assert.equal(getTicketReferenceContext({ ...maintenance, tipo_demanda }).maintenance, false);
}
assert.deepEqual(getTicketReferenceContext({ ...maintenance, status_atual: '11 - Concluído' }), context);

const school = { designacao: 'TESTE-A', unidade_escolar: 'Unidade Fictícia A' };
const tickets = Object.freeze([
  Object.freeze({ id_chamado: 'A', designacao: 'TESTE-A', criado_em: '2026-03-01T00:00:00Z' }),
  Object.freeze({ id_chamado: 'B', unidade_escolar: 'unidade ficticia a', data_solicitacao: '2026-03-31' }),
  Object.freeze({ id_chamado: 'C', designacao: 'TESTE-B', criado_em: '2026-03-10' }),
  Object.freeze({ id_chamado: 'D', designacao: 'TESTE-A', criado_em: '2026-04-01' }),
  Object.freeze({ id_chamado: 'E', designacao: 'TESTE-A', criado_em: '' }),
  Object.freeze({ id_chamado: 'F', designacao: 'TESTE-A', criado_em: '2026-02-30' })
]);
assert.equal(getOperationalSlice(tickets, {}).tickets.length, 6);
const slice = getOperationalSlice(tickets, { school, month: '2026-03' });
assert.deepEqual(slice.tickets.map(t => t.id_chamado).sort(), ['A', 'B']);
assert.equal(slice.undatedCount, 2);
assert.equal(getOperationalSlice(tickets, { school }).tickets.length, 5);
assert.equal(getOperationalSlice(tickets, { month: '2026-03' }).tickets.length, 3);
assert.equal(getOperationalSlice(tickets, { month: '2030-01' }).tickets.length, 0);
assert.equal(getOperationalSlice([], {}).tickets.length, 0);
console.log('F1–F3 | apresentação: ausência, origem de BTU, demanda, filtros, datas e imutabilidade passaram.');
