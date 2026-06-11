/**
 * test/dossier-refinements.test.mjs — Testes unitários para a Fase 5.
 * Executa em Node.js puro.
 */

import assert from 'node:assert/strict';
import { escapeHtml } from '../src/lib/logic.js';
import {
  calculateEstimatedInvestment,
  EQUIPMENT_REFERENCE_COST,
  ELECTRICAL_ADAPTATION_REFERENCE_COST
} from '../src/lib/schoolDossier.js';

console.log('🔬 INICIANDO TESTES UNITÁRIOS DA FASE 5 (DOSSIÊ E ESCAPE)...');

// 1) Testes de escapeHtml
{
  assert.equal(escapeHtml(null), '', 'Nulo deve retornar string vazia.');
  assert.equal(escapeHtml(undefined), '', 'Indefinido deve retornar string vazia.');
  assert.equal(escapeHtml('Texto Limpo'), 'Texto Limpo', 'String limpa deve retornar intacta.');
  assert.equal(
    escapeHtml('<script>alert("xss")</script>'),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    'Deve escapar menor que, maior que e aspas duplas.'
  );
  assert.equal(
    escapeHtml("A & B's"),
    'A &amp; B&#039;s',
    'Deve escapar E comercial e aspas simples.'
  );
  console.log('[PASSED] 1. escapeHtml sanitiza inputs XSS com precisão');
}

// 2) Testes de calculateEstimatedInvestment
{
  // Constantes de referência
  assert.equal(EQUIPMENT_REFERENCE_COST, 3000);
  assert.equal(ELECTRICAL_ADAPTATION_REFERENCE_COST, 2000);

  // Escola nula
  assert.equal(calculateEstimatedInvestment(null), 0, 'Escola nula deve retornar 0.');

  // Escola sem necessidades
  const schoolEmpty = {
    necessidade_aparelhos: 0,
    salas_sem_aparelho: 0
  };
  assert.equal(calculateEstimatedInvestment(schoolEmpty), 0);

  // Escola apenas com necessidade de equipamentos (ex: 3 aparelhos)
  const schoolOnlyEquip = {
    necessidade_aparelhos: 3,
    salas_sem_aparelho: 0
  };
  assert.equal(calculateEstimatedInvestment(schoolOnlyEquip), 9000); // 3 * 3000

  // Escola apenas com salas sem aparelho (ex: 2 salas)
  const schoolOnlyAdapt = {
    necessidade_aparelhos: 0,
    salas_sem_aparelho: 2
  };
  assert.equal(calculateEstimatedInvestment(schoolOnlyAdapt), 4000); // 2 * 2000

  // Escola mista (ex: 2 aparelhos necessários e 3 salas sem aparelho)
  const schoolMixed = {
    necessidade_aparelhos: 2,
    salas_sem_aparelho: 3
  };
  assert.equal(calculateEstimatedInvestment(schoolMixed), 12000); // (2 * 3000) + (3 * 2000) = 6000 + 6000
  console.log('[PASSED] 2. calculateEstimatedInvestment computa estimativas corretamente');
}

console.log('🎉 TODOS OS TESTES UNITÁRIOS DA FASE 5 PASSARAM!\n');
