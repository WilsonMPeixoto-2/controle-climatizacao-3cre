import fs from 'node:fs';
import assert from 'node:assert/strict';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createFirestorePersistence } from '../src/infrastructure/firebase/firestorePersistence.js';

const PROJECT_ID = 'demo-controle-climatizacao-3cre';
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const FIXED_NOW = '2027-02-10T15:00:00.000Z';

const ticketInput = (school = '312001') => ({
  unidade_escolar: 'Escola Municipal Teste',
  designacao: school,
  data_solicitacao: '2027-02-10T12:00:00.000Z',
  local_demanda: 'Sala 4',
  tipo_demanda: 'Substituição/Instalação de Aparelho',
  tipo_aparelho: 'Split',
  btu_existente: null,
  btu_pretendido: '18000',
  status_atual: 'Aberto',
  setor_responsavel: 'Unidade Escolar / GIN',
  proxima_providencia: 'Realizar vistoria',
  ultima_movimentacao: 'Solicitação recebida',
  informacao_validada: 'Pendente de Vistoria',
  prioridade: 'Média',
  comunicacao_cto: 'Não',
  observacoes: '',
  resultado_aptidao: null
});

const initialEvent = (id) => ({
  id_evento: id,
  data: FIXED_NOW,
  designacao: '312001',
  unidade_escolar: 'Escola Municipal Teste',
  marco_relevante: 'Abertura oficial do chamado',
  setor: 'GOP',
  responsavel_registro: 'GOP / 3ª CRE',
  observacao: 'Criado pelo teste de integração'
});

console.log('🔥 INICIANDO TESTES DO ADAPTER FIRESTORE NO EMULADOR...');

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
      unidade_escolar: 'Escola Municipal Teste',
      bairro: 'Inhaúma'
    });
    await setDoc(doc(adminDb, 'modelos_email/1'), {
      id: 1,
      tipo: 'Abertura',
      etapa: '1',
      template: 'Chamado {ID_CHAMADO}'
    });
  });

  const db = testEnv.unauthenticatedContext().firestore();
  const persistence = createFirestorePersistence(db, { now: () => FIXED_NOW });

  assert.equal(persistence.provider, 'firestore');
  assert.deepEqual(persistence.capabilities, {
    realtime: true,
    attachments: false,
    offlineOfficialWrites: false
  });
  console.log('[PASSED] 1. contrato Firestore declara capacidades sem Storage');

  const before = await persistence.loadInitialData();
  assert.equal(before.schools.length, 1);
  assert.equal(before.emailTemplates.length, 1);
  assert.equal(before.tickets.length, 0);
  assert.equal(before.history.length, 0);
  console.log('[PASSED] 2. carga inicial lê coleções de referência no Firestore');

  const first = await persistence.createTicketWithHistory(
    ticketInput(),
    initialEvent('EV-FS-1')
  );
  assert.equal(first.ticket.id_chamado, 'GOP-AR-2027-0001');
  assert.equal(first.ticket.setor_responsavel, 'GIN / Unidade Escolar');
  assert.equal(first.event.id_chamado, first.ticket.id_chamado);
  console.log('[PASSED] 3. transação cria contador, chamado e histórico com ano dinâmico');

  const second = await persistence.createTicketWithHistory(
    ticketInput(),
    initialEvent('EV-FS-2')
  );
  assert.equal(second.ticket.id_chamado, 'GOP-AR-2027-0002');
  const counter = await getDoc(doc(db, 'contadores/chamados-2027'));
  assert.equal(counter.data().ultimoNumero, 2);
  console.log('[PASSED] 4. contador é sequencial e avança sem ID hardcoded de 2026');

  const updated = await persistence.updateTicketWithHistory(
    {
      ...first.ticket,
      status_atual: 'Em atendimento',
      modificado_em: '2027-02-10T16:00:00.000Z'
    },
    [{
      id_evento: 'EV-FS-3',
      data: '2027-02-10T16:00:00.000Z',
      id_chamado: first.ticket.id_chamado,
      designacao: '312001',
      unidade_escolar: 'Escola Municipal Teste',
      marco_relevante: 'Status atualizado',
      setor: 'GOP',
      responsavel_registro: 'GOP / 3ª CRE',
      observacao: 'Em atendimento'
    }]
  );
  assert.equal(updated.status_atual, 'Em atendimento');
  const persistedTicket = await getDoc(doc(db, 'chamados/GOP-AR-2027-0001'));
  const persistedHistory = await getDoc(doc(db, 'historico/EV-FS-3'));
  assert.equal(persistedTicket.data().status_atual, 'Em atendimento');
  assert.equal(persistedHistory.data().id_chamado, first.ticket.id_chamado);
  console.log('[PASSED] 5. edição + novos eventos são gravados atomicamente por batch');

  const schoolLog = await persistence.insertHistoryEvent({
    id_evento: 'EV-ESCOLA-1',
    data: '2027-02-10T17:00:00.000Z',
    designacao: '312001',
    unidade_escolar: 'Escola Municipal Teste',
    marco_relevante: 'Anotação técnica da escola',
    setor: 'GOP',
    responsavel_registro: 'GOP / 3ª CRE',
    observacao: 'Sem vínculo obrigatório com chamado'
  });
  assert.equal(schoolLog.id_evento, 'EV-ESCOLA-1');
  console.log('[PASSED] 6. histórico de escola sem chamado continua suportado');

  let realtimeTickets = [];
  let realtimeHistory = [];
  await new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error(
        `Timeout aguardando snapshots completos do Firestore: ${realtimeTickets.length} chamados / ${realtimeHistory.length} eventos.`
      ));
    }, 5000);

    const maybeDone = () => {
      if (realtimeTickets.length >= 2 && realtimeHistory.length >= 4) {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    };

    unsubscribe = persistence.subscribeOperationalData({
      onTickets(rows) {
        realtimeTickets = rows;
        maybeDone();
      },
      onHistory(rows) {
        realtimeHistory = rows;
        maybeDone();
      },
      onError(error) {
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    });
  });

  assert.equal(realtimeTickets.length, 2);
  assert.ok(realtimeHistory.length >= 4);
  console.log('[PASSED] 7. onSnapshot entrega estado completo diretamente sem refetch manual');

  const after = await persistence.loadInitialData();
  assert.equal(after.tickets[0].id_chamado, 'GOP-AR-2027-0002');
  assert.ok(after.history.some((event) => event.id_evento === 'EV-ESCOLA-1'));
  console.log('[PASSED] 8. ordenação e recarga preservam o contrato da aplicação');

  console.log('🎉 ADAPTER FIRESTORE VALIDADO NO EMULADOR!\n');
} finally {
  await testEnv.cleanup();
}
