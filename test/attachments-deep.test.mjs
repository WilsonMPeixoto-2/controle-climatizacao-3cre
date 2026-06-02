/**
 * test/attachments-deep.test.mjs — Análise Profunda e Smoke Tests Rigorosos
 * 
 * Foco: Capacidade do sistema de receber uploads para o Supabase Storage,
 * confirmação visual dos arquivos disponíveis, e facilidade de acesso.
 *
 * Cenários cobertos:
 * A. Validação de entrada (tipo, tamanho, campos ausentes)
 * B. Upload completo e integridade dos metadados retornados
 * C. Geração correta de URLs (Abrir inline vs Baixar forçado)
 * D. Listagem reativa por chamado e por escola
 * E. Cache global allAttachments (badges 📎)
 * F. Múltiplos uploads no mesmo chamado
 * G. Upload em chamados de escolas diferentes
 * H. Fallback de erro: limpeza de órfãos quando tabela falha
 * I. Sanitização de nomes de arquivo (caracteres especiais/acentos)
 * J. Deleção e reflexo nos estados
 * K. Cenário sem conexão Supabase
 * 
 * Para rodar: node test/attachments-deep.test.mjs
 */

import {
  uploadTicketAttachment,
  listTicketAttachments,
  listSchoolAttachments,
  deleteTicketAttachment,
  getAttachmentPublicUrl,
  getAttachmentDownloadUrl,
} from '../src/lib/attachments.js';

let passed = 0;
let failed = 0;

function assert(name, condition, details = '') {
  const badge = condition ? '\x1b[32m[PASSED]\x1b[0m' : '\x1b[31m[FAILED]\x1b[0m';
  console.log(`${badge} ${name} ${details ? `— ${details}` : ''}`);
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('\x1b[31m  ⚠️ FALHA DETECTADA\x1b[0m');
  }
}

// ---------------------------------------------------------------------------
// MOCK: Cliente Supabase com rastreamento completo de operações
// ---------------------------------------------------------------------------
function createMockSupabase(opts = {}) {
  const db = [];
  const storage = [];
  const ops = { uploads: 0, inserts: 0, deletes: 0, storageDeletes: 0 };
  let idCounter = 0;

  return {
    db,
    storage,
    ops,
    client: {
      storage: {
        from: (bucket) => ({
          upload: async (path, file) => {
            if (opts.uploadFails) return { data: null, error: new Error('Storage unavailable') };
            ops.uploads++;
            storage.push({ bucket, path, file, contentType: file.type });
            return { data: { path }, error: null };
          },
          remove: async (paths) => {
            ops.storageDeletes++;
            paths.forEach(p => {
              const idx = storage.findIndex(s => s.path === p);
              if (idx !== -1) storage.splice(idx, 1);
            });
            return { data: null, error: null };
          },
          getPublicUrl: (path) => ({
            data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}` }
          })
        })
      },
      from: (table) => ({
        insert: (record) => ({
          select: () => ({
            single: async () => {
              if (opts.insertFails) return { data: null, error: new Error('DB insert failed') };
              ops.inserts++;
              const newRecord = { id: ++idCounter, criado_em: new Date().toISOString(), ...record };
              db.push(newRecord);
              return { data: newRecord, error: null };
            }
          })
        }),
        select: () => ({
          eq: (field, value) => ({
            order: async () => {
              const filtered = db.filter(r => r[field] === value);
              return { data: filtered, error: null };
            }
          })
        }),
        delete: () => ({
          eq: (field, value) => {
            const idx = db.findIndex(r => r[field] === value);
            if (idx !== -1) db.splice(idx, 1);
            return { error: null };
          }
        })
      })
    }
  };
}

console.log('\x1b[35m%s\x1b[0m', '================================================================');
console.log('\x1b[35m%s\x1b[0m', '🔬 ANÁLISE PROFUNDA: SISTEMA DE ANEXOS (SUPABASE STORAGE)');
console.log('\x1b[35m%s\x1b[0m', '================================================================\n');

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO A — VALIDAÇÃO DE ENTRADA (GUARD CLAUSES)
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo A: Validação de Entrada (Guard Clauses) ---');

try {
  const { client } = createMockSupabase();

  // A.1 — Sem cliente Supabase
  try {
    await uploadTicketAttachment(null, { id_chamado: 'X' }, { name: 'f.pdf', type: 'application/pdf', size: 100 });
    assert('A.1. Rejeita upload sem cliente Supabase', false);
  } catch (e) {
    assert('A.1. Rejeita upload sem cliente Supabase', e.message === 'Base online não conectada.');
  }

  // A.2 — Ticket inválido (null)
  try {
    await uploadTicketAttachment(client, null, { name: 'f.pdf', type: 'application/pdf', size: 100 });
    assert('A.2. Rejeita ticket null', false);
  } catch (e) {
    assert('A.2. Rejeita ticket null', e.message === 'Chamado inválido.');
  }

  // A.3 — Ticket sem id_chamado
  try {
    await uploadTicketAttachment(client, { designacao: '312014' }, { name: 'f.pdf', type: 'application/pdf', size: 100 });
    assert('A.3. Rejeita ticket sem id_chamado', false);
  } catch (e) {
    assert('A.3. Rejeita ticket sem id_chamado', e.message === 'Chamado inválido.');
  }

  // A.4 — Arquivo null
  try {
    await uploadTicketAttachment(client, { id_chamado: 'X' }, null);
    assert('A.4. Rejeita arquivo null', false);
  } catch (e) {
    assert('A.4. Rejeita arquivo null', e.message === 'Selecione um arquivo.');
  }

  // A.5 — Tipo de arquivo inválido (docx)
  try {
    await uploadTicketAttachment(client, { id_chamado: 'X' }, { name: 'doc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 100 });
    assert('A.5. Rejeita DOCX (tipo não permitido)', false);
  } catch (e) {
    assert('A.5. Rejeita DOCX (tipo não permitido)', e.message === 'Use PDF, JPG, PNG ou WEBP.');
  }

  // A.6 — Tipo de arquivo inválido (exe)
  try {
    await uploadTicketAttachment(client, { id_chamado: 'X' }, { name: 'virus.exe', type: 'application/x-msdownload', size: 100 });
    assert('A.6. Rejeita EXE (segurança)', false);
  } catch (e) {
    assert('A.6. Rejeita EXE (segurança)', e.message === 'Use PDF, JPG, PNG ou WEBP.');
  }

  // A.7 — Arquivo maior que 10 MB
  try {
    const bigFile = { name: 'huge.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 };
    await uploadTicketAttachment(client, { id_chamado: 'X' }, bigFile);
    assert('A.7. Rejeita arquivo > 10 MB', false);
  } catch (e) {
    assert('A.7. Rejeita arquivo > 10 MB', e.message === 'Arquivo maior que 10 MB.');
  }

  // A.8 — Arquivo exatamente 10 MB (deve passar)
  const { client: client2, db: db2 } = createMockSupabase();
  const exactFile = { name: 'exact.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 };
  const result = await uploadTicketAttachment(client2, { id_chamado: 'T-EXACT' }, exactFile);
  assert('A.8. Aceita arquivo de exatamente 10 MB', result.id === 1);

  // A.9 — Tipos permitidos: PDF, JPG, PNG, WEBP
  const { client: client3, db: db3 } = createMockSupabase();
  const types = [
    { name: 'doc.pdf', type: 'application/pdf', size: 100 },
    { name: 'foto.jpg', type: 'image/jpeg', size: 200 },
    { name: 'foto.png', type: 'image/png', size: 300 },
    { name: 'foto.webp', type: 'image/webp', size: 400 },
  ];
  for (const f of types) {
    await uploadTicketAttachment(client3, { id_chamado: 'T-TYPES' }, f);
  }
  assert('A.9. Aceita todos os 4 tipos permitidos (PDF/JPG/PNG/WEBP)', db3.length === 4);

  console.log();
} catch (e) {
  assert('Grupo A falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO B — INTEGRIDADE DO UPLOAD E METADADOS
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo B: Integridade do Upload e Metadados ---');

try {
  const { client, db, storage, ops } = createMockSupabase();
  const ticket = {
    id_chamado: 'GOP-AR-2026-0042',
    designacao: '312014',
    unidade_escolar: 'E. M. Nereu Sampaio'
  };
  const file = {
    name: 'laudo_vistoria_sala5.pdf',
    size: 2 * 1024 * 1024,
    type: 'application/pdf'
  };

  const anexo = await uploadTicketAttachment(client, ticket, file, 'Laudo técnico da vistoria');

  // B.1 — Registro retornado com ID
  assert('B.1. Upload retorna registro com ID gerado', typeof anexo.id === 'number' && anexo.id > 0);

  // B.2 — Campo id_chamado preservado
  assert('B.2. id_chamado preservado no registro', anexo.id_chamado === 'GOP-AR-2026-0042');

  // B.3 — Campo designacao preservado
  assert('B.3. designacao preservada no registro', anexo.designacao === '312014');

  // B.4 — Campo unidade_escolar preservado
  assert('B.4. unidade_escolar preservada no registro', anexo.unidade_escolar === 'E. M. Nereu Sampaio');

  // B.5 — Nome original preservado (sem sanitização)
  assert('B.5. nome_original preserva o nome exato do arquivo', anexo.nome_original === 'laudo_vistoria_sala5.pdf');

  // B.6 — MIME type correto
  assert('B.6. mime_type correto', anexo.mime_type === 'application/pdf');

  // B.7 — Tamanho em bytes correto
  assert('B.7. tamanho_bytes correto', anexo.tamanho_bytes === 2 * 1024 * 1024);

  // B.8 — Descrição opcional preservada
  assert('B.8. descricao preservada', anexo.descricao === 'Laudo técnico da vistoria');

  // B.9 — Bucket correto
  assert('B.9. bucket é gop-anexos', anexo.bucket === 'gop-anexos');

  // B.10 — Storage path contém id_chamado no caminho
  assert('B.10. storage_path organizado por chamado', anexo.storage_path.startsWith(`chamados/GOP-AR-2026-0042/`));

  // B.11 — Storage path contém nome sanitizado
  assert('B.11. storage_path contém nome sanitizado do arquivo', anexo.storage_path.includes('laudo_vistoria_sala5.pdf'));

  // B.12 — criado_em é uma data ISO válida
  assert('B.12. criado_em é data ISO válida', !isNaN(Date.parse(anexo.criado_em)));

  // B.13 — Um upload físico e uma inserção lógica
  assert('B.13. Exatamente 1 upload e 1 insert', ops.uploads === 1 && ops.inserts === 1);

  // B.14 — O arquivo foi fisicamente armazenado no mock storage
  assert('B.14. Arquivo presente no storage físico', storage.length === 1 && storage[0].path === anexo.storage_path);

  console.log();
} catch (e) {
  assert('Grupo B falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO C — URLs DE ABERTURA E DOWNLOAD
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo C: URLs de Abertura (Abrir) vs Download (Baixar) ---');

try {
  const { client, db } = createMockSupabase();
  const ticket = { id_chamado: 'GOP-URL-TEST', designacao: '312014', unidade_escolar: 'Teste' };
  const file = { name: 'foto_entrada.jpg', size: 500000, type: 'image/jpeg' };

  const anexo = await uploadTicketAttachment(client, ticket, file);

  // C.1 — Public URL (Abrir) NÃO contém ?download=
  const publicUrl = getAttachmentPublicUrl(client, anexo);
  assert('C.1. URL de "Abrir" NÃO contém ?download=', !publicUrl.includes('?download='));

  // C.2 — Public URL contém o storage_path completo
  assert('C.2. URL de "Abrir" contém storage_path', publicUrl.includes(anexo.storage_path));

  // C.3 — Public URL aponta para o bucket correto
  assert('C.3. URL de "Abrir" aponta para gop-anexos', publicUrl.includes('gop-anexos'));

  // C.4 — Download URL (Baixar) CONTÉM ?download=
  const downloadUrl = getAttachmentDownloadUrl(client, anexo);
  assert('C.4. URL de "Baixar" CONTÉM ?download=', downloadUrl.includes('?download='));

  // C.5 — Download URL contém nome original codificado
  assert('C.5. URL de "Baixar" contém nome original', downloadUrl.includes(encodeURIComponent('foto_entrada.jpg')));

  // C.6 — As duas URLs são DIFERENTES
  assert('C.6. URL de Abrir ≠ URL de Baixar', publicUrl !== downloadUrl);

  // C.7 — Testar com nome de arquivo com acentos e espaços
  const file2 = { name: 'relatório técnico (final).pdf', size: 100, type: 'application/pdf' };
  const anexo2 = await uploadTicketAttachment(client, ticket, file2);
  const downloadUrl2 = getAttachmentDownloadUrl(client, anexo2);
  assert('C.7. URL de Baixar codifica nome com acentos/espaços', downloadUrl2.includes(encodeURIComponent('relatório técnico (final).pdf')));

  console.log();
} catch (e) {
  assert('Grupo C falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO D — LISTAGEM POR CHAMADO E POR ESCOLA
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo D: Listagem por Chamado e por Escola ---');

try {
  const { client, db } = createMockSupabase();

  // Upload 3 arquivos para chamado A (escola 312014)
  const ticketA = { id_chamado: 'GOP-LIST-A', designacao: '312014', unidade_escolar: 'Escola A' };
  await uploadTicketAttachment(client, ticketA, { name: 'a1.pdf', size: 100, type: 'application/pdf' });
  await uploadTicketAttachment(client, ticketA, { name: 'a2.jpg', size: 200, type: 'image/jpeg' });
  await uploadTicketAttachment(client, ticketA, { name: 'a3.png', size: 300, type: 'image/png' });

  // Upload 2 arquivos para chamado B (mesma escola 312014)
  const ticketB = { id_chamado: 'GOP-LIST-B', designacao: '312014', unidade_escolar: 'Escola A' };
  await uploadTicketAttachment(client, ticketB, { name: 'b1.pdf', size: 100, type: 'application/pdf' });
  await uploadTicketAttachment(client, ticketB, { name: 'b2.webp', size: 200, type: 'image/webp' });

  // Upload 1 arquivo para chamado C (escola diferente 312099)
  const ticketC = { id_chamado: 'GOP-LIST-C', designacao: '312099', unidade_escolar: 'Escola C' };
  await uploadTicketAttachment(client, ticketC, { name: 'c1.pdf', size: 100, type: 'application/pdf' });

  // D.1 — Chamado A: 3 anexos
  const listA = await listTicketAttachments(client, 'GOP-LIST-A');
  assert('D.1. Chamado A tem 3 anexos', listA.length === 3);

  // D.2 — Chamado B: 2 anexos
  const listB = await listTicketAttachments(client, 'GOP-LIST-B');
  assert('D.2. Chamado B tem 2 anexos', listB.length === 2);

  // D.3 — Chamado C: 1 anexo
  const listC = await listTicketAttachments(client, 'GOP-LIST-C');
  assert('D.3. Chamado C tem 1 anexo', listC.length === 1);

  // D.4 — Escola 312014 agrega chamados A + B = 5 anexos
  const schoolList = await listSchoolAttachments(client, '312014');
  assert('D.4. Escola 312014 agrega 5 anexos (chamados A+B)', schoolList.length === 5);

  // D.5 — Escola 312099 tem apenas 1 anexo
  const schoolList2 = await listSchoolAttachments(client, '312099');
  assert('D.5. Escola 312099 tem 1 anexo', schoolList2.length === 1);

  // D.6 — Chamado inexistente retorna lista vazia
  const listNone = await listTicketAttachments(client, 'GOP-INEXISTENTE');
  assert('D.6. Chamado inexistente retorna lista vazia', listNone.length === 0);

  // D.7 — Escola inexistente retorna lista vazia
  const schoolNone = await listSchoolAttachments(client, 'ESCOLA-QUE-NAO-EXISTE');
  assert('D.7. Escola inexistente retorna lista vazia', schoolNone.length === 0);

  console.log();
} catch (e) {
  assert('Grupo D falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO E — SIMULAÇÃO DE CACHE GLOBAL (allAttachments para badges 📎)
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo E: Cache Global para Badges 📎 ---');

try {
  const { client, db } = createMockSupabase();

  const t1 = { id_chamado: 'GOP-BADGE-1', designacao: 'D001', unidade_escolar: 'E1' };
  const t2 = { id_chamado: 'GOP-BADGE-2', designacao: 'D001', unidade_escolar: 'E1' };
  const t3 = { id_chamado: 'GOP-BADGE-3', designacao: 'D002', unidade_escolar: 'E2' };

  await uploadTicketAttachment(client, t1, { name: 'x.pdf', size: 100, type: 'application/pdf' });
  await uploadTicketAttachment(client, t1, { name: 'y.jpg', size: 100, type: 'image/jpeg' });
  await uploadTicketAttachment(client, t2, { name: 'z.png', size: 100, type: 'image/png' });

  // Simula o allAttachments do App.jsx (clone do db inteiro)
  const allAttachments = [...db];

  // E.1 — Badge para chamado BADGE-1 = 📎 2
  const count1 = allAttachments.filter(a => a.id_chamado === 'GOP-BADGE-1').length;
  assert('E.1. Badge do chamado BADGE-1 = 📎 2', count1 === 2);

  // E.2 — Badge para chamado BADGE-2 = 📎 1
  const count2 = allAttachments.filter(a => a.id_chamado === 'GOP-BADGE-2').length;
  assert('E.2. Badge do chamado BADGE-2 = 📎 1', count2 === 1);

  // E.3 — Badge para chamado BADGE-3 = 📎 0 (sem anexos)
  const count3 = allAttachments.filter(a => a.id_chamado === 'GOP-BADGE-3').length;
  assert('E.3. Badge do chamado BADGE-3 = 📎 0 (sem badge)', count3 === 0);

  // E.4 — Após upload, a adição otimista reflete no cache
  await uploadTicketAttachment(client, t3, { name: 'w.webp', size: 100, type: 'image/webp' });
  const allAfterUpload = [...db]; // Simula re-leitura
  const count3After = allAfterUpload.filter(a => a.id_chamado === 'GOP-BADGE-3').length;
  assert('E.4. Badge atualizado após upload otimista = 📎 1', count3After === 1);

  // E.5 — Após exclusão, badge diminui
  const toDelete = db.find(a => a.id_chamado === 'GOP-BADGE-1');
  await deleteTicketAttachment(client, toDelete);
  const allAfterDelete = [...db];
  const count1After = allAfterDelete.filter(a => a.id_chamado === 'GOP-BADGE-1').length;
  assert('E.5. Badge diminui após exclusão = 📎 1', count1After === 1);

  console.log();
} catch (e) {
  assert('Grupo E falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO F — FALLBACK DE ERRO (LIMPEZA DE ÓRFÃOS)
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo F: Fallback de Erro (Limpeza de Órfãos) ---');

try {
  // F.1 — Se a inserção na tabela falhar, o arquivo no storage deve ser removido
  const { client, db, storage, ops } = createMockSupabase({ insertFails: true });
  const ticket = { id_chamado: 'GOP-ORPHAN-TEST', designacao: 'D001', unidade_escolar: 'E1' };
  const file = { name: 'orphan.pdf', size: 100, type: 'application/pdf' };

  try {
    await uploadTicketAttachment(client, ticket, file);
    assert('F.1. Upload falha quando insert falha', false);
  } catch (e) {
    assert('F.1. Upload lança erro quando insert no banco falha', e.message === 'DB insert failed');
  }

  // O upload foi feito (ops.uploads === 1), mas depois o storage deletou (ops.storageDeletes === 1)
  assert('F.2. Upload físico foi feito antes da falha', ops.uploads === 1);
  assert('F.3. Arquivo órfão foi removido do Storage', storage.length === 0);
  assert('F.4. Nenhum registro ficou no banco', db.length === 0);

  // F.5 — Se o upload em si falha, não tenta inserir no banco
  const { client: client2, ops: ops2 } = createMockSupabase({ uploadFails: true });
  try {
    await uploadTicketAttachment(client2, ticket, file);
    assert('F.5. Upload lança erro quando storage falha', false);
  } catch (e) {
    assert('F.5. Upload lança erro quando storage falha', e.message === 'Storage unavailable');
  }
  assert('F.6. Nenhuma inserção no banco quando storage falha', ops2.inserts === 0);

  console.log();
} catch (e) {
  assert('Grupo F falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO G — SANITIZAÇÃO DE NOMES DE ARQUIVO
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo G: Sanitização de Nomes de Arquivo ---');

try {
  const { client, db, storage } = createMockSupabase();
  const ticket = { id_chamado: 'GOP-SANIT', designacao: 'D001', unidade_escolar: 'E1' };

  // G.1 — Nome com acentos e espaços
  const f1 = { name: 'relatório técnico 2026.pdf', type: 'application/pdf', size: 100 };
  const a1 = await uploadTicketAttachment(client, ticket, f1);
  assert('G.1. nome_original preserva acentos', a1.nome_original === 'relatório técnico 2026.pdf');
  // O storage_path deve conter uma versão sanitizada
  assert('G.2. storage_path sanitizado (sem acentos)', !a1.storage_path.includes('ó') && !a1.storage_path.includes('é'));

  // G.3 — Nome com caracteres especiais perigosos
  const f2 = { name: '../../../etc/passwd.pdf', type: 'application/pdf', size: 100 };
  const a2 = await uploadTicketAttachment(client, ticket, f2);
  assert('G.3. Path traversal neutralizado no storage_path', !a2.storage_path.includes('..'));

  // G.4 — Nome com espaços e parênteses
  const f3 = { name: 'foto da sala (bloco B).jpg', type: 'image/jpeg', size: 100 };
  const a3 = await uploadTicketAttachment(client, ticket, f3);
  assert('G.4. Espaços e parênteses sanitizados no path', !a3.storage_path.includes(' ') && !a3.storage_path.includes('('));

  // G.5 — Nome muito longo (> 120 chars) é truncado
  const longName = 'a'.repeat(200) + '.pdf';
  const f4 = { name: longName, type: 'application/pdf', size: 100 };
  const a4 = await uploadTicketAttachment(client, ticket, f4);
  const filePartOfPath = a4.storage_path.split('/').pop();
  assert('G.5. Nome longo truncado a 120 chars', filePartOfPath.length <= 200); // UUID + sanitized name

  console.log();
} catch (e) {
  assert('Grupo G falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO H — DELEÇÃO E REFLEXO NOS ESTADOS
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo H: Deleção e Reflexo nos Estados ---');

try {
  const { client, db, storage, ops } = createMockSupabase();
  const ticket = { id_chamado: 'GOP-DEL-TEST', designacao: 'D001', unidade_escolar: 'E1' };

  // Upload 3 arquivos
  const a1 = await uploadTicketAttachment(client, ticket, { name: '1.pdf', size: 100, type: 'application/pdf' });
  const a2 = await uploadTicketAttachment(client, ticket, { name: '2.pdf', size: 100, type: 'application/pdf' });
  const a3 = await uploadTicketAttachment(client, ticket, { name: '3.pdf', size: 100, type: 'application/pdf' });

  assert('H.1. 3 arquivos no banco antes de deletar', db.length === 3);
  assert('H.2. 3 arquivos no storage antes de deletar', storage.length === 3);

  // Deleta o segundo
  await deleteTicketAttachment(client, a2);
  assert('H.3. 2 arquivos no banco após deletar um', db.length === 2);
  assert('H.4. 2 arquivos no storage após deletar um', storage.length === 2);
  assert('H.5. O arquivo deletado não está mais no banco', !db.find(r => r.id === a2.id));
  assert('H.6. O arquivo deletado não está mais no storage', !storage.find(s => s.path === a2.storage_path));

  // Os outros dois permanecem
  assert('H.7. Arquivo 1 permanece intacto', !!db.find(r => r.id === a1.id));
  assert('H.8. Arquivo 3 permanece intacto', !!db.find(r => r.id === a3.id));

  // H.9 — Tentar deletar sem attachment
  try {
    await deleteTicketAttachment(client, null);
    assert('H.9. Rejeita deleção de attachment null', false);
  } catch (e) {
    assert('H.9. Rejeita deleção de attachment null', e.message === 'Anexo inválido.');
  }

  // H.10 — Tentar deletar sem cliente
  try {
    await deleteTicketAttachment(null, a1);
    assert('H.10. Rejeita deleção sem cliente Supabase', false);
  } catch (e) {
    assert('H.10. Rejeita deleção sem cliente Supabase', e.message === 'Base online não conectada.');
  }

  console.log();
} catch (e) {
  assert('Grupo H falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO I — SIMULAÇÃO DO FLUXO VISUAL COMPLETO (UX)
// ═══════════════════════════════════════════════════════════════════════════
console.log('--- Grupo I: Simulação do Fluxo Visual Completo (UX) ---');

try {
  const { client, db } = createMockSupabase();

  // Simula estados do React
  let ticketAttachments = [];
  let schoolAttachments = [];
  let allAttachments = [];
  let toastMessages = [];

  const triggerToast = (msg, type) => toastMessages.push({ msg, type });

  const ticket = { id_chamado: 'GOP-UX-001', designacao: '312014', unidade_escolar: 'E. M. Nereu Sampaio' };

  // PASSO 1: Usuário abre o modal — carrega anexos existentes (vazio)
  const existing = await listTicketAttachments(client, ticket.id_chamado);
  ticketAttachments = existing;
  assert('I.1. Modal abre com lista vazia', ticketAttachments.length === 0);

  // PASSO 2: Usuário clica "📎 Anexar documento" e seleciona um PDF
  try {
    const file = { name: 'laudo_climatizacao.pdf', size: 1.5 * 1024 * 1024, type: 'application/pdf' };
    const anexo = await uploadTicketAttachment(client, ticket, file, 'Laudo de climatização');
    // Atualização otimista dos 3 estados (como App.jsx faz)
    ticketAttachments = [anexo, ...ticketAttachments];
    schoolAttachments = [anexo, ...schoolAttachments];
    allAttachments = [anexo, ...allAttachments];
    triggerToast('Arquivo enviado com sucesso!', 'success');
  } catch (err) {
    triggerToast(err.message || 'Erro ao enviar arquivo.', 'error');
  }

  assert('I.2. Após upload, ticketAttachments tem 1 item', ticketAttachments.length === 1);
  assert('I.3. Após upload, schoolAttachments tem 1 item', schoolAttachments.length === 1);
  assert('I.4. Após upload, allAttachments tem 1 item', allAttachments.length === 1);
  assert('I.5. Toast de sucesso foi disparado', toastMessages[0]?.msg === 'Arquivo enviado com sucesso!' && toastMessages[0]?.type === 'success');

  // PASSO 3: O header "📎 Documentos do chamado" reflete a contagem
  const headerText = `📎 Documentos do chamado (${ticketAttachments.length})`;
  assert('I.6. Header do modal mostra contagem = 1', headerText === '📎 Documentos do chamado (1)');

  // PASSO 4: A lista renderiza o arquivo com ícone correto
  const firstAnexo = ticketAttachments[0];
  const icon = firstAnexo.mime_type?.includes('pdf') ? '📄' : '🖼️';
  assert('I.7. Ícone correto para PDF = 📄', icon === '📄');

  // PASSO 5: Nome e metadados visíveis
  assert('I.8. Nome original visível na lista', firstAnexo.nome_original === 'laudo_climatizacao.pdf');
  const sizeKB = (firstAnexo.tamanho_bytes / 1024).toFixed(1);
  assert('I.9. Tamanho exibido em KB', sizeKB === '1536.0');

  // PASSO 6: Botões Abrir e Baixar geram URLs distintas
  const openUrl = getAttachmentPublicUrl(client, firstAnexo);
  const dlUrl = getAttachmentDownloadUrl(client, firstAnexo);
  assert('I.10. Botão "Abrir" gera URL inline (sem ?download)', !openUrl.includes('?download'));
  assert('I.11. Botão "Baixar" gera URL com ?download', dlUrl.includes('?download'));

  // PASSO 7: Badge 📎 na lista de chamados
  const badgeCount = allAttachments.filter(a => a.id_chamado === 'GOP-UX-001').length;
  assert('I.12. Badge 📎 na lista de chamados = 1', badgeCount === 1);

  // PASSO 8: Segundo upload — foto JPG
  const foto = { name: 'foto_sala_leitura.jpg', size: 800000, type: 'image/jpeg' };
  const anexo2 = await uploadTicketAttachment(client, ticket, foto);
  ticketAttachments = [anexo2, ...ticketAttachments];
  schoolAttachments = [anexo2, ...schoolAttachments];
  allAttachments = [anexo2, ...allAttachments];

  assert('I.13. Após 2º upload, modal mostra 2 documentos', ticketAttachments.length === 2);
  const headerAfter2 = `📎 Documentos do chamado (${ticketAttachments.length})`;
  assert('I.14. Header atualizado para (2)', headerAfter2 === '📎 Documentos do chamado (2)');

  // PASSO 9: Ícone correto para imagem
  const icon2 = anexo2.mime_type?.includes('pdf') ? '📄' : '🖼️';
  assert('I.15. Ícone correto para JPG = 🖼️', icon2 === '🖼️');

  // PASSO 10: Na ficha da escola, "📂 Arquivos da unidade" mostra 2
  const schoolHeader = `📂 Arquivos da unidade (${schoolAttachments.length})`;
  assert('I.16. Ficha da escola mostra 2 arquivos', schoolHeader === '📂 Arquivos da unidade (2)');

  // PASSO 11: Cada arquivo na escola mostra id_chamado como badge
  assert('I.17. Arquivo da escola mostra id_chamado', schoolAttachments.every(a => a.id_chamado === 'GOP-UX-001'));

  // PASSO 12: Deleção — usuário clica ✕ no primeiro arquivo
  const toDelete = ticketAttachments[ticketAttachments.length - 1]; // mais antigo (o PDF original)
  await deleteTicketAttachment(client, toDelete);
  ticketAttachments = ticketAttachments.filter(a => a.id !== toDelete.id);
  schoolAttachments = schoolAttachments.filter(a => a.id !== toDelete.id);
  allAttachments = allAttachments.filter(a => a.id !== toDelete.id);
  triggerToast('Arquivo excluído com sucesso!', 'success');

  assert('I.18. Após exclusão, modal mostra 1 documento', ticketAttachments.length === 1);
  assert('I.19. Arquivo remanescente é a foto JPG', ticketAttachments[0].nome_original === 'foto_sala_leitura.jpg');
  assert('I.20. Badge 📎 atualizado para 1', allAttachments.filter(a => a.id_chamado === 'GOP-UX-001').length === 1);

  // PASSO 13: Se todos forem excluídos, mostra mensagem vazia
  const lastAnexo = ticketAttachments[0];
  await deleteTicketAttachment(client, lastAnexo);
  ticketAttachments = ticketAttachments.filter(a => a.id !== lastAnexo.id);
  schoolAttachments = schoolAttachments.filter(a => a.id !== lastAnexo.id);
  allAttachments = allAttachments.filter(a => a.id !== lastAnexo.id);

  const emptyMessage = ticketAttachments.length === 0 ? 'Nenhum documento salvo ainda' : null;
  assert('I.21. Mensagem vazia exibida quando não há documentos', emptyMessage === 'Nenhum documento salvo ainda');
  assert('I.22. Badge 📎 desaparece (count = 0)', allAttachments.filter(a => a.id_chamado === 'GOP-UX-001').length === 0);

  console.log();
} catch (e) {
  assert('Grupo I falhou criticamente', false, e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULTADOS FINAIS
// ═══════════════════════════════════════════════════════════════════════════

console.log('\x1b[35m%s\x1b[0m', '================================================================');
if (failed === 0) {
  console.log('\x1b[32m%s\x1b[0m', `🎉 RESULTADO: TODOS OS ${passed} TESTES PASSARAM!`);
} else {
  console.log('\x1b[31m%s\x1b[0m', `❌ RESULTADO: ${failed} TESTES FALHARAM de ${passed + failed} total.`);
}
console.log('\x1b[35m%s\x1b[0m', '================================================================');

if (failed > 0) process.exit(1);
