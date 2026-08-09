import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

const PROJECT_ID = 'demo-controle-climatizacao-3cre';
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const ticket = (id = 'GOP-AR-2026-0001') => ({
  id_chamado: id,
  unidade_escolar: 'Escola Municipal Teste',
  designacao: '312001',
  data_solicitacao: '2026-08-09T12:00:00.000Z',
  local_demanda: 'Sala 1',
  tipo_demanda: 'Substituição/Instalação de Aparelho',
  tipo_aparelho: 'Split',
  btu_existente: null,
  btu_pretendido: '18000',
  status_atual: 'Aberto',
  setor_responsavel: 'GOP',
  proxima_providencia: 'Vistoria',
  ultima_movimentacao: 'Abertura',
  informacao_validada: 'Pendente de Vistoria',
  prioridade: 'Média',
  comunicacao_cto: 'Não',
  observacoes: '',
  resultado_aptidao: null,
  criado_em: '2026-08-09T12:00:00.000Z',
  modificado_em: '2026-08-09T12:00:00.000Z'
});

const historyEvent = (eventId, ticketId) => ({
  id_evento: eventId,
  data: '2026-08-09T12:00:00.000Z',
  id_chamado: ticketId,
  designacao: '312001',
  unidade_escolar: 'Escola Municipal Teste',
  marco_relevante: 'Abertura oficial do chamado',
  setor: 'GOP',
  responsavel_registro: 'GOP / 3ª CRE',
  observacao: 'Registro inicial'
});

console.log('🔐 INICIANDO TESTES DAS FIRESTORE SECURITY RULES...');

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules }
});

try {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'escolas/312001'), {
      designacao: '312001',
      unidade_escolar: 'Escola Municipal Teste'
    });
    await setDoc(doc(adminDb, 'modelos_email/1'), {
      id: 1,
      tipo: 'Teste',
      etapa: '1',
      template: 'Modelo'
    });
  });

  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(db, 'escolas/312001')));
  await assertFails(setDoc(doc(db, 'escolas/312002'), { designacao: '312002' }));
  await assertFails(updateDoc(doc(db, 'escolas/312001'), { unidade_escolar: 'Alterada' }));
  console.log('[PASSED] 1. escolas são legíveis e imutáveis pelo cliente');

  await assertSucceeds(getDoc(doc(db, 'modelos_email/1')));
  await assertFails(setDoc(doc(db, 'modelos_email/2'), { id: 2, template: 'Injetado' }));
  console.log('[PASSED] 2. modelos de e-mail são somente leitura');

  await assertSucceeds(setDoc(doc(db, 'chamados/GOP-AR-2026-0001'), ticket()));
  await assertFails(setDoc(
    doc(db, 'chamados/GOP-AR-2026-0002'),
    ticket('GOP-AR-2026-9999')
  ));
  await assertFails(setDoc(
    doc(db, 'chamados/RASCUNHO-123'),
    { ...ticket('RASCUNHO-123') }
  ));
  console.log('[PASSED] 3. criação exige ID oficial coerente e schema permitido');

  await assertSucceeds(updateDoc(doc(db, 'chamados/GOP-AR-2026-0001'), {
    status_atual: 'Em atendimento',
    modificado_em: '2026-08-09T13:00:00.000Z'
  }));
  await assertFails(updateDoc(doc(db, 'chamados/GOP-AR-2026-0001'), {
    id_chamado: 'GOP-AR-2026-7777'
  }));
  await assertFails(updateDoc(doc(db, 'chamados/GOP-AR-2026-0001'), {
    designacao: '312999'
  }));
  await assertFails(deleteDoc(doc(db, 'chamados/GOP-AR-2026-0001')));
  console.log('[PASSED] 4. atualização limita campos e exclusão de chamado é bloqueada');

  await assertSucceeds(setDoc(
    doc(db, 'historico/EV-1'),
    historyEvent('EV-1', 'GOP-AR-2026-0001')
  ));
  await assertFails(setDoc(
    doc(db, 'historico/EV-ORFAO'),
    historyEvent('EV-ORFAO', 'GOP-AR-2026-9999')
  ));
  await assertSucceeds(updateDoc(doc(db, 'historico/EV-1'), {
    observacao: 'Comentário corrigido'
  }));
  await assertFails(updateDoc(doc(db, 'historico/EV-1'), { setor: 'CTO' }));
  await assertFails(deleteDoc(doc(db, 'historico/EV-1')));
  console.log('[PASSED] 5. histórico exige vínculo válido e só permite corrigir observação');

  const atomicBatch = writeBatch(db);
  atomicBatch.set(
    doc(db, 'chamados/GOP-AR-2026-0002'),
    ticket('GOP-AR-2026-0002')
  );
  atomicBatch.set(
    doc(db, 'historico/EV-2'),
    historyEvent('EV-2', 'GOP-AR-2026-0002')
  );
  await assertSucceeds(atomicBatch.commit());
  console.log('[PASSED] 6. getAfter permite chamado + histórico no mesmo lote atômico');

  await assertSucceeds(setDoc(doc(db, 'contadores/chamados-2026'), {
    ano: '2026',
    ultimoNumero: 1,
    atualizado_em: '2026-08-09T12:00:00.000Z'
  }));
  await assertSucceeds(updateDoc(doc(db, 'contadores/chamados-2026'), {
    ultimoNumero: 2,
    atualizado_em: '2026-08-09T13:00:00.000Z'
  }));
  await assertFails(updateDoc(doc(db, 'contadores/chamados-2026'), {
    ultimoNumero: 9,
    atualizado_em: '2026-08-09T14:00:00.000Z'
  }));
  console.log('[PASSED] 7. contador só pode avançar uma unidade por gravação');

  await assertFails(setDoc(doc(db, 'colecao_nao_autorizada/x'), { qualquer: true }));
  console.log('[PASSED] 8. coleções não declaradas permanecem bloqueadas');

  const stored = await getDoc(doc(db, 'chamados/GOP-AR-2026-0001'));
  assert.equal(stored.data().id_chamado, 'GOP-AR-2026-0001');

  console.log('🎉 FIRESTORE SECURITY RULES VALIDADAS!\n');
} finally {
  await testEnv.cleanup();
}
