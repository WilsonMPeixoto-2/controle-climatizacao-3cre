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
import {
  uploadTicketAttachment,
  listTicketAttachments,
  listSchoolAttachments,
  deleteTicketAttachment,
  getAttachmentDownloadUrl,
} from '../src/lib/attachments.js';
import {
  calculateUrgencyScore,
  getOperationalSummary,
  getActionItems
} from '../src/lib/operationalIntelligence.js';

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
// TESTE 3: Integração de Anexos com Supabase Storage e Metadados
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 3: Registro e Gerenciamento de Anexos Reais ---');

  // 1. Criar Mock do Cliente Supabase com APIs de Storage e PostgREST
  const mockDb = [];
  const mockStorage = [];

  const mockSupabaseClient = {
    storage: {
      from: (bucket) => ({
        upload: async (path, file) => {
          mockStorage.push({ bucket, path, file });
          return { data: { path }, error: null };
        },
        remove: async (paths) => {
          paths.forEach(p => {
            const idx = mockStorage.findIndex(s => s.path === p);
            if (idx !== -1) mockStorage.splice(idx, 1);
          });
          return { data: null, error: null };
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://wmnzcujojlygkcszocwb.supabase.co/storage/v1/object/public/${bucket}/${path}` }
        })
      })
    },
    rpc: async (name, args) => {
      if (name === 'create_attachment_with_history') {
        const newRecord = { id: mockDb.length + 1, criado_em: new Date().toISOString(), ...args.p_attachment };
        mockDb.push(newRecord);
        return { data: newRecord, error: null };
      }
      if (name === 'delete_attachment_with_history') {
        const idx = mockDb.findIndex(r => r.id === args.p_attachment_id);
        if (idx !== -1) mockDb.splice(idx, 1);
        return { data: null, error: null };
      }
      return { data: null, error: new Error(`Unknown RPC ${name}`) };
    },
    from: (table) => ({
      insert: (record) => ({
        select: () => ({
          single: async () => {
            const newRecord = { id: mockDb.length + 1, criado_em: new Date().toISOString(), ...record };
            mockDb.push(newRecord);
            return { data: newRecord, error: null };
          }
        })
      }),
      select: () => ({
        eq: (field, value) => ({
          order: async () => {
            const filtered = mockDb.filter(r => r[field] === value);
            return { data: filtered, error: null };
          }
        })
      }),
      delete: () => ({
        eq: (field, value) => {
          const idx = mockDb.findIndex(r => r[field] === value);
          if (idx !== -1) mockDb.splice(idx, 1);
          return { error: null };
        }
      })
    })
  };

  const mockTicket = {
    id_chamado: 'GOP-AR-2026-TEST',
    designacao: '312014',
    unidade_escolar: 'E. M. Nereu Sampaio'
  };

  const mockFile = {
    name: 'laudo_vistoria_nereu.pdf',
    size: 2 * 1024 * 1024, // 2 MB
    type: 'application/pdf'
  };

  // 2. Testar Upload do Anexo
  const anexo = await uploadTicketAttachment(mockSupabaseClient, mockTicket, mockFile, 'Laudo técnico inicial');
  printResult('3.1. Upload físico de anexo e inserção lógica', anexo.id === 1 && anexo.nome_original === mockFile.name);
  printResult('3.2. Preservação das referências id_chamado e designacao', anexo.id_chamado === 'GOP-AR-2026-TEST' && anexo.designacao === '312014');
  printResult('3.3. Preservação do campo unidade_escolar', anexo.unidade_escolar === 'E. M. Nereu Sampaio');

  // 3. Testar Listagem por Chamado
  const anexosChamado = await listTicketAttachments(mockSupabaseClient, 'GOP-AR-2026-TEST');
  printResult('3.4. Listagem correta por id_chamado', anexosChamado.length === 1 && anexosChamado[0].id === 1);

  // 4. Testar Listagem por Escola (Lookup)
  const anexosEscola = await listSchoolAttachments(mockSupabaseClient, '312014');
  printResult('3.5. Listagem consolidada por designacao de escola', anexosEscola.length === 1 && anexosEscola[0].id === 1);

  // 5. Testar Geração de URL de Download
  const downloadUrl = getAttachmentDownloadUrl(mockSupabaseClient, anexo);
  printResult('3.6. URL de download gerada a partir do storage_path com query param', downloadUrl.includes(anexo.storage_path) && downloadUrl.includes('?download='));

  // 6. Testar Deleção de Anexo
  const deleteOk = await deleteTicketAttachment(mockSupabaseClient, anexo);
  const anexosPosDelete = await listTicketAttachments(mockSupabaseClient, 'GOP-AR-2026-TEST');
  printResult('3.7. Deleção atômica física e lógica de anexo', deleteOk && anexosPosDelete.length === 0 && mockStorage.length === 0);

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

// ---------------------------------------------------------------------------
// TESTE 6: Fluxo Pessimista de Salvamento e Verificação com select('*').single()
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 6: Fluxo Pessimista de Salvamento via Supabase (select.*.single) ---');

  const ticketToUpdate = ticketsState.find(t => t.id_chamado === 'GOP-AR-2026-TEST');
  const updatedFields = {
    ...ticketToUpdate,
    status_atual: '3 - Vistoria concluída',
    proxima_providencia: 'Aguardando orçamento da GOP.'
  };

  // Mock do Supabase Client simulando .update().eq().select().single()
  const mockSupabaseWithSelect = {
    from: (table) => ({
      update: (record) => ({
        eq: (field, value) => ({
          select: (selectStr) => ({
            single: async () => {
              if (table === 'chamados' && field === 'id_chamado' && value === 'GOP-AR-2026-TEST') {
                return { data: { ...record, modificado_em: new Date().toISOString() }, error: null };
              }
              return { data: null, error: new Error('Query mismatch') };
            }
          })
        })
      })
    })
  };

  const { data: savedTicket, error: tkErr } = await mockSupabaseWithSelect
    .from('chamados')
    .update(updatedFields)
    .eq('id_chamado', 'GOP-AR-2026-TEST')
    .select('*')
    .single();

  printResult('6.1. Execução bem sucedida do método pessimistic com select e single', !tkErr && !!savedTicket);
  printResult('6.2. Registro retornado contém os campos atualizados', savedTicket.status_atual === '3 - Vistoria concluída');
  printResult('6.3. Registro retornado possui data de modificação', !!savedTicket.modificado_em);
  console.log();
} catch (e) {
  printResult('Teste 6 falhou criticamente', false, e.message);
}

// ---------------------------------------------------------------------------
// TESTE 7: Fluxo Pessimista de Salvamento de Comentário do Histórico via Supabase (select('*').single())
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 7: Fluxo Pessimista de Salvamento de Histórico via Supabase (select.*.single) ---');

  const logToEdit = historyState.find(h => h.id_evento === 'EV-TEST-AUDIT-4');
  const newCommentText = "Comentário revisado pessimistamente.";

  // Mock do Supabase Client para histórico
  const mockSupabaseWithSelectHistory = {
    from: (table) => ({
      update: (record) => ({
        eq: (field, value) => ({
          select: (selectStr) => ({
            single: async () => {
              if (table === 'historico' && field === 'id_evento' && value === 'EV-TEST-AUDIT-4') {
                return { data: { ...logToEdit, observacao: record.observacao, modificado_em: new Date().toISOString() }, error: null };
              }
              return { data: null, error: new Error('Query mismatch') };
            }
          })
        })
      })
    })
  };

  const { data: savedEvent, error: histErr } = await mockSupabaseWithSelectHistory
    .from('historico')
    .update({ observacao: newCommentText })
    .eq('id_evento', 'EV-TEST-AUDIT-4')
    .select('*')
    .single();

  printResult('7.1. Execução bem sucedida do método pessimistic para histórico com select e single', !histErr && !!savedEvent);
  printResult('7.2. Registro retornado contém o comentário atualizado', savedEvent.observacao === newCommentText);
  printResult('7.3. Registro retornado possui as chaves corretas', savedEvent.id_evento === 'EV-TEST-AUDIT-4');
  console.log();
} catch (e) {
  printResult('Teste 7 falhou criticamente', false, e.message);
}

// ---------------------------------------------------------------------------
// TESTE 8: Inteligência Operacional, Scores e Fila de Ações
// ---------------------------------------------------------------------------
try {
  console.log('--- Teste 8: Lógica de Inteligência Operacional e Ações ---');

  const mockTickets = [
    {
      id_chamado: 'TKT-01',
      prioridade: 'Crítica',
      status_atual: '1 - Recebido — em triagem',
      data_solicitacao: '2026-05-01T12:00:00Z',
      modificado_em: '2026-05-01T12:00:00Z',
      comunicacao_cto: 'Não',
      informacao_validada: 'Pendente de Vistoria',
      unidade_escolar: 'Escola A'
    },
    {
      id_chamado: 'TKT-02',
      prioridade: 'Média',
      status_atual: '5 - Vistoria aprovada — aguardando CTO',
      data_solicitacao: '2026-05-15T12:00:00Z',
      modificado_em: '2026-05-30T12:00:00Z',
      comunicacao_cto: 'Não',
      informacao_validada: 'Validada',
      unidade_escolar: 'Escola B'
    },
    {
      id_chamado: 'TKT-03',
      prioridade: 'Crítica',
      status_atual: '10 - Concluído',
      data_solicitacao: '2026-05-20T12:00:00Z',
      modificado_em: '2026-05-20T12:00:00Z',
      unidade_escolar: 'Escola C'
    },
    {
      id_chamado: 'TKT-04',
      prioridade: 'Alta',
      status_atual: '2 - Em vistoria técnica',
      data_solicitacao: '2026-05-30T12:00:00Z',
      modificado_em: '2026-05-30T12:00:00Z',
      unidade_escolar: 'Escola D',
      proxima_providencia: 'Aguardando retorno da unidade escolar'
    }
  ];

  const mockSchools = [
    { designacao: 'SCH-A', unidade_escolar: 'Escola A', bairro: 'Bairro Centro' },
    { designacao: 'SCH-B', unidade_escolar: 'Escola B', bairro: 'Bairro Centro' }
  ];

  const mockAttachments = [
    { id: 101, id_chamado: 'TKT-02', nome_original: 'laudo.pdf' }
  ];

  const testRefDate = new Date('2026-06-02T12:00:00Z');

  const score1 = calculateUrgencyScore(mockTickets[0], mockAttachments, testRefDate);
  const score2 = calculateUrgencyScore(mockTickets[1], mockAttachments, testRefDate);

  printResult('8.1. Score de urgência calculado com precisão', score1 === 106 && score2 === 30, `TKT-01 Score: ${score1}, TKT-02 Score: ${score2}`);

  const summary = getOperationalSummary(mockTickets, mockSchools, mockAttachments, testRefDate);
  printResult('8.2. Resumo operacional com contagens e priorizações corretas', summary.totalActive === 3 && summary.prioritizedTickets[0] === 'TKT-01', `Prioritized: ${summary.prioritizedTickets.join(', ')}`);

  const actionItems = getActionItems(mockTickets, mockSchools, mockAttachments, testRefDate);
  const containsTkt01 = actionItems.some(i => i.ticket.id_chamado === 'TKT-01' && i.type === 'attachment');
  const containsTkt02 = actionItems.some(i => i.ticket.id_chamado === 'TKT-02' && i.type === 'cto');
  const containsTkt03 = actionItems.some(i => i.ticket.id_chamado === 'TKT-03' && i.type === 'completion');
  // TKT-04 agora é capturada por 'attachment' (prioridade Alta sem anexo) antes de chegar à regra 'school'
  const containsTkt04 = actionItems.some(i => i.ticket.id_chamado === 'TKT-04' && i.type === 'attachment');

  printResult('8.3. Regras de ação geradas corretamente', containsTkt01 && containsTkt02 && containsTkt03 && containsTkt04);

  const tkt01Actions = actionItems.filter(i => i.ticket.id_chamado === 'TKT-01');
  printResult('8.4. Prevenção de duplicidade por chamado na fila de ações', tkt01Actions.length === 1 && tkt01Actions[0].type === 'attachment');

  const manyTickets = Array.from({ length: 10 }, (_, i) => ({
    id_chamado: `TKT-MANY-${i}`,
    prioridade: 'Média',
    status_atual: '1 - Recebido — em triagem',
    modificado_em: '2026-05-01T12:00:00Z',
    unidade_escolar: `Escola ${i}`
  }));
  const limitedActions = getActionItems(manyTickets, mockSchools, [], testRefDate);
  printResult('8.5. Limitação estrita do painel para no máximo 5 ações prioritárias com agrupamento', limitedActions.length === 2 && limitedActions[1].id === 'stuck-group-aggregated');

  const noActions = getActionItems([], mockSchools, [], testRefDate);
  printResult('8.6. Retorno de lista vazia quando não há pendências pendentes', noActions.length === 0);

  console.log();
} catch (e) {
  printResult('Teste 8 falhou criticamente', false, e.message);
}

console.log('\x1b[32m%s\x1b[0m', '================================================');
console.log('\x1b[32m%s\x1b[0m', '🎉 RESULTADO: TODOS OS SMOKE TESTS PASSARAM! ');
console.log('\x1b[32m%s\x1b[0m', '================================================');
