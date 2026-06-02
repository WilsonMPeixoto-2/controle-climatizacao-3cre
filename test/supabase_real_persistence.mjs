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

    const { data: updateResult, error: updateErr } = await supabase
      .from('chamados')
      .update({ resultado_aptidao: newAptidao })
      .eq('id_chamado', targetId)
      .select('*');

    if (updateErr) throw updateErr;

    console.log("✅ Update enviado com sucesso!");

    // 4. Buscar novamente do banco de dados (forçando leitura do servidor remoto)
    console.log("\n📡 Lendo dados atualizados diretamente do Supabase...");
    const { data: updatedTickets, error: verifyErr } = await supabase
      .from('chamados')
      .select('id_chamado, resultado_aptidao')
      .eq('id_chamado', targetId);

    if (verifyErr) throw verifyErr;
    
    const verifiedTicket = updatedTickets[0];
    console.log(`   - Novo valor no banco: '${verifiedTicket.resultado_aptidao}'`);

    if (verifiedTicket.resultado_aptidao === newAptidao) {
      console.log("   🎉 CONFIRMADO: Edição persistida com sucesso e atualizada de verdade!");
    } else {
      throw new Error(`O valor retornado '${verifiedTicket.resultado_aptidao}' não bate com o esperado '${newAptidao}'`);
    }

    // 5. Reverter para o valor original para não poluir o banco
    console.log(`\n↩️ Revertendo a alteração para o valor original ('${oldAptidao}')...`);
    const { error: revertErr } = await supabase
      .from('chamados')
      .update({ resultado_aptidao: oldAptidao })
      .eq('id_chamado', targetId);

    if (revertErr) throw revertErr;
    console.log("✅ Reversão concluída com sucesso!");

    // 6. Confirmação final da reversão
    const { data: revertedTickets } = await supabase
      .from('chamados')
      .select('resultado_aptidao')
      .eq('id_chamado', targetId);
    
    console.log(`   - Valor final no banco: '${revertedTickets[0].resultado_aptidao}'`);
    console.log("\n🎯 RESULTADO: Teste bem-sucedido! A edição é 100% persistente e funcional.");
    console.log("======================================================================\n");

  } catch (err) {
    console.error("\n❌ ERRO NO TESTE DE PERSISTÊNCIA:");
    console.error(err.message || err);
    console.log("======================================================================\n");
    process.exit(1);
  }
}

runTest();
