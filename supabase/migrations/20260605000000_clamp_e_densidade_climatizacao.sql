-- 20260605000000_clamp_e_densidade_climatizacao.sql
-- Ajusta a view de resumo de climatização para evitar percentual acima de 100%
-- e preservar a informação técnica de densidade de aparelhos por sala.

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
