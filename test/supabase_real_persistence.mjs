/**
 * test/supabase_real_persistence.mjs — Teste de Persistência em Tempo Real no Supabase
 *
 * Este script conecta ao Supabase usando as credenciais de produção puxadas da Vercel,
 * e realiza uma transação real de atualização (UPDATE) de um chamado para provar que:
 * 1. O canal de edição altera os dados no Supabase.
 * 2. O banco de dados é atualizado permanentemente.
 *
 * Para rodar: node test/supabase_real_persistence.mjs
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Carregar credenciais do .env.production
const envPath = path.resolve('.env.production');
if (!fs.existsSync(envPath)) {
  console.error("ERRO: Arquivo .env.production não encontrado na raiz. Rode 'vercel env pull .env.production --environment production' primeiro.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(?:"([^"]*)"|'([^']*)'|([^\\r\\n]*))`, 'm'));
  return match ? (match[1] || match[2] || match[3] || '').trim() : '';
};

const supabaseUrl = getEnvVal('VITE_SUPABASE_URL');
const supabaseKey = getEnvVal('VITE_SUPABASE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: Não foi possível obter VITE_SUPABASE_URL ou VITE_SUPABASE_KEY de .env.production.");
  process.exit(1);
}

console.log("======================================================================");
console.log("🔌 CONECTANDO AO SUPABASE REAL...");
console.log(`URL: ${supabaseUrl}`);
console.log("======================================================================");

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const nowIso = new Date().toISOString().substring(0, 19);
  try {
    // 2. Buscar primeiro chamado ativo
    console.log("🔍 Buscando chamados no banco de dados...");
    const { data: tickets, error: fetchErr } = await supabase
      .from('chamados')
      .select('*')
      .order('id_chamado', { ascending: true })
      .limit(1);

    if (fetchErr) throw fetchErr;
    if (!tickets || tickets.length === 0) {
      console.log("⚠️ Nenhum chamado encontrado no banco de dados.");
      return;
    }

    const testTicket = tickets[0];
    const targetId = testTicket.id_chamado;
    const oldAptidao = testTicket.resultado_aptidao || 'Pendente';
    
    console.log(`\n📌 Chamado selecionado para teste: ${targetId}`);
    console.log(`   - Unidade Escolar: ${testTicket.unidade_escolar}`);
    console.log(`   - Aptidão Técnica Atual: '${oldAptidao}'`);

    // 3. Alternar aptidão para teste
    const newAptidao = oldAptidao === 'Não apta' ? 'Apta' : 'Não apta';
    console.log(`\n🚀 Realizando UPDATE de '${oldAptidao}' para '${newAptidao}' no Supabase...`);

    const { error: updateErr } = await supabase
      .from('chamados')
      .update({ resultado_aptidao: newAptidao })
      .eq('id_chamado', targetId);

    if (updateErr) throw updateErr;
    console.log("✅ Chamado atualizado no Supabase!");

    // 3b. Criar evento de histórico simulado (idêntico ao do App.jsx)
    const testEventId = `EV-TEST-${Date.now()}`;
    const testEvent = {
      id_evento: testEventId,
      data: nowIso,
      id_chamado: targetId,
      designacao: testTicket.designacao,
      unidade_escolar: testTicket.unidade_escolar,
      marco_relevante: 'Alteração de Aptidão técnica',
      setor: 'GOP',
      responsavel_registro: 'GOP / Sistema',
      observacao: `Aptidão técnica alterada de '${oldAptidao}' para '${newAptidao}' em ${nowIso.substring(0, 10).split('-').reverse().join('/')}.`
    };

    console.log(`\n📝 Inserindo log automático na Linha do Tempo (tabela historico)...`);
    console.log(`   Conteúdo: "${testEvent.observacao}"`);
    const { error: eventInsertErr } = await supabase
      .from('historico')
      .insert([testEvent]);

    if (eventInsertErr) throw eventInsertErr;
    console.log("✅ Log inserido com sucesso!");

    // 4. Buscar novamente do banco de dados (forçando leitura do servidor remoto)
    console.log("\n📡 Lendo dados atualizados diretamente do Supabase...");
    const { data: updatedTickets, error: verifyErr } = await supabase
      .from('chamados')
      .select('id_chamado, resultado_aptidao')
      .eq('id_chamado', targetId);

    if (verifyErr) throw verifyErr;
    
    const verifiedTicket = updatedTickets[0];
    console.log(`   - Novo valor no banco (chamados): '${verifiedTicket.resultado_aptidao}'`);

    // 4b. Verificar se o evento de histórico foi realmente gravado
    const { data: verifiedEvents, error: verifyEventErr } = await supabase
      .from('historico')
      .select('*')
      .eq('id_evento', testEventId);

    if (verifyEventErr) throw verifyEventErr;
    if (!verifiedEvents || verifiedEvents.length === 0) {
      throw new Error("O evento de histórico não foi encontrado no banco de dados.");
    }
    console.log(`   - Log gravado encontrado no banco (historico): "${verifiedEvents[0].observacao}"`);

    if (verifiedTicket.resultado_aptidao === newAptidao && verifiedEvents[0].id_evento === testEventId) {
      console.log("   🎉 CONFIRMADO: Edição e log automático persistidos com sucesso!");
    } else {
      throw new Error(`Valores incorretos retornados.`);
    }

    // === TESTE DE ANEXO REAL (SUPABASE STORAGE E METADADOS) ===
    console.log("\n📎 Iniciando teste real de Upload de Anexo...");
    const testFileContent = Buffer.from("conteudo de teste do anexo");
    const testFileName = `test-file-${Date.now()}.pdf`;
    const testStoragePath = `chamados/${targetId}/${testFileName}`;

    console.log(`   - Fazendo upload de arquivo para bucket 'gop-anexos' em path '${testStoragePath}'...`);
    const { error: uploadErr } = await supabase.storage
      .from('gop-anexos')
      .upload(testStoragePath, testFileContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadErr) {
      console.warn("⚠️ Falha ao fazer upload de anexo no bucket. Verifique se o bucket 'gop-anexos' existe e as permissões RLS.");
      throw uploadErr;
    }
    console.log("   ✅ Arquivo físico gravado no Supabase Storage!");

    console.log("   - Gravando registro lógico de metadados na tabela 'anexos_chamado'...");
    const testAttachmentRecord = {
      id_chamado: targetId,
      designacao: testTicket.designacao,
      unidade_escolar: testTicket.unidade_escolar,
      bucket: 'gop-anexos',
      storage_path: testStoragePath,
      nome_original: 'arquivo-teste-real.pdf',
      mime_type: 'application/pdf',
      tamanho_bytes: testFileContent.length,
      descricao: 'Anexo de teste real de persistência'
    };

    const { data: createdAttachment, error: metaErr } = await supabase
      .from('anexos_chamado')
      .insert(testAttachmentRecord)
      .select('*')
      .single();

    if (metaErr) {
      // Limpa do storage se falhar
      await supabase.storage.from('gop-anexos').remove([testStoragePath]);
      throw metaErr;
    }
    console.log(`   ✅ Metadados persistidos na tabela (ID: ${createdAttachment.id})!`);

    // Busca do banco
    console.log("   - Verificando listagem dos anexos para o chamado...");
    const { data: attachmentsList, error: listErr } = await supabase
      .from('anexos_chamado')
      .select('*')
      .eq('id_chamado', targetId);

    if (listErr) throw listErr;
    const found = attachmentsList.some(a => a.id === createdAttachment.id);
    if (!found) throw new Error("O anexo criado não foi retornado na listagem!");
    console.log("   ✅ Anexo localizado com sucesso na consulta remota!");

    // Deleta para limpar
    console.log("   - Removendo anexo físico do Storage...");
    const { error: removeFileErr } = await supabase.storage
      .from('gop-anexos')
      .remove([testStoragePath]);
    if (removeFileErr) throw removeFileErr;
    console.log("   ✅ Arquivo físico removido!");

    console.log("   - Removendo metadados da tabela...");
    const { error: removeMetaErr } = await supabase
      .from('anexos_chamado')
      .delete()
      .eq('id', createdAttachment.id);
    if (removeMetaErr) throw removeMetaErr;
    console.log("   ✅ Metadados removidos!");

    // 5. Reverter para o valor original para não poluir o banco e limpar o log
    console.log(`\n↩️ Revertendo a alteração do chamado para o valor original ('${oldAptidao}')...`);
    const { error: revertErr } = await supabase
      .from('chamados')
      .update({ resultado_aptidao: oldAptidao })
      .eq('id_chamado', targetId);

    if (revertErr) throw revertErr;
    console.log("✅ Reversão do chamado concluída!");

    console.log(`🧹 Removendo o log de teste da tabela historico...`);
    // Nota: Como não há política de UPDATE/DELETE exposta para anon no RLS da tabela historico por segurança contra adulteração, 
    // a remoção do log de teste pelo cliente público pode falhar. Vamos testar.
    const { error: deleteEventErr } = await supabase
      .from('historico')
      .delete()
      .eq('id_evento', testEventId);
    
    if (deleteEventErr) {
      console.log(`   (Nota: Deleção de log ignorada ou protegida por política de segurança RLS: ${deleteEventErr.message})`);
    } else {
      console.log("✅ Log de teste limpo com sucesso!");
    }

    // 6. Confirmação final da reversão
    const { data: revertedTickets } = await supabase
      .from('chamados')
      .select('resultado_aptidao')
      .eq('id_chamado', targetId);
    
    console.log(`   - Valor final do chamado no banco: '${revertedTickets[0].resultado_aptidao}'`);
    console.log("\n🎯 RESULTADO: Teste bem-sucedido! A edição do chamado e a geração do log automático são 100% persistentes e funcionais.");
    console.log("======================================================================\n");

  } catch (err) {
    console.error("\n❌ ERRO NO TESTE DE PERSISTÊNCIA:");
    console.error(err.message || err);
    console.log("======================================================================\n");
    process.exit(1);
  }
}

runTest();
