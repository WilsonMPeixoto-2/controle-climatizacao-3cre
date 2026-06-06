import fs from 'node:fs';
import path from 'node:path';

// Carregar variáveis do .env e .env.local
const env = {};
const loadEnvFile = (filename) => {
  const envPath = path.resolve(filename);
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value.trim();
      }
    });
  } catch {
    // O arquivo pode não existir, o que é esperado se as variáveis vierem do ambiente
  }
};

loadEnvFile('.env');
loadEnvFile('.env.local');

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_KEY não configurados em .env ou .env.local');
  process.exit(1);
}

const headers = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json'
};

async function fetchData(table, orderField) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*&order=${orderField}.asc`;
  console.log(`Buscando dados da tabela ${table}...`);
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados da tabela ${table}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function sync() {
  try {
    const escolas = await fetchData('escolas', 'designacao');
    const chamados = await fetchData('chamados', 'id_chamado');
    const historico = await fetchData('historico', 'id_evento');
    const modelos_email = await fetchData('modelos_email', 'id');
    const anexos_chamado = await fetchData('anexos_chamado', 'id');

    const db = {
      escolas,
      chamados,
      historico,
      modelos_email,
      anexos_chamado
    };

    const dbPath = path.resolve('src/data/db.json');
    
    // Garantir diretório existente
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log(`\nSincronização concluída com sucesso! Salvo em: ${dbPath}`);
    console.log(`- Escolas: ${escolas.length}`);
    console.log(`- Chamados: ${chamados.length}`);
    console.log(`- Histórico: ${historico.length}`);
    console.log(`- Modelos de e-mail: ${modelos_email.length}`);
    console.log(`- Anexos: ${anexos_chamado.length}`);
  } catch (error) {
    console.error('Falha na sincronização:', error);
    process.exit(1);
  }
}

sync();
