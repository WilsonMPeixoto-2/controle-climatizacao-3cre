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
  unidade_escolar         TEXT,
  sici                    TEXT,
  endereco                TEXT,
  bairro                  TEXT,
  confirmado_pela_unidade TEXT,
  validado_pela_gop       TEXT,
  qtd_salas_de_aula       INTEGER,
  aparelhos_em_sala       INTEGER,
  aparelhos_total         INTEGER,
  salas_sem_aparelho      INTEGER,
  necessidade_aparelhos   INTEGER,
  acao_sugerida           TEXT
);

-- ---------------------------------------------------------------------------
-- 2. Chamados (registro mestre — uma linha por demanda)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chamados (
  id_chamado          TEXT PRIMARY KEY,
  unidade_escolar     TEXT,
  designacao          TEXT REFERENCES escolas(designacao),
  data_solicitacao    TIMESTAMPTZ,
  local_demanda       TEXT,
  tipo_demanda        TEXT,
  status_atual        TEXT,
  setor_responsavel   TEXT,
  proxima_providencia TEXT,
  ultima_movimentacao TEXT,
  informacao_validada TEXT,
  prioridade          TEXT,
  comunicacao_cto     TEXT,
  observacoes         TEXT,
  resultado_aptidao   TEXT,
  criado_em           TIMESTAMPTZ,
  modificado_em       TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 3. Histórico (linha do tempo — marcos relevantes por chamado)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico (
  id_evento            TEXT PRIMARY KEY,
  data                 TIMESTAMPTZ,
  id_chamado           TEXT REFERENCES chamados(id_chamado),
  designacao           TEXT,
  unidade_escolar      TEXT,
  marco_relevante      TEXT,
  setor                TEXT,
  responsavel_registro TEXT,
  observacao           TEXT
);

-- ---------------------------------------------------------------------------
-- 4. Modelos de e-mail (textos por etapa do POP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modelos_email (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo     TEXT,
  etapa    TEXT,
  template TEXT
);

-- ---------------------------------------------------------------------------
-- Índices de apoio às consultas mais frequentes do app
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chamados_designacao ON chamados (designacao);
CREATE INDEX IF NOT EXISTS idx_chamados_status     ON chamados (status_atual);
CREATE INDEX IF NOT EXISTS idx_chamados_modificado ON chamados (modificado_em);
CREATE INDEX IF NOT EXISTS idx_historico_chamado   ON historico (id_chamado);
CREATE INDEX IF NOT EXISTS idx_historico_data      ON historico (data);

-- ---------------------------------------------------------------------------
-- 5. Anexos de Chamados (arquivos físicos e metadados no Supabase Storage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anexos_chamado (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_chamado     TEXT NOT NULL REFERENCES chamados(id_chamado) ON DELETE CASCADE,
  designacao     TEXT REFERENCES escolas(designacao) ON DELETE CASCADE,
  unidade_escolar TEXT,
  bucket         TEXT NOT NULL DEFAULT 'gop-anexos',
  storage_path   TEXT NOT NULL UNIQUE,
  nome_original  TEXT NOT NULL,
  mime_type      TEXT,
  tamanho_bytes  BIGINT,
  descricao      TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anexos_chamado_id_chamado ON anexos_chamado (id_chamado);
CREATE INDEX IF NOT EXISTS idx_anexos_chamado_designacao ON anexos_chamado (designacao);
