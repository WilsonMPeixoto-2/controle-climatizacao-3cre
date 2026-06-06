-- Migration: db_hardening (Fase 1: Alinhamento estrutural e fallback local)
-- Preenchimento preventivo de valores nulos e aplicação de constraints NOT NULL e DEFAULTS.

-- 1. Auto-cura de dados com RAISE NOTICE para registro de contagens
DO $$
DECLARE
  v_updated_chamados INTEGER := 0;
  v_updated_historico INTEGER := 0;
  v_updated_modelos INTEGER := 0;
  v_updated_escolas INTEGER := 0;
  v_count INTEGER;
BEGIN
  -- Auto-cura chamados
  -- 1.1. data_solicitacao
  UPDATE public.chamados SET data_solicitacao = COALESCE(data_solicitacao, criado_em, NOW()) WHERE data_solicitacao IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.2. status_atual
  UPDATE public.chamados SET status_atual = COALESCE(status_atual, '1 - Recebido — em triagem') WHERE status_atual IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.3. prioridade
  UPDATE public.chamados SET prioridade = COALESCE(prioridade, 'Média') WHERE prioridade IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.4. unidade_escolar
  UPDATE public.chamados SET unidade_escolar = COALESCE(unidade_escolar, 'Sem Nome') WHERE unidade_escolar IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.5. criado_em
  UPDATE public.chamados SET criado_em = COALESCE(criado_em, NOW()) WHERE criado_em IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.6. local_demanda
  UPDATE public.chamados SET local_demanda = COALESCE(local_demanda, 'Não Especificado') WHERE local_demanda IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.7. modificado_em
  UPDATE public.chamados SET modificado_em = COALESCE(modificado_em, NOW()) WHERE modificado_em IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.8. setor_responsavel
  UPDATE public.chamados SET setor_responsavel = COALESCE(setor_responsavel, 'GOP') WHERE setor_responsavel IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  -- 1.9. tipo_demanda
  UPDATE public.chamados SET tipo_demanda = COALESCE(tipo_demanda, 'Instalação') WHERE tipo_demanda IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_chamados := v_updated_chamados + v_count;

  RAISE NOTICE 'Auto-cura chamados: % colunas/linhas atualizadas.', v_updated_chamados;

  -- Auto-cura historico
  -- 2.1. data
  UPDATE public.historico SET data = COALESCE(data, NOW()) WHERE data IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_historico := v_updated_historico + v_count;

  -- 2.2. setor
  UPDATE public.historico SET setor = COALESCE(setor, 'GOP') WHERE setor IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_historico := v_updated_historico + v_count;

  -- 2.3. marco_relevante
  UPDATE public.historico SET marco_relevante = COALESCE(marco_relevante, 'Registro de Histórico') WHERE marco_relevante IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_historico := v_updated_historico + v_count;

  -- 2.4. responsavel_registro
  UPDATE public.historico SET responsavel_registro = COALESCE(responsavel_registro, 'Sistema') WHERE responsavel_registro IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_historico := v_updated_historico + v_count;

  RAISE NOTICE 'Auto-cura historico: % colunas/linhas atualizadas.', v_updated_historico;

  -- Auto-cura modelos_email
  -- 3.1. tipo
  UPDATE public.modelos_email SET tipo = COALESCE(tipo, 'modelo') WHERE tipo IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_modelos := v_updated_modelos + v_count;

  -- 3.2. template
  UPDATE public.modelos_email SET template = COALESCE(template, '') WHERE template IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_modelos := v_updated_modelos + v_count;

  RAISE NOTICE 'Auto-cura modelos_email: % colunas/linhas atualizadas.', v_updated_modelos;

  -- Auto-cura escolas
  -- 4.1. unidade_escolar
  UPDATE public.escolas SET unidade_escolar = COALESCE(unidade_escolar, 'Unidade Escolar Sem Nome') WHERE unidade_escolar IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_escolas := v_updated_escolas + v_count;

  -- 4.2. Colunas numericas de escolas que receberao DEFAULTS
  UPDATE public.escolas SET aparelhos_total = COALESCE(aparelhos_total, 0) WHERE aparelhos_total IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_escolas := v_updated_escolas + v_count;

  UPDATE public.escolas SET aparelhos_em_sala = COALESCE(aparelhos_em_sala, 0) WHERE aparelhos_em_sala IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_escolas := v_updated_escolas + v_count;

  UPDATE public.escolas SET necessidade_aparelhos = COALESCE(necessidade_aparelhos, 0) WHERE necessidade_aparelhos IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_escolas := v_updated_escolas + v_count;

  UPDATE public.escolas SET qtd_salas_de_aula = COALESCE(qtd_salas_de_aula, 0) WHERE qtd_salas_de_aula IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_escolas := v_updated_escolas + v_count;

  UPDATE public.escolas SET salas_sem_aparelho = COALESCE(salas_sem_aparelho, 0) WHERE salas_sem_aparelho IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_updated_escolas := v_updated_escolas + v_count;

  RAISE NOTICE 'Auto-cura escolas: % colunas/linhas atualizadas.', v_updated_escolas;
END;
$$;

-- 2. Aplicar Restrições NOT NULL completas
ALTER TABLE public.chamados
  ALTER COLUMN data_solicitacao SET NOT NULL,
  ALTER COLUMN status_atual SET NOT NULL,
  ALTER COLUMN prioridade SET NOT NULL,
  ALTER COLUMN unidade_escolar SET NOT NULL,
  ALTER COLUMN criado_em SET NOT NULL,
  ALTER COLUMN local_demanda SET NOT NULL,
  ALTER COLUMN modificado_em SET NOT NULL,
  ALTER COLUMN setor_responsavel SET NOT NULL,
  ALTER COLUMN tipo_demanda SET NOT NULL;

ALTER TABLE public.historico
  ALTER COLUMN data SET NOT NULL,
  ALTER COLUMN setor SET NOT NULL,
  ALTER COLUMN marco_relevante SET NOT NULL,
  ALTER COLUMN responsavel_registro SET NOT NULL;

ALTER TABLE public.modelos_email
  ALTER COLUMN tipo SET NOT NULL,
  ALTER COLUMN template SET NOT NULL;

ALTER TABLE public.escolas
  ALTER COLUMN unidade_escolar SET NOT NULL;

-- 3. Aplicar Valores Padrão (DEFAULTS) Completos
ALTER TABLE public.chamados
  ALTER COLUMN criado_em SET DEFAULT now(),
  ALTER COLUMN modificado_em SET DEFAULT now(),
  ALTER COLUMN comunicacao_cto SET DEFAULT 'Não'::text;

ALTER TABLE public.escolas
  ALTER COLUMN aparelhos_total SET DEFAULT 0,
  ALTER COLUMN aparelhos_em_sala SET DEFAULT 0,
  ALTER COLUMN necessidade_aparelhos SET DEFAULT 0,
  ALTER COLUMN qtd_salas_de_aula SET DEFAULT 0,
  ALTER COLUMN salas_sem_aparelho SET DEFAULT 0;
