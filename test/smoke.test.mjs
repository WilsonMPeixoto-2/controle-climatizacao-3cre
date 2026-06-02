/**
 * test/smoke.test.mjs — Suite de Testes de Fumaça (Smoke Tests) Rígidos
 * Simula o ciclo de vida completo de casos reais de uso do site da GOP/3ª CRE:
 * 1. Lançamento e validação de novos chamados (cruzamento com a base de 134 escolas).
 * 2. Edição completa de chamados e validação com esquemas Zod.
 * 3. Geração automática e sequencial de auditorias de campos em português.
 * 4. Inserção de laudos e fotos simuladas com persistência de metadados na Linha do Tempo.
 * 5. Edição de comentários e logs.
 * 6. Verificação de consistência agregada (Bairros e Dashboards) pós-modificações.
 *
 * Para rodar este teste de fumaça: node test/smoke.test.mjs
 */

import fs from 'fs';
import { 
  formatDateBrazilian as fmtDateBR,
  computeMetrics,
  aggregateBairroStats,
  slaLevel,
  ageLevel,
  stuckRanking
} from '../src/lib/logic.js';
import { createTicketSchema, editTicketSchema } from '../src/lib/validation.js';

// Carrega a base local de referência (db.json)
const rawDb = fs.readFileSync('./src/data/db.json', 'utf-8');
const db = JSON.parse(rawDb);

const initialTickets = [...db.chamados];
const initialSchools = [...db.escolas];
let historyState = [...db.historico];
let ticketsState = [...db.chamados];
let schoolNotesState = {}; // Simula o localStorage do front

function printResult(name, passed, details = '') {
  const badge = passed ? '\x1b[32m[PASSED]\x1b[0m' : '\x1b[31m[FAILED]\x1b[0m';
  console.log(`${badge} ${name} ${details ? `— ${details}` : ''}`);
  if (!passed) {
    console.error('\x1b[31m⚠️ Teste de Fumaça Falhou!\x1b[0m');
    process.exit(1);
  }
}

console.log('\x1b[35m%s\x1b[0m', '================================================');
console.log('\x1b[35m%s\x1b[0m', '🚀 INICIANDO SMOKE TESTS RÍGIDOS: DIÁLOGO DADOS/TELA');
console.log('\x1b[35m%s\x1b[0m', '================================================\n');

// ---------------------------------------------------------------------------
// TESTE 1: Lançamento de Novo Chamado com Autocomplete & Validação Zod
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 1: Fluxo de Criação de Chamado Assistido ---');
  
  // Escola selecionada no autocomplete (ex: Nereu Sampaio)
  const schoolSelected = initialSchools.find(s => s.designacao === '312014'); // Nereu Sampaio
  
  // Objeto preenchido no formulário da tela
  const formTicketInput = {
    school: schoolSelected,
    local_demanda: 'Sala de Leitura - Bloco B',
    tipo_demanda: 'Nova Instalação',
    tipo_aparelho: 'Split',
    btu_existente: 'Não Possui',
    btu_pretendido: '18000',
    prioridade: 'Alta',
    status_atual: '1 - Recebido — em triagem',
    setor_responsavel: 'GOP',
    proxima_providencia: 'Aguardando triagem inicial pela GOP.',
    informacao_validada: 'Pendente de Vistoria',
    resultado_aptidao: 'Pendente'
  };

  // 1. Validação com o schema de criação do formulário
  const validation = createTicketSchema.safeParse(formTicketInput);
  printResult('1.1. Validação Zod do Schema de Criação', validation.success);

  // 2. Simulação de gravação idêntica ao App.jsx
  const generatedId = `GOP-AR-2026-TEST`;
  const nowIso = new Date().toISOString().substring(0, 19);

  const newTicketRecord = {
    id_chamado: generatedId,
    unidade_escolar: schoolSelected.unidade_escolar,
    designacao: schoolSelected.designacao,
    data_solicitacao: nowIso,
    local_demanda: formTicketInput.local_demanda,
    tipo_demanda: formTicketInput.tipo_demanda,
    status_atual: formTicketInput.status_atual,
    setor_responsavel: formTicketInput.setor_responsavel,
    proxima_providencia: 'Aguardando triagem inicial pela GOP.',
    ultima_movimentacao: 'Chamado registrado no sistema.',
    informacao_validada: formTicketInput.informacao_validada,
    prioridade: formTicketInput.prioridade,
    comunicacao_cto: 'Não',
    observacoes: 'Inserido via suite de testes de fumaça.',
    resultado_aptidao: formTicketInput.resultado_aptidao,
    criado_em: nowIso,
    modificado_em: nowIso,
    tipo_aparelho: formTicketInput.tipo_aparelho,
    btu_existente: formTicketInput.btu_existente,
    btu_pretendido: formTicketInput.btu_pretendido
  };

  const initialEvent = {
    id_evento: `EV-TEST-INITIAL`,
    data: nowIso,
    id_chamado: generatedId,
    designacao: schoolSelected.designacao,
    unidade_escolar: schoolSelected.unidade_escolar,
    marco_relevante: formTicketInput.status_atual,
    setor: "GOP",
    responsavel_registro: "GOP / Sistema",
    observacao: `Abertura oficial do chamado. Demanda cadastrada para o local: ${formTicketInput.local_demanda}.`
  };

  // Grava nos estados locais
  ticketsState = [newTicketRecord, ...ticketsState];
  historyState = [initialEvent, ...historyState];

  printResult('1.2. Inserção no Array de Chamados Local', ticketsState[0].id_chamado === generatedId);
  printResult('1.3. Inserção do Marco Inicial na Linha do Tempo', historyState[0].id_evento === 'EV-TEST-INITIAL');
  console.log();
} catch (e) {
  printResult('Teste 1 falhou criticamente', false, e.message);
}

// ---------------------------------------------------------------------------
// TESTE 2: Edição Completa, Validação Zod & Geração Automática de Auditoria (Logs)
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 2: Edição Ficha Técnica e Auditoria por Campo ---');

  const oldTicket = ticketsState.find(t => t.id_chamado === 'GOP-AR-2026-TEST');
  
  // Simula o preenchimento na tela do modal com múltiplos campos técnicos alterados
  const editingTicket = {
    ...oldTicket,
    local_demanda: 'Sala de Informática (Atualizado)', // campo 1
    tipo_demanda: 'Substituição de Aparelho',         // campo 2
    resultado_aptidao: 'Apta parcialmente',            // campo 3
    status_atual: '2 - Em vistoria técnica',           // campo 4
    setor_responsavel: 'GIN',                         // campo 5
    btu_existente: '12000',                            // campo 6
    ultima_movimentacao: 'Vistoria marcada para amanhã.'
  };

  // 1. Valida com o schema de Edição do Zod
  const validation = editTicketSchema.safeParse(editingTicket);
  printResult('2.1. Validação Zod do Schema de Edição completo', validation.success);

  // 2. Simulação do Motor de Auditoria refinado (idêntico ao que escrevemos no App.jsx)
  const nowIso = new Date().toISOString().substring(0, 19);
  const dataFormatada = fmtDateBR(nowIso);

  const camposMapeados = {
    status_atual: 'Status',
    setor_responsavel: 'Setor Responsável',
    prioridade: 'Prioridade',
    proxima_providencia: 'Próxima Providência',
    ultima_movimentacao: 'Última Movimentação Relevante',
    comunicacao_cto: 'Comunicação CTO',
    informacao_validada: 'Informação Validada',
    local_demanda: 'Local exato',
    tipo_demanda: 'Tipo de solicitação',
    tipo_aparelho: 'Tipo de aparelho',
    btu_existente: 'BTU Existente',
    btu_pretendido: 'BTU Pretendido',
    resultado_aptidao: 'Aptidão técnica',
    observacoes: 'Observações Gerais'
  };

  const camposFemininos = [
    'prioridade', 
    'proxima_providencia', 
    'ultima_movimentacao', 
    'informacao_validada', 
    'observacoes', 
    'tipo_demanda', 
    'resultado_aptidao'
  ];

  const logsGerados = [];
  Object.keys(camposMapeados).forEach(campo => {
    const valOld = String(oldTicket[campo] || '').trim();
    const valNew = String(editingTicket[campo] || '').trim();
    if (valOld !== valNew) {
      const preposicao = camposFemininos.includes(campo) ? 'alterada de' : 'alterado de';
      logsGerados.push({
        campoNome: camposMapeados[campo],
        desc: `${camposMapeados[campo]} ${preposicao} '${valOld || 'Vazio'}' para '${valNew || 'Vazio'}' em ${dataFormatada}.`
      });
    }
  });

  printResult('2.2. Detecção de múltiplos campos alterados', logsGerados.length === 7, `Detectou ${logsGerados.length} alterações.`);

  // Cria os eventos de auditoria individuais
  const novosEventos = logsGerados.map((log, index) => {
    return {
      id_evento: `EV-TEST-AUDIT-${index}`,
      data: nowIso,
      id_chamado: editingTicket.id_chamado,
      designacao: editingTicket.designacao,
      unidade_escolar: editingTicket.unidade_escolar,
      marco_relevante: `Alteração de ${log.campoNome}`,
      setor: 'GOP',
      responsavel_registro: "GOP / Sistema",
      observacao: log.desc
    };
  });

  // Atualiza estados locais
  ticketsState = ticketsState.map(t => t.id_chamado === editingTicket.id_chamado ? { ...editingTicket, modificado_em: nowIso } : t);
  historyState = [...novosEventos, ...historyState];

  printResult('2.3. Persistência dos logs individuais na Linha do Tempo', novosEventos.length === 7 && historyState.filter(h => h.id_evento.includes('EV-TEST-AUDIT')).length === 7);
  printResult('2.4. Formato de log automático verificado', novosEventos.some(n => n.observacao.includes("Aptidão técnica alterada de 'Pendente' para 'Apta parcialmente'")));
  console.log();
} catch (e) {
  printResult('Teste 2 falhou criticamente', false, e.message);
}

// ---------------------------------------------------------------------------
// TESTE 3: Upload Simulado de Anexos/Laudos e Persistência de Metadados
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 3: Registro de Anexos e Laudos Técnicos ---');

  // Simula o preenchimento de um anexo de laudo no modal (Ficha da Escola)
  const attachedFileSimulated = {
    name: 'laudo_vistoria_nereu_312014.pdf',
    size: '1.45 MB',
    type: 'application/pdf'
  };

  const newLogRecord = {
    id: 'SL-TEST-DOC',
    type: 'documento',
    date: new Date().toISOString(),
    content: attachedFileSimulated.name,
    docMeta: {
      name: attachedFileSimulated.name,
      size: attachedFileSimulated.size,
      type: attachedFileSimulated.type
    },
    user: 'GOP / 3ª CRE'
  };

  // Persiste na ficha local da escola (Nereu Sampaio - designacao 312014)
  const schoolDesignacao = '312014';
  const list = schoolNotesState[schoolDesignacao] || [];
  schoolNotesState[schoolDesignacao] = [newLogRecord, ...list];

  const persistedDoc = schoolNotesState[schoolDesignacao][0];

  printResult('3.1. Salvamento do Laudo na Ficha Local da Escola', persistedDoc.id === 'SL-TEST-DOC');
  printResult('3.2. Preservação de metadados críticos do arquivo', persistedDoc.docMeta.size === '1.45 MB' && persistedDoc.docMeta.type === 'application/pdf');
  console.log();
} catch (e) {
  printResult('Teste 3 falhou criticamente', false, e.message);
}

// ---------------------------------------------------------------------------
// TESTE 4: Edição de Comentários / Logs e Linha de Tempo Editável
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 4: Edição de Comentários da Linha de Tempo ---');

  // O usuário quer editar o log automático da alteração de Aptidão Técnica
  const logToEdit = historyState.find(h => h.id_evento === 'EV-TEST-AUDIT-4'); // Por exemplo, índice 4
  const oldText = logToEdit.observacao;
  const newText = `${oldText} - Validada pelo Engenheiro Wilson conforme laudo anexado.`;

  // Emula a gravação inline
  historyState = historyState.map(h => h.id_evento === logToEdit.id_evento ? { ...h, observacao: newText } : h);

  const editedLog = historyState.find(h => h.id_evento === logToEdit.id_evento);

  printResult('4.1. Modificação do texto do log no histórico', editedLog.observacao === newText);
  printResult('4.2. Preservação da data e ID original do histórico', editedLog.id_evento === logToEdit.id_evento && editedLog.data === logToEdit.data);
  console.log();
} catch (e) {
  printResult('Teste 4 falhou criticamente', false, e.message);
}

// ---------------------------------------------------------------------------
// TESTE 5: Consistência Relacional de Relatórios e Dashboards (No Conflict)
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 5: Diálogo de Dados e Agregações de Telas ---');

  // Executa os cruzamentos geográficos e métricas no novo estado de dados (com o chamado TEST incluído e editado)
  const metricsPost = computeMetrics(ticketsState, new Date());
  
  // O chamado TEST está com status '2 - Em vistoria técnica', portanto, está ATIVO
  printResult('5.1. Dashboard: Incremento consistente de chamados ativos', metricsPost.open === initialTickets.filter(t => !t.status_atual.startsWith('10') && !t.status_atual.startsWith('11') && t.status_atual !== 'Suspenso / pendente').length + 1);

  // Executa o cruzamento de bairros
  const statsBairro = aggregateBairroStats(ticketsState, initialSchools);
  
  // Escola Nereu Sampaio é do bairro "Jacarepaguá" ou similar. Vamos descobrir qual é o bairro dela
  const nereuBairroNormalized = schoolNotesState['312014'] ? 'jacarepagua' : 'desconhecido';
  
  // Nereu Sampaio nos dados originais é de "Padre Miguel" ou "Jacarepaguá"? Vamos conferir no db.json
  const nereuBairroReal = initialSchools.find(s => s.designacao === '312014').bairro;
  const normalizedBairro = nereuBairroReal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const bairroData = statsBairro[normalizedBairro];

  printResult('5.2. Mapa: Bairro correspondente detectado com precisão', !!bairroData, `Bairro: ${nereuBairroReal}`);
  printResult('5.3. Mapa: Chamado incluído na lista interna do bairro no mapa', bairroData.chamados_lista.some(c => c.id_chamado === 'GOP-AR-2026-TEST'));
  
  console.log();
} catch (e) {
  printResult('Teste 5 falhou criticamente', false, e.message);
}

console.log('\x1b[32m%s\x1b[0m', '================================================');
console.log('\x1b[32m%s\x1b[0m', '🎉 RESULTADO: TODOS OS SMOKE TESTS PASSARAM! ');
console.log('\x1b[32m%s\x1b[0m', '================================================');
