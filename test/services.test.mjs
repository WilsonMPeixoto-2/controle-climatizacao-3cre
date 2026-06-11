/**
 * services.test.mjs — Testes unitários para a camada de serviços (escolas, historico, chamados).
 * Executa em Node.js puro.
 */

import assert from 'node:assert/strict';
import { fetchEscolas } from '../src/services/escolasService.js';
import { fetchHistorico, insertHistoryEvent } from '../src/services/historicoService.js';
import {
  fetchChamados,
  createTicketWithHistory,
  updateTicketWithHistory
} from '../src/services/chamadosService.js';

console.log('🔬 INICIANDO TESTES UNITÁRIOS DA CAMADA DE SERVIÇOS...');

// 1) Teste escolasService
{
  const mockClient = {
    from: (table) => {
      assert.equal(table, 'escolas');
      return {
        select: (fields) => {
          assert.equal(fields, '*');
          return {
            order: (field) => {
              assert.equal(field, 'unidade_escolar');
              return {
                data: [{ unidade_escolar: 'Escola A' }],
                error: null
              };
            }
          };
        }
      };
    }
  };

  const res = await fetchEscolas(mockClient);
  assert.equal(res.length, 1);
  assert.equal(res[0].unidade_escolar, 'Escola A');
  console.log('[PASSED] 1. fetchEscolas carrega e ordena');
}

// 2) Teste historicoService
{
  const mockClient = {
    from: (table) => {
      assert.equal(table, 'historico');
      return {
        select: (fields) => {
          assert.equal(fields, '*');
          return {
            order: (field, opts) => {
              assert.equal(field, 'data');
              assert.deepEqual(opts, { ascending: false });
              return {
                data: [{ id_evento: 'EV-1' }],
                error: null
              };
            }
          };
        },
        insert: (rows) => {
          assert.deepEqual(rows, [{ val: 123 }]);
          return {
            select: (fields) => {
              assert.equal(fields, '*');
              return {
                single: () => {
                  return {
                    data: { id_evento: 'EV-SAVED', val: 123 },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const resList = await fetchHistorico(mockClient);
  assert.equal(resList.length, 1);
  assert.equal(resList[0].id_evento, 'EV-1');

  const resInsert = await insertHistoryEvent(mockClient, { val: 123 });
  assert.equal(resInsert.id_evento, 'EV-SAVED');
  console.log('[PASSED] 2. fetchHistorico e insertHistoryEvent funcionam');
}

// 3) Teste chamadosService
{
  const mockClient = {
    from: (table) => {
      assert.equal(table, 'chamados');
      return {
        select: (fields) => {
          assert.equal(fields, '*');
          return {
            order: (field, opts) => {
              assert.equal(field, 'id_chamado');
              assert.deepEqual(opts, { ascending: false });
              return {
                data: [{ id_chamado: 'GOP-1', setor_responsavel: 'Unidade Escolar / GIN' }],
                error: null
              };
            }
          };
        }
      };
    },
    rpc: (name, params) => {
      if (name === 'create_ticket_with_history') {
        assert.deepEqual(params, { p_ticket: { id: 1 }, p_event: { event: 1 } });
        return {
          data: { id_chamado: 'GOP-CREATED', id: 1 },
          error: null
        };
      }
      if (name === 'save_ticket_with_history') {
        assert.deepEqual(params, { p_ticket: { id: 2 }, p_events: [{ event: 2 }] });
        return {
          data: { id_chamado: 'GOP-UPDATED', id: 2 },
          error: null
        };
      }
      throw new Error('RPC desconhecida');
    }
  };

  const chamados = await fetchChamados(mockClient);
  assert.equal(chamados.length, 1);
  // Deve normalizar setor
  assert.equal(chamados[0].setor_responsavel, 'GIN / Unidade Escolar');

  const createRes = await createTicketWithHistory(mockClient, { id: 1 }, { event: 1 });
  assert.equal(createRes.ticket.id_chamado, 'GOP-CREATED');
  assert.equal(createRes.event.id_chamado, 'GOP-CREATED');

  const updateRes = await updateTicketWithHistory(mockClient, { id: 2 }, [{ event: 2 }]);
  assert.equal(updateRes.id_chamado, 'GOP-UPDATED');
  console.log('[PASSED] 3. fetchChamados (com normalização), createTicket e updateTicket funcionam');
}

console.log('🎉 TODOS OS TESTES UNITÁRIOS DA CAMADA DE SERVIÇOS PASSARAM!\n');
