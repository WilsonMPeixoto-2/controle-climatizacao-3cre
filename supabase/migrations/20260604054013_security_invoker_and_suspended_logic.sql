-- Migração: Saneamento de Segurança e Lógica de Chamados Suspensos
-- Criada em: 2026-06-04
-- Objetivo: Recriar views com security_invoker = true, fixar search_path em diagnostico_operacional() e alinhar lógica de chamados suspensos.

-- 1. Saneamento e atualização da função de diagnóstico operacional
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
  WHERE c.id_chamado IS NULL;

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


-- 2. Recriação das Views com Security Invoker e Alinhamento de Suspensos
DROP VIEW IF EXISTS public.vw_integridade_operacional;
DROP VIEW IF EXISTS public.vw_chamados_sem_movimentacao;
DROP VIEW IF EXISTS public.vw_chamados_sem_anexo;
DROP VIEW IF EXISTS public.vw_escolas_resumo_climatizacao;
DROP VIEW IF EXISTS public.vw_chamados_ativos;
DROP VIEW IF EXISTS public.vw_chamados_por_bairro;
DROP VIEW IF EXISTS public.vw_chamados_por_status;

CREATE OR REPLACE VIEW public.vw_chamados_por_status 
WITH (security_invoker = true) AS
SELECT status_atual, COUNT(*) AS total
FROM public.chamados
GROUP BY status_atual;

CREATE OR REPLACE VIEW public.vw_chamados_por_bairro 
WITH (security_invoker = true) AS
SELECT e.bairro, 
       COUNT(*) AS total_chamados, 
       COUNT(CASE WHEN c.status_atual NOT IN ('10 - Concluído', '11 - Encerrado', 'Suspenso / pendente') THEN 1 END) AS chamados_ativos
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
    WHEN qtd_salas_de_aula > 0 THEN ROUND((aparelhos_em_sala::numeric / qtd_salas_de_aula::numeric) * 100, 2)
    ELSE 0
  END AS percentual_climatizacao
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
FROM public.historico h LEFT JOIN public.chamados c ON h.id_chamado = c.id_chamado WHERE c.id_chamado IS NULL
UNION ALL
SELECT 'anexo_sem_chamado' AS tipo_inconsistencia, a.id::text AS ref_id, a.nome_original AS detalhe
FROM public.anexos_chamado a LEFT JOIN public.chamados c ON a.id_chamado = c.id_chamado WHERE c.id_chamado IS NULL
UNION ALL
SELECT 'escola_salas_negativas' AS tipo_inconsistencia, designacao AS ref_id, unidade_escolar AS detalhe
FROM public.escolas WHERE qtd_salas_de_aula < 0 OR aparelhos_em_sala < 0 OR aparelhos_total < 0
UNION ALL
SELECT 'chamado_prioridade_invalida' AS tipo_inconsistencia, id_chamado AS ref_id, prioridade AS detalhe
FROM public.chamados WHERE prioridade NOT IN ('Baixa', 'Média', 'Alta', 'Crítica');
