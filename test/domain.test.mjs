/**
 * domain.test.mjs — Testes unitários para as definições de domínio e normalizadores da Fase 4.
 * Executa em Node.js puro.
 */

import assert from 'node:assert/strict';
import { STATUSES, STATUS_LIST, isClosed, isSuspended, normalizeStatus } from '../src/domain/statuses.js';
import { SECTORS, SECTOR_LIST, normalizeSector } from '../src/domain/sectors.js';
import { PRIORITIES, PRIORITY_LIST, normalizePriority } from '../src/domain/priorities.js';
import { APTIDAO, APTIDAO_LIST, normalizeAptidao } from '../src/domain/aptidao.js';

console.log('🔬 INICIANDO TESTES UNITÁRIOS DE DOMÍNIO...');

// 1) Testes de Status
{
  assert.equal(STATUS_LIST.length, 12, 'Deve conter exatamente 12 status.');
  assert.ok(STATUS_LIST.includes(STATUSES.RECEBIDO));
  assert.ok(STATUS_LIST.includes(STATUSES.CONCLUIDO));
  
  assert.ok(isClosed(STATUSES.CONCLUIDO));
  assert.ok(isClosed(STATUSES.ENCERRADO));
  assert.ok(!isClosed(STATUSES.RECEBIDO));
  
  assert.ok(isSuspended(STATUSES.SUSPENSO));
  assert.ok(!isSuspended(STATUSES.CONCLUIDO));

  // Normalização de status antigos
  assert.equal(normalizeStatus('3 - Vistoria concluída'), STATUSES.VISTORIA_CONCLUIDA);
  assert.equal(normalizeStatus('6 - Recurso / remanejamento'), STATUSES.AGUARDANDO_ADEQUACAO);
  assert.equal(normalizeStatus('8 - Autorizado — CTO acionada'), STATUSES.ADEQUACAO_CONCLUIDA);
  assert.equal(normalizeStatus('10 - Concluído'), STATUSES.CONCLUIDO);
  assert.equal(normalizeStatus('Inexistente'), 'Inexistente');
  console.log('[PASSED] 1. Testes de Status e Normalização');
}

// 2) Testes de Setores
{
  assert.ok(SECTOR_LIST.includes(SECTORS.GOP));
  assert.ok(SECTOR_LIST.includes(SECTORS.GIN_UNIDADE_ESCOLAR));

  // Normalização de setores
  assert.equal(normalizeSector('Unidade Escolar / GIN'), SECTORS.GIN_UNIDADE_ESCOLAR);
  assert.equal(normalizeSector('GIN / Unidade'), SECTORS.GIN_UNIDADE_ESCOLAR);
  assert.equal(normalizeSector('CPS / Unidade'), SECTORS.CPS_UNIDADE_ESCOLAR);
  assert.equal(normalizeSector('GOP'), SECTORS.GOP);
  console.log('[PASSED] 2. Testes de Setores e Normalização');
}

// 3) Testes de Prioridades
{
  assert.equal(PRIORITY_LIST.length, 4);
  assert.ok(PRIORITY_LIST.includes(PRIORITIES.MEDIA));
  
  assert.equal(normalizePriority('crítica'), PRIORITIES.CRITICA);
  assert.equal(normalizePriority('CRITICA'), PRIORITIES.CRITICA);
  assert.equal(normalizePriority('alta'), PRIORITIES.ALTA);
  assert.equal(normalizePriority('média'), PRIORITIES.MEDIA);
  assert.equal(normalizePriority('baixa'), PRIORITIES.BAIXA);
  assert.equal(normalizePriority('qualquer-coisa'), PRIORITIES.MEDIA);
  console.log('[PASSED] 3. Testes de Prioridades e Normalização');
}

// 4) Testes de Aptidão
{
  assert.equal(APTIDAO_LIST.length, 4);
  
  assert.equal(normalizeAptidao('apta'), APTIDAO.APTA);
  assert.equal(normalizeAptidao('não apta'), APTIDAO.NAO_APTA);
  assert.equal(normalizeAptidao('nao apta'), APTIDAO.NAO_APTA);
  assert.equal(normalizeAptidao('apta parcialmente'), APTIDAO.APTA_PARCIALMENTE);
  assert.equal(normalizeAptidao('parcialmente apta'), APTIDAO.APTA_PARCIALMENTE);
  assert.equal(normalizeAptidao(''), APTIDAO.PENDENTE);
  console.log('[PASSED] 4. Testes de Aptidão e Normalização');
}

console.log('🎉 TODOS OS TESTES UNITÁRIOS DE DOMÍNIO PASSARAM!\n');
