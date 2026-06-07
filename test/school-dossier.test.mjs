import {
  calculateCoveragePercent,
  getSchoolClimateStatus,
  getSchoolDossierData,
  getSchoolClimateReason
} from '../src/lib/schoolDossier.js';

function printResult(name, passed, details = '') {
  const badge = passed ? '\x1b[32m[PASSED]\x1b[0m' : '\x1b[31m[FAILED]\x1b[0m';
  console.log(`${badge} ${name} ${details ? `— ${details}` : ''}`);
  if (!passed) {
    console.error('\x1b[31m⚠️ Teste do Dossiê da Escola Falhou!\x1b[0m');
    process.exit(1);
  }
}

console.log('\x1b[34m%s\x1b[0m', '================================================');
console.log('\x1b[34m%s\x1b[0m', '🔬 INICIANDO TESTES DO DOSSIÊ DA UNIDADE ESCOLAR');
console.log('\x1b[34m%s\x1b[0m', '================================================\n');

try {
  // Teste 1: Percentual de Climatização
  const schoolA = { qtd_salas_de_aula: 10, aparelhos_em_sala: 8 };
  const schoolB = { qtd_salas_de_aula: 0, aparelhos_em_sala: 5 };
  const schoolC = { qtd_salas_de_aula: null, aparelhos_em_sala: 0 };

  const pctA = calculateCoveragePercent(schoolA);
  const pctB = calculateCoveragePercent(schoolB);
  const pctC = calculateCoveragePercent(schoolC);

  printResult('1.1. Percentual calculado corretamente para dados válidos', pctA === 80, `Pct: ${pctA}%`);
  printResult('1.2. Percentual retorna null para total de salas = 0', pctB === null);
  printResult('1.3. Percentual retorna null para total de salas nulo/indefinido', pctC === null);

  // Teste 2: Regras de Situação Crítica
  const refDate = new Date('2026-06-03T12:00:00Z');
  
  // Condição a: chamado ativo Crítico
  const schoolModel = {
    designacao: '123',
    confirmado_pela_unidade: 'Sim',
    validado_pela_gop: 'Sim',
    qtd_salas_de_aula: 10,
    aparelhos_em_sala: 8,
    necessidade_aparelhos: 0
  };

  const ticketsCrit = [{ prioridade: 'Crítica', status_atual: '1 - Recebido', data_solicitacao: '2026-06-01T12:00:00Z' }];
  const statusCritA = getSchoolClimateStatus(schoolModel, ticketsCrit, 80, refDate);
  printResult('2.1. Situação Crítica: Chamado ativo de prioridade Crítica', statusCritA === 'critica');

  // Condição b: cobertura < 30%
  const statusCritB = getSchoolClimateStatus(schoolModel, [], 25, refDate);
  printResult('2.2. Situação Crítica: Cobertura de climatização < 30%', statusCritB === 'critica');

  // Condição c: necessidade > 0 E chamado ativo parado há +15 dias
  const schoolNeed = { ...schoolModel, necessidade_aparelhos: 2 };
  const ticketsStuck = [{ prioridade: 'Média', status_atual: '2 - Em vistoria', modificado_em: '2026-05-15T12:00:00Z' }]; // inativo por 19 dias
  const statusCritC = getSchoolClimateStatus(schoolNeed, ticketsStuck, 80, refDate);
  printResult('2.3. Situação Crítica: Necessidade > 0 + chamado inativo há +15 dias', statusCritC === 'critica');

  // Teste 3: Regras de Situação Em Atenção
  // Condição a: chamado ativo comum
  const ticketsCommon = [{ prioridade: 'Média', status_atual: '1 - Recebido', modificado_em: '2026-06-01T12:00:00Z' }];
  const statusAttA = getSchoolClimateStatus(schoolModel, ticketsCommon, 80, refDate);
  printResult('3.1. Situação Em Atenção: Possui chamado ativo de prioridade Média', statusAttA === 'atencao');

  // Condição b: não confirmado pela unidade
  const schoolNotConf = { ...schoolModel, confirmado_pela_unidade: 'Não' };
  const statusAttB = getSchoolClimateStatus(schoolNotConf, [], 80, refDate);
  printResult('3.2. Situação Em Atenção: Dados não confirmados pela unidade', statusAttB === 'atencao');

  // Condição c: não validado pela GOP
  const schoolNotVal = { ...schoolModel, validado_pela_gop: 'Não' };
  const statusAttC = getSchoolClimateStatus(schoolNotVal, [], 80, refDate);
  printResult('3.3. Situação Em Atenção: Dados não validados pela GOP', statusAttC === 'atencao');

  // Condição d: salas sem aparelho
  const schoolNoAir = { ...schoolModel, salas_sem_aparelho: 2 };
  const statusAttD = getSchoolClimateStatus(schoolNoAir, [], 80, refDate);
  printResult('3.4. Situação Em Atenção: Há salas sem aparelho', statusAttD === 'atencao');

  // Condição e: necessidade estimada de aparelhos
  const schoolNeedOnly = { ...schoolModel, necessidade_aparelhos: 1 };
  const statusAttE = getSchoolClimateStatus(schoolNeedOnly, [], 80, refDate);
  printResult('3.5. Situação Em Atenção: Há necessidade estimada de aparelhos', statusAttE === 'atencao');

  // Condição f: cobertura < 70%
  const statusAttF = getSchoolClimateStatus(schoolModel, [], 65, refDate);
  printResult('3.6. Situação Em Atenção: Cobertura de climatização < 70%', statusAttF === 'atencao');

  // Teste 4: Regras de Situação Regular
  const statusReg = getSchoolClimateStatus(schoolModel, [], 80, refDate);
  printResult('4.1. Situação Regular: Atende a todas as exigências', statusReg === 'regular');

  // Teste 5: Agregação do Dossiê Completo
  const mockTickets = [
    { designacao: '123', id_chamado: 'TKT-10', status_atual: '1 - Recebido', prioridade: 'Média', data_solicitacao: '2026-06-02T12:00:00Z' },
    { designacao: '123', id_chamado: 'TKT-20', status_atual: '10 - Concluído', prioridade: 'Crítica', data_solicitacao: '2026-06-01T12:00:00Z' },
    { designacao: '123', id_chamado: 'TKT-30', status_atual: '2 - Em vistoria', prioridade: 'Alta', data_solicitacao: '2026-05-20T12:00:00Z' }
  ];

  const mockHistory = [
    { designacao: '123', data: '2026-05-25T12:00:00Z', marco_relevante: 'Vistoria Agendada' },
    { designacao: '123', data: '2026-06-02T15:00:00Z', marco_relevante: 'Chamado Criado' }
  ];

  const mockLogs = {
    '123': [{ date: '2026-06-03T09:00:00Z', content: 'Nota de vistoria do engenheiro' }]
  };

  const dossier = getSchoolDossierData({
    school: schoolModel,
    tickets: mockTickets,
    history: mockHistory,
    schoolLogs: mockLogs,
    refDate
  });

  printResult('5.1. Agregado: Contagem correta de ativos', dossier.activeCount === 2);
  printResult('5.2. Agregado: Contagem correta de concluídos', dossier.closedCount === 1);
  printResult('5.3. Agregado: Contagem correta de ativos críticos/altos', dossier.criticalCount === 1); // TKT-30 é Alta, TKT-20 é Concluído
  printResult('5.4. Agregado: Identifica o último andamento consolidado (anotação local)', dossier.latestUpdate.description === 'Nota de vistoria do engenheiro');
  printResult('5.5. Agregado: Identifica o chamado ativo mais antigo', dossier.oldestActiveTicket.id_chamado === 'TKT-30'); // TKT-30 criado em 20/05, TKT-10 em 02/06

  // Teste 6: Motivo de Criticidade do Dossiê (Exatamente 11 casos)
  const r1 = getSchoolClimateReason(schoolModel, ticketsCrit, 80, refDate);
  printResult('6.1. Reason: Chamado ativo prioridade Crítica/Alta', r1 === 'Possui chamado de manutenção ativo com prioridade Crítica ou Alta.');

  const r2 = getSchoolClimateReason(schoolModel, [], 25, refDate);
  printResult('6.2. Reason: Cobertura crítica < 30%', r2 === 'Percentual de salas climatizadas inferior a 30% (cobertura crítica).');

  const r3 = getSchoolClimateReason(schoolNeed, ticketsStuck, 80, refDate);
  printResult('6.3. Reason: Necessidade > 0 + chamado inativo há +15 dias', r3 === 'Necessidade de aparelhos pendente com chamado de manutenção inativo por mais de 15 dias.');

  const r4 = getSchoolClimateReason(schoolModel, ticketsCommon, 80, refDate);
  printResult('6.4. Reason: Chamado ativo de prioridade Média', r4 === 'Possui chamado de manutenção ativo sob análise.');

  const r5 = getSchoolClimateReason(schoolNotConf, [], 80, refDate);
  printResult('6.5. Reason: Dados não confirmados pela unidade', r5 === 'Dados cadastrais ainda não confirmados pela unidade escolar.');

  const r6 = getSchoolClimateReason(schoolNotVal, [], 80, refDate);
  printResult('6.6. Reason: Dados não validados pela GOP', r6 === 'Dados cadastrais sob auditoria da GOP pendentes de validação técnica.');

  const r7 = getSchoolClimateReason(schoolNoAir, [], 80, refDate);
  printResult('6.7. Reason: Há salas sem aparelho', r7 === 'Presença de salas de aula sem aparelhos de climatização instalados.');

  const r8 = getSchoolClimateReason(schoolNeedOnly, [], 80, refDate);
  printResult('6.8. Reason: Há necessidade estimada de aparelhos', r8 === 'Necessidade de novos aparelhos estimada pendente de atendimento.');

  const r9 = getSchoolClimateReason(schoolModel, [], 65, refDate);
  printResult('6.9. Reason: Cobertura de climatização < 70%', r9 === 'Percentual de salas climatizadas abaixo da meta recomendada de 70%.');

  const r10 = getSchoolClimateReason(schoolModel, [], 80, refDate);
  printResult('6.10. Reason: Situação Regular', r10 === 'Unidade atende a todos os critérios de climatização estabelecidos.');

  const r11 = getSchoolClimateReason(null, [], 80, refDate);
  printResult('6.11. Reason: Unidade nula ou inválida', r11 === 'Nenhuma unidade escolar selecionada.');

  console.log('\n\x1b[32m%s\x1b[0m', '================================================');
  console.log('\x1b[32m%s\x1b[0m', '🎉 RESULTADO: TODOS OS TESTES DO DOSSIÊ PASSARAM! ');
  console.log('\x1b[32m%s\x1b[0m', '================================================');
} catch (e) {
  printResult('Teste do Dossiê falhou criticamente', false, e.message);
  process.exit(1);
}
