-- schema.sql — Estrutura do banco de dados (Supabase / PostgreSQL)
-- Controle de Climatização — GOP / 3ª CRE — SME-RJ
--
-- Como usar: abra o painel do Supabase → SQL Editor → New Query →
-- cole este arquivo inteiro → Run. Depois execute o seed.sql para a carga inicial.
--
-- Idempotente: CREATE TABLE IF NOT EXISTS pode ser reexecutado sem erro.

-- ---------------------------------------------------------------------------
-- 1. Escolas (cadastro vivo das 134 unidades da 3ª CRE) — tabela de referência
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. Chamados (registro mestre — uma linha por demanda)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chamados (
  id_chamado          TEXT PRIMARY KEY,
  unidade_escolar     TEXT NOT NULL,
  designacao          TEXT REFERENCES escolas(designacao) ON DELETE RESTRICT,
  data_solicitacao    TIMESTAMPTZ NOT NULL,
  local_demanda       TEXT NOT NULL,
  tipo_demanda        TEXT NOT NULL,
  tipo_aparelho       TEXT DEFAULT 'Split',
  btu_existente       TEXT,
  btu_pretendido      TEXT,
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

-- ---------------------------------------------------------------------------
-- 3. Histórico (linha do tempo — marcos relevantes por chamado)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. Modelos de e-mail (textos por etapa do POP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modelos_email (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo     TEXT NOT NULL,
  etapa    TEXT,
  template TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 5. Anexos de Chamados (arquivos físicos e metadados no Supabase Storage)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Índices de apoio às consultas mais frequentes do app
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chamados_designacao ON chamados (designacao);
CREATE INDEX IF NOT EXISTS idx_chamados_status     ON chamados (status_atual);
CREATE INDEX IF NOT EXISTS idx_chamados_modificado ON chamados (modificado_em);
CREATE INDEX IF NOT EXISTS idx_historico_chamado   ON historico (id_chamado);
CREATE INDEX IF NOT EXISTS idx_historico_data      ON historico (data);
CREATE INDEX IF NOT EXISTS idx_anexos_chamado_id_chamado ON anexos_chamado (id_chamado);
CREATE INDEX IF NOT EXISTS idx_anexos_chamado_designacao ON anexos_chamado (designacao);

-- ---------------------------------------------------------------------------
-- 6. Ativação do Row Level Security (RLS) e Políticas de Segurança
-- ---------------------------------------------------------------------------
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos_chamado ENABLE ROW LEVEL SECURITY;

-- 6.1. Políticas de Leitura Pública
CREATE POLICY "Permitir leitura pública de escolas" ON escolas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura pública de modelos_email" ON modelos_email FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura pública de chamados" ON chamados FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura pública de historico" ON historico FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura pública de anexos_chamado" ON anexos_chamado FOR SELECT TO anon, authenticated USING (true);

-- 6.2. Políticas de Escrita de Chamados e Histórico (GOP / Técnicos)
CREATE POLICY "Permitir inserção de chamados" ON chamados FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de chamados" ON chamados FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir inserção de historico" ON historico FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 6.3. Políticas de Anexos (Associação e Upload)
CREATE POLICY "Permitir inserção de anexos_chamado" ON anexos_chamado FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir exclusão de anexos_chamado" ON anexos_chamado FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 7. Segurança de Armazenamento do Supabase Storage (gop-anexos)
-- ---------------------------------------------------------------------------
-- Garante a criação do bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gop-anexos', 'gop-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas na tabela 'storage.objects'
CREATE POLICY "Permitir leitura pública de anexos em gop-anexos" 
ON storage.objects FOR SELECT TO anon, authenticated 
USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

CREATE POLICY "Permitir upload de anexos no subdiretorio chamados em gop-anexos" 
ON storage.objects FOR INSERT TO anon, authenticated 
WITH CHECK (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

CREATE POLICY "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos" 
ON storage.objects FOR DELETE TO anon, authenticated 
USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

-- ---------------------------------------------------------------------------
-- 8. Sequência e Trigger para Geração Resiliente de IDs de Chamados
-- ---------------------------------------------------------------------------
-- Criação da Sequence para auto-incremento (começa em 29, pois 1 a 28 já existem no seed)
CREATE SEQUENCE IF NOT EXISTS seq_id_chamado START WITH 29;

-- Função PL/pgSQL para gerar o ID formatado como GOP-AR-2026-XXXX
CREATE OR REPLACE FUNCTION public.generate_next_id_chamado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_chamado IS NULL OR NEW.id_chamado = '' THEN
    NEW.id_chamado := 'GOP-AR-2026-' || LPAD(nextval('seq_id_chamado')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Criação da Trigger BEFORE INSERT na tabela 'chamados'
DROP TRIGGER IF EXISTS trg_generate_id_chamado ON chamados;
CREATE TRIGGER trg_generate_id_chamado
BEFORE INSERT ON chamados
FOR EACH ROW
EXECUTE FUNCTION public.generate_next_id_chamado();
