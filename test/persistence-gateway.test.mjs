import assert from 'node:assert/strict';
import { createSupabasePersistence } from '../src/infrastructure/supabase/supabasePersistence.js';

console.log('🔬 INICIANDO TESTES DO CONTRATO NEUTRO DE PERSISTÊNCIA...');

const calls = [];
const channelHandlers = [];

const makeSelectChain = (table) => ({
  select(fields) {
    assert.equal(fields, '*');
    return {
      order(field, options) {
        calls.push(['order', table, field, options || null]);
        const fixtures = {
          escolas: [{ designacao: '031234', unidade_escolar: 'Escola Teste' }],
          chamados: [{ id_chamado: 'GOP-AR-2026-0001', setor_responsavel: 'Unidade Escolar / GIN' }],
          historico: [{ id_evento: 'EV-1', data: '2026-08-01T12:00:00.000Z' }]
        };
        return { data: fixtures[table] || [], error: null };
      }
    };
  }
});

const client = {
  from(table) {
    if (table === 'modelos_email') {
      return {
        select(fields) {
          assert.equal(fields, '*');
          return {
            order(field) {
              assert.equal(field, 'id');
              return { data: [{ id: 1, template: 'Modelo' }], error: null };
            }
          };
        }
      };
    }
    if (table === 'historico') {
      return {
        ...makeSelectChain(table),
        insert(rows) {
          calls.push(['insert-history', rows]);
          return {
            select() {
              return {
                single() {
                  return { data: { ...rows[0], persisted: true }, error: null };
                }
              };
            }
          };
        }
      };
    }
    return makeSelectChain(table);
  },
  rpc(name, params) {
    calls.push(['rpc', name, params]);
    if (name === 'create_ticket_with_history') {
      return { data: { ...params.p_ticket, id_chamado: 'GOP-AR-2026-0099' }, error: null };
    }
    if (name === 'save_ticket_with_history') {
      return { data: { ...params.p_ticket, persisted: true }, error: null };
    }
    throw new Error(`RPC inesperada: ${name}`);
  },
  channel(name) {
    calls.push(['channel', name]);
    const chain = {
      on(type, filter, handler) {
        channelHandlers.push({ type, filter, handler });
        return chain;
      },
      subscribe() {
        calls.push(['subscribe']);
        return chain;
      }
    };
    return chain;
  },
  removeChannel(channel) {
    calls.push(['removeChannel', channel]);
  }
};

const persistence = createSupabasePersistence(client);

assert.equal(persistence.provider, 'supabase');
assert.equal(persistence.capabilities.realtime, true);
assert.equal(persistence.capabilities.attachments, true);
assert.equal(typeof persistence.loadInitialData, 'function');
assert.equal(typeof persistence.createTicketWithHistory, 'function');
assert.equal(typeof persistence.updateTicketWithHistory, 'function');
assert.equal(typeof persistence.insertHistoryEvent, 'function');
assert.equal(typeof persistence.subscribeOperationalData, 'function');
console.log('[PASSED] 1. adapter expõe contrato neutro e capacidades');

const initial = await persistence.loadInitialData();
assert.equal(initial.schools.length, 1);
assert.equal(initial.tickets.length, 1);
assert.equal(initial.history.length, 1);
assert.equal(initial.emailTemplates.length, 1);
assert.equal(initial.tickets[0].setor_responsavel, 'GIN / Unidade Escolar');
console.log('[PASSED] 2. carga inicial agrega os quatro conjuntos operacionais');

const created = await persistence.createTicketWithHistory({ foo: 1 }, { evento: 1 });
assert.equal(created.ticket.id_chamado, 'GOP-AR-2026-0099');
assert.equal(created.event.id_chamado, 'GOP-AR-2026-0099');
console.log('[PASSED] 3. criação delega gravação atômica mantendo retorno neutro');

const updated = await persistence.updateTicketWithHistory(
  { id_chamado: 'GOP-AR-2026-0099' },
  [{ id_evento: 'EV-2' }]
);
assert.equal(updated.persisted, true);
console.log('[PASSED] 4. atualização delega persistência transacional');

const inserted = await persistence.insertHistoryEvent({ id_evento: 'EV-3' });
assert.equal(inserted.persisted, true);
console.log('[PASSED] 5. histórico é persistido pelo mesmo contrato');

let ticketsSnapshot = null;
let historySnapshot = null;
const unsubscribe = persistence.subscribeOperationalData({
  onTickets: (rows) => { ticketsSnapshot = rows; },
  onHistory: (rows) => { historySnapshot = rows; }
});
assert.equal(channelHandlers.length, 2);
assert.deepEqual(channelHandlers.map((h) => h.filter.table).sort(), ['chamados', 'historico']);
await channelHandlers[0].handler();
await new Promise((resolve) => setTimeout(resolve, 450));
assert.ok(Array.isArray(ticketsSnapshot));
assert.ok(Array.isArray(historySnapshot));
unsubscribe();
assert.ok(calls.some((entry) => entry[0] === 'removeChannel'));
console.log('[PASSED] 6. realtime é encapsulado e devolve função de cleanup');

assert.equal(persistence.getLegacyAttachmentClient(), client);
console.log('[PASSED] 7. cliente de anexos legado fica explicitamente isolado para transição');

console.log('🎉 CONTRATO NEUTRO DE PERSISTÊNCIA VALIDADO!\n');
