-- schema.sql — Estrutura do banco de dados (Supabase / PostgreSQL)
-- Controle de Climatização — GOP / 3ª CRE — SME-RJ
--
-- ATENÇÃO — NÃO EXECUTAR INTEGRALMENTE EM PRODUÇÃO
--
-- Este arquivo é uma referência histórica/consolidada da estrutura do banco.
-- Ele NÃO deve ser copiado e executado integralmente no Supabase ativo sem revisão técnica.
--
-- O arquivo contém comandos de RLS, CREATE POLICY e permissões públicas antigas,
-- incluindo policies de DELETE para a role anon em tabelas e objetos de Storage.
-- Essas permissões NÃO estão aprovadas para reaplicação automática.
--
-- Qualquer alteração real no banco de produção deve ser feita exclusivamente por
-- migrations incrementais, revisadas, com escopo delimitado e aprovação manual.
--
-- Em especial, não reativar RLS, não criar policies e não conceder DELETE público
-- para anon a partir deste arquivo.

-- ---------------------------------------------------------------------------
-- 0. Extensões PostgreSQL
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS http;

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

-- 6.2. Políticas de Escrita, Atualização e Sincronização (GOP / Técnicos)
CREATE POLICY "Permitir inserção de chamados" ON chamados FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de chamados" ON chamados FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusão de chamados" ON chamados FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Permitir inserção de historico" ON historico FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de historico" ON historico FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir inserção de escolas" ON escolas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de escolas" ON escolas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

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

-- ---------------------------------------------------------------------------
-- 9. Função de Diagnóstico Operacional Rápido
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.diagnostico_operacional()
RETURNS TABLE (
  total_escolas bigint,
  total_chamados bigint,
  total_anexos bigint,
  chamados_sem_escola bigint,
  historico_sem_chamado bigint,
  anexos_sem_chamado bigint,
  status_invalidos bigint,
  prioridades_invalidas bigint,
  orfaos_totais bigint
) AS $$
DECLARE
  v_total_escolas bigint;
  v_total_chamados bigint;
  v_total_anexos bigint;
  v_chamados_sem_escola bigint;
  v_historico_sem_chamado bigint;
  v_anexos_sem_chamado bigint;
  v_status_invalidos bigint;
  v_prioridades_invalidas bigint;
  v_orfaos_totais bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_escolas FROM public.escolas;
  SELECT COUNT(*) INTO v_total_chamados FROM public.chamados;
  SELECT COUNT(*) INTO v_total_anexos FROM public.anexos_chamado;

  SELECT COUNT(*) INTO v_chamados_sem_escola 
  FROM public.chamados c LEFT JOIN public.escolas e ON c.designacao = e.designacao 
  WHERE e.designacao IS NULL;

  SELECT COUNT(*) INTO v_historico_sem_chamado 
  FROM public.historico h LEFT JOIN public.chamados c ON h.id_chamado = c.id_chamado 
  WHERE c.id_chamado IS NULL AND h.designacao IS NULL;

  SELECT COUNT(*) INTO v_anexos_sem_chamado 
  FROM public.anexos_chamado a LEFT JOIN public.chamados c ON a.id_chamado = c.id_chamado 
  WHERE c.id_chamado IS NULL;

  SELECT COUNT(*) INTO v_status_invalidos 
  FROM public.chamados 
  WHERE status_atual NOT IN (
    '1 - Recebido — em triagem',
    '2 - Em vistoria técnica',
    '3 - Vistoria concluída — pendente laudo',
    '4 - Aguardando orçamento',
    '5 - Orçamento em análise/decisão',
    '6 - Aguardando adequação elétrica',
    '7 - Adequação em execução',
    '8 - Adequação concluída',
    '9 - Aguardando aparelho/instalação',
    '10 - Concluído',
    '11 - Encerrado',
    'Suspenso / pendente'
  );

  SELECT COUNT(*) INTO v_prioridades_invalidas 
  FROM public.chamados 
  WHERE prioridade NOT IN ('Baixa', 'Média', 'Alta', 'Crítica');

  v_orfaos_totais := v_chamados_sem_escola + v_historico_sem_chamado + v_anexos_sem_chamado;

  RETURN QUERY SELECT 
    v_total_escolas,
    v_total_chamados,
    v_total_anexos,
    v_chamados_sem_escola,
    v_historico_sem_chamado,
    v_anexos_sem_chamado,
    v_status_invalidos,
    v_prioridades_invalidas,
    v_orfaos_totais;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 10. Views Gerenciais de Apoio
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_chamados_por_status 
WITH (security_invoker = true) AS
SELECT status_atual, COUNT(*) AS total
FROM public.chamados
GROUP BY status_atual;

CREATE OR REPLACE VIEW public.vw_chamados_por_bairro 
WITH (security_invoker = true) AS
SELECT e.bairro, COUNT(*) AS total_chamados, COUNT(CASE WHEN c.status_atual NOT IN ('10 - Concluído', '11 - Encerrado', 'Suspenso / pendente') THEN 1 END) AS chamados_ativos
FROM public.chamados c
JOIN public.escolas e ON c.designacao = e.designacao
GROUP BY e.bairro;

CREATE OR REPLACE VIEW public.vw_chamados_ativos 
WITH (security_invoker = true) AS
SELECT * 
FROM public.chamados
WHERE status_atual NOT IN ('10 - Concluído', '11 - Encerrado', 'Suspenso / pendente');

CREATE OR REPLACE VIEW public.vw_escolas_resumo_climatizacao 
WITH (security_invoker = true) AS
SELECT 
  designacao,
  unidade_escolar,
  bairro,
  qtd_salas_de_aula,
  aparelhos_em_sala,
  aparelhos_total,
  salas_sem_aparelho,
  necessidade_aparelhos,
  CASE 
    WHEN qtd_salas_de_aula > 0 THEN LEAST(100::numeric, ROUND((aparelhos_em_sala::numeric / qtd_salas_de_aula::numeric) * 100, 2))
    ELSE 0::numeric
  END AS percentual_climatizacao,
  CASE 
    WHEN qtd_salas_de_aula > 0 THEN ROUND((aparelhos_em_sala::numeric / qtd_salas_de_aula::numeric), 2)
    ELSE 0::numeric
  END AS densidade_aparelhos_sala
FROM public.escolas;


CREATE OR REPLACE VIEW public.vw_chamados_sem_anexo 
WITH (security_invoker = true) AS
SELECT c.id_chamado, c.unidade_escolar, c.status_atual, c.prioridade
FROM public.chamados c
LEFT JOIN public.anexos_chamado a ON c.id_chamado = a.id_chamado
WHERE a.id IS NULL AND c.status_atual NOT IN ('10 - Concluído', '11 - Encerrado', 'Suspenso / pendente');

CREATE OR REPLACE VIEW public.vw_chamados_sem_movimentacao 
WITH (security_invoker = true) AS
SELECT id_chamado, unidade_escolar, status_atual, modificado_em,
       EXTRACT(DAY FROM NOW() - modificado_em)::integer AS dias_sem_movimentacao
FROM public.chamados
WHERE status_atual NOT IN ('10 - Concluído', '11 - Encerrado', 'Suspenso / pendente');

CREATE OR REPLACE VIEW public.vw_integridade_operacional 
WITH (security_invoker = true) AS
SELECT 'chamado_sem_escola' AS tipo_inconsistencia, c.id_chamado AS ref_id, c.unidade_escolar AS detalhe
FROM public.chamados c LEFT JOIN public.escolas e ON c.designacao = e.designacao WHERE e.designacao IS NULL
UNION ALL
SELECT 'historico_sem_chamado' AS tipo_inconsistencia, h.id_evento AS ref_id, h.observacao AS detalhe
FROM public.historico h LEFT JOIN public.chamados c ON h.id_chamado = c.id_chamado WHERE c.id_chamado IS NULL AND h.designacao IS NULL
UNION ALL
SELECT 'anexo_sem_chamado' AS tipo_inconsistencia, a.id::text AS ref_id, a.nome_original AS detalhe
FROM public.anexos_chamado a LEFT JOIN public.chamados c ON a.id_chamado = c.id_chamado WHERE c.id_chamado IS NULL
UNION ALL
SELECT 'escola_salas_negativas' AS tipo_inconsistencia, designacao AS ref_id, unidade_escolar AS detalhe
FROM public.escolas WHERE qtd_salas_de_aula < 0 OR aparelhos_em_sala < 0 OR aparelhos_total < 0
UNION ALL
SELECT 'chamado_prioridade_invalida' AS tipo_inconsistencia, id_chamado AS ref_id, prioridade AS detalhe
FROM public.chamados WHERE prioridade NOT IN ('Baixa', 'Média', 'Alta', 'Crítica');
