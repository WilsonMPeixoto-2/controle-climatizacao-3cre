import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createFirestorePersistence } from '../src/infrastructure/firebase/firestorePersistence.js';

const PROJECT_ID = 'demo-controle-climatizacao-3cre';
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const FIXED_NOW = '2026-08-16T20:30:00.000Z';

const survey = (overrides = {}) => ({
  designacao: '312001',
  unidade_escolar: 'Escola Municipal Teste',
  atualizado_em: FIXED_NOW,
  ambientes: [
    {
      id: 'amb-1',
      tipo: 'Sala de Aula',
      identificacao: '101',
      nome_exibicao: 'Sala de Aula 101',
      quantidade_aparelhos: 2,
      aparelhos: [
        {
          id: 'apr-1',
          modelo_marca: 'Springer Midea',
          capacidade_btu: '12000',
          tipo: 'Split',
          situacao: 'Funcionando',
          observacoes: ''
        },
        {
          id: 'apr-2',
          modelo_marca: '',
          capacidade_btu: '18000',
          tipo: 'Split Hi Wall',
          situacao: 'Precisa de manutenção',
          observacoes: 'Ruído na unidade interna.'
        }
      ]
    }
  ],
  ...overrides
});

console.log('❄️ INICIANDO TESTES DO PRONTUÁRIO NO FIRESTORE...');

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules }
});

try {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'escolas/312001'), {
      designacao: '312001',
      unidade_escolar: 'Escola Municipal Teste'
    });
  });

  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(setDoc(doc(db, 'levantamentos_climatizacao/312001'), survey()));
  console.log('[PASSED] 1. escola existente pode salvar seu levantamento');

  await assertFails(
    setDoc(
      doc(db, 'levantamentos_climatizacao/312001'),
      survey({ designacao: '399999' })
    )
  );
  await assertFails(
    setDoc(doc(db, 'levantamentos_climatizacao/399999'), survey({ designacao: '399999' }))
  );
  console.log('[PASSED] 2. documento exige designação coerente e escola existente');

  const persistence = createFirestorePersistence(db, { now: () => FIXED_NOW });
  const saved = await persistence.saveClimateSurvey({
    ...survey(),
    atualizado_em: undefined
  });
  assert.equal(saved.designacao, '312001');
  assert.equal(saved.atualizado_em, FIXED_NOW);

  const loaded = await persistence.loadClimateSurvey('312001');
  assert.equal(loaded.ambientes.length, 1);
  assert.equal(loaded.ambientes[0].aparelhos.length, 2);
  assert.equal(loaded.ambientes[0].aparelhos[1].situacao, 'Precisa de manutenção');

  const stored = await getDoc(doc(db, 'levantamentos_climatizacao/312001'));
  assert.equal(stored.data().unidade_escolar, 'Escola Municipal Teste');
  console.log('[PASSED] 3. adapter salva e reabre o prontuário por designação');

  const missing = await persistence.loadClimateSurvey('312999');
  assert.equal(missing, null);
  console.log('[PASSED] 4. escola sem levantamento retorna null sem inventar dados');

  console.log('🎉 PRONTUÁRIO FIRESTORE VALIDADO!\n');
} finally {
  await testEnv.cleanup();
}
