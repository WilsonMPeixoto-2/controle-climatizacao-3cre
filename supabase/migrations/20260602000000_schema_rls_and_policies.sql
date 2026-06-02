-- 20260602000000_schema_rls_and_policies.sql — Estrutura inicial do banco, RLS e políticas de segurança
-- Controle de Climatização — GOP / 3ª CRE — SME-RJ

-- ============================================================================
-- 1. Criação das Tabelas
-- ============================================================================

-- 1.1. Escolas (cadastro das 134 unidades da 3ª CRE)
CREATE TABLE IF NOT EXISTS escolas (
  designacao              TEXT PRIMARY KEY,
  unidade_escolar         TEXT NOT NULL,
  sici                    TEXT,
  endereco                TEXT,
  bairro                  TEXT,
  confirmado_pela_unidade TEXT,
  validado_pela_gop       TEXT,
  qtd_salas_de_aula       INTEGER DEFAULT 0,
  aparelhos_em_sala       INTEGER DEFAULT 0,
  aparelhos_total         INTEGER DEFAULT 0,
  salas_sem_aparelho      INTEGER DEFAULT 0,
  necessidade_aparelhos   INTEGER DEFAULT 0,
  acao_sugerida           TEXT
);

-- 1.2. Chamados (registro mestre de chamados de climatização)
CREATE TABLE IF NOT EXISTS chamados (
  id_chamado          TEXT PRIMARY KEY,
  unidade_escolar     TEXT NOT NULL,
  designacao          TEXT REFERENCES escolas(designacao) ON DELETE RESTRICT,
  data_solicitacao    TIMESTAMPTZ NOT NULL,
  local_demanda       TEXT NOT NULL,
  tipo_demanda        TEXT NOT NULL,
  status_atual        TEXT NOT NULL,
  setor_responsavel   TEXT NOT NULL,
  proxima_providencia TEXT,
  ultima_movimentacao TEXT,
  informacao_validada TEXT,
  prioridade          TEXT NOT NULL,
  comunicacao_cto     TEXT DEFAULT 'Não',
  observacoes         TEXT,
  resultado_aptidao   TEXT,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modificado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3. Histórico (linha do tempo e logs de auditoria por chamado)
CREATE TABLE IF NOT EXISTS historico (
  id_evento            TEXT PRIMARY KEY,
  data                 TIMESTAMPTZ NOT NULL,
  id_chamado           TEXT REFERENCES chamados(id_chamado) ON DELETE CASCADE,
  designacao           TEXT,
  unidade_escolar      TEXT,
  marco_relevante      TEXT NOT NULL,
  setor                TEXT NOT NULL,
  responsavel_registro TEXT NOT NULL,
  observacao           TEXT
);

-- 1.4. Modelos de e-mail (textos padrões do POP)
CREATE TABLE IF NOT EXISTS modelos_email (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo     TEXT NOT NULL,
  etapa    TEXT,
  template TEXT NOT NULL
);

-- 1.5. Anexos de Chamados (metadados de arquivos no Supabase Storage)
CREATE TABLE IF NOT EXISTS anexos_chamado (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_chamado      TEXT NOT NULL REFERENCES chamados(id_chamado) ON DELETE CASCADE,
  designacao      TEXT REFERENCES escolas(designacao) ON DELETE CASCADE,
  unidade_escolar TEXT,
  bucket          TEXT NOT NULL DEFAULT 'gop-anexos',
  storage_path    TEXT NOT NULL UNIQUE,
  nome_original   TEXT NOT NULL,
  mime_type       TEXT,
  tamanho_bytes   BIGINT,
  descricao       TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Índices de Apoio (Performance)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chamados_designacao ON chamados (designacao);
CREATE INDEX IF NOT EXISTS idx_chamados_status     ON chamados (status_atual);
CREATE INDEX IF NOT EXISTS idx_chamados_modificado ON chamados (modificado_em);
CREATE INDEX IF NOT EXISTS idx_historico_chamado   ON historico (id_chamado);
CREATE INDEX IF NOT EXISTS idx_historico_data      ON historico (data);
CREATE INDEX IF NOT EXISTS idx_anexos_chamado_id_chamado ON anexos_chamado (id_chamado);
CREATE INDEX IF NOT EXISTS idx_anexos_chamado_designacao ON anexos_chamado (designacao);

-- ============================================================================
-- 3. Ativação do Row Level Security (RLS) (Resolução A2)
-- ============================================================================
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos_chamado ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Criação das Políticas de Acesso RLS
-- ============================================================================

-- 4.1. Tabela 'escolas' (Apenas leitura pública)
DROP POLICY IF EXISTS "Permitir leitura pública de escolas" ON escolas;
CREATE POLICY "Permitir leitura pública de escolas" ON escolas 
  FOR SELECT TO anon, authenticated USING (true);

-- 4.2. Tabela 'modelos_email' (Apenas leitura pública)
DROP POLICY IF EXISTS "Permitir leitura pública de modelos_email" ON modelos_email;
CREATE POLICY "Permitir leitura pública de modelos_email" ON modelos_email 
  FOR SELECT TO anon, authenticated USING (true);

-- 4.3. Tabela 'chamados' (Leitura, inserção e atualização públicas; deleção proibida)
DROP POLICY IF EXISTS "Permitir leitura pública de chamados" ON chamados;
CREATE POLICY "Permitir leitura pública de chamados" ON chamados 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir inserção de chamados" ON chamados;
CREATE POLICY "Permitir inserção de chamados" ON chamados 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de chamados" ON chamados;
CREATE POLICY "Permitir atualização de chamados" ON chamados 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4.4. Tabela 'historico' (Leitura e inserção públicas; alteração/deleção proibida para auditoria)
DROP POLICY IF EXISTS "Permitir leitura pública de historico" ON historico;
CREATE POLICY "Permitir leitura pública de historico" ON historico 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir inserção de historico" ON historico;
CREATE POLICY "Permitir inserção de historico" ON historico 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4.5. Tabela 'anexos_chamado' (Leitura, inserção e exclusão públicas)
DROP POLICY IF EXISTS "Permitir leitura pública de anexos_chamado" ON anexos_chamado;
CREATE POLICY "Permitir leitura pública de anexos_chamado" ON anexos_chamado 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir inserção de anexos_chamado" ON anexos_chamado;
CREATE POLICY "Permitir inserção de anexos_chamado" ON anexos_chamado 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de anexos_chamado" ON anexos_chamado;
CREATE POLICY "Permitir exclusão de anexos_chamado" ON anexos_chamado 
  FOR DELETE TO anon, authenticated USING (true);

-- ============================================================================
-- 5. Segurança do Supabase Storage (Resolução A3)
-- ============================================================================

-- Garantir que o bucket físico de anexos existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('gop-anexos', 'gop-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- 5.1. Permitir que anon/authenticated façam download/SELECT público de arquivos em 'gop-anexos'
DROP POLICY IF EXISTS "Permitir leitura pública de anexos em gop-anexos" ON storage.objects;
CREATE POLICY "Permitir leitura pública de anexos em gop-anexos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

-- 5.2. Permitir que anon/authenticated façam upload/INSERT sob a subpasta 'chamados/'
DROP POLICY IF EXISTS "Permitir upload de anexos no subdiretorio chamados em gop-anexos" ON storage.objects;
CREATE POLICY "Permitir upload de anexos no subdiretorio chamados em gop-anexos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

-- 5.3. Permitir que anon/authenticated excluam/DELETE arquivos sob a subpasta 'chamados/'
DROP POLICY IF EXISTS "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos" ON storage.objects;
CREATE POLICY "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');
