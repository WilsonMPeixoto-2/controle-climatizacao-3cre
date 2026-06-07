-- Migration: 20260607032700_cleanup_residual_insecure_policies.sql
-- Description: Remove residual insecure policies that allow public/anon role to delete tickets and modify schools/history.

-- 1. Tabela 'historico' - Remover política de update do anon
DROP POLICY IF EXISTS "Permitir atualização de historico" ON public.historico;

-- 2. Tabela 'escolas' - Remover políticas de insert e update do anon
DROP POLICY IF EXISTS "Permitir inserção de escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir atualização de escolas" ON public.escolas;

-- 3. Tabela 'chamados' - Remover política de delete do anon
DROP POLICY IF EXISTS "Permitir exclusão de chamados" ON public.chamados;
