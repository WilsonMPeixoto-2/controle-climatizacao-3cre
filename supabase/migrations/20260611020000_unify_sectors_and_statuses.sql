-- Migration: unify_sectors_and_statuses (Fase 4 - PR 4.2)
-- Saneamento pontual de dados históricos incoerentes na tabela chamados.
-- Unifica a taxonomia do setor responsável 'Unidade Escolar / GIN' para 'GIN / Unidade Escolar'.

UPDATE public.chamados
SET setor_responsavel = 'GIN / Unidade Escolar'
WHERE setor_responsavel = 'Unidade Escolar / GIN';
