-- Migration: security_definer_grants
-- Criada em: 2026-06-11
-- Objetivo: Restringir a execução de todas as funções SECURITY DEFINER, revogando o privilégio público padrão (PUBLIC)
-- e concedendo acesso explícito às roles anon, authenticated e service_role, mantendo a compatibilidade com a premissa de app público/anônimo.

-- 1. generate_next_id_chamado()
REVOKE EXECUTE ON FUNCTION public.generate_next_id_chamado() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_next_id_chamado() TO anon, authenticated, service_role;

-- 2. diagnostico_operacional()
REVOKE EXECUTE ON FUNCTION public.diagnostico_operacional() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.diagnostico_operacional() TO anon, authenticated, service_role;

-- 3. save_ticket_with_history(JSONB, JSONB[])
REVOKE EXECUTE ON FUNCTION public.save_ticket_with_history(JSONB, JSONB[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_ticket_with_history(JSONB, JSONB[]) TO anon, authenticated, service_role;

-- 4. create_ticket_with_history(JSONB, JSONB)
REVOKE EXECUTE ON FUNCTION public.create_ticket_with_history(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ticket_with_history(JSONB, JSONB) TO anon, authenticated, service_role;

-- 5. create_attachment_with_history(JSONB, JSONB)
REVOKE EXECUTE ON FUNCTION public.create_attachment_with_history(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_attachment_with_history(JSONB, JSONB) TO anon, authenticated, service_role;

-- 6. delete_attachment_with_history(BIGINT, JSONB)
REVOKE EXECUTE ON FUNCTION public.delete_attachment_with_history(BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_attachment_with_history(BIGINT, JSONB) TO anon, authenticated, service_role;
