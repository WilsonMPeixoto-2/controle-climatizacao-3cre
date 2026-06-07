-- Migration: 20260606223400_security_hardening.sql
-- Descrição: Enrijecimento de segurança via RLS para usuários autenticados, restrição de funções SECURITY DEFINER e seeding do administrador padrão.

-- Habilitar pgcrypto se não estiver ativo
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- ============================================================================
-- 1. Restrição de RLS nas Tabelas (Apenas Usuários Autenticados)
-- ============================================================================

-- 1.1. Tabela 'escolas'
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de escolas" ON public.escolas;
CREATE POLICY "Permitir leitura de escolas para autenticados" ON public.escolas 
  FOR SELECT TO authenticated USING (true);

-- 1.2. Tabela 'modelos_email'
ALTER TABLE public.modelos_email ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de modelos_email" ON public.modelos_email;
CREATE POLICY "Permitir leitura de modelos_email para autenticados" ON public.modelos_email 
  FOR SELECT TO authenticated USING (true);

-- 1.3. Tabela 'chamados'
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de chamados" ON public.chamados;
DROP POLICY IF EXISTS "Permitir inserção de chamados" ON public.chamados;
DROP POLICY IF EXISTS "Permitir atualização de chamados" ON public.chamados;

CREATE POLICY "Permitir leitura de chamados para autenticados" ON public.chamados 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de chamados por autenticados" ON public.chamados 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de chamados por autenticados" ON public.chamados 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 1.4. Tabela 'historico'
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de historico" ON public.historico;
DROP POLICY IF EXISTS "Permitir inserção de historico" ON public.historico;

CREATE POLICY "Permitir leitura de historico para autenticados" ON public.historico 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de historico por autenticados" ON public.historico 
  FOR INSERT TO authenticated WITH CHECK (true);

-- 1.5. Tabela 'anexos_chamado'
ALTER TABLE public.anexos_chamado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de anexos_chamado" ON public.anexos_chamado;
DROP POLICY IF EXISTS "Permitir inserção de anexos_chamado" ON public.anexos_chamado;
DROP POLICY IF EXISTS "Permitir exclusão de anexos_chamado" ON public.anexos_chamado;

CREATE POLICY "Permitir leitura de anexos_chamado para autenticados" ON public.anexos_chamado 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de anexos_chamado por autenticados" ON public.anexos_chamado 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir exclusão de anexos_chamado por autenticados" ON public.anexos_chamado 
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 2. Segurança do Supabase Storage (Bucket 'gop-anexos')
-- ============================================================================
DROP POLICY IF EXISTS "Permitir leitura pública de anexos em gop-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de anexos no subdiretorio chamados em gop-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos" ON storage.objects;

CREATE POLICY "Permitir leitura de anexos em gop-anexos para autenticados" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

CREATE POLICY "Permitir upload de anexos no subdiretorio chamados em gop-anexos para autenticados" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

CREATE POLICY "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos para autenticados" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

-- ============================================================================
-- 3. Governança e Restrição de Funções SECURITY DEFINER
-- ============================================================================

-- 3.1. Restrição de generate_next_id_chamado (apenas trigger interna)
REVOKE EXECUTE ON FUNCTION public.generate_next_id_chamado() FROM PUBLIC, anon, authenticated;

-- 3.2. Restrição de save_ticket_with_history (apenas usuários autenticados)
REVOKE EXECUTE ON FUNCTION public.save_ticket_with_history(JSONB, JSONB[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_ticket_with_history(JSONB, JSONB[]) TO authenticated;

-- ============================================================================
-- 4. Criação do Usuário Administrador Padrão (Supabase Auth)
-- ============================================================================
DO $$
DECLARE
  new_uid UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gop3cre.gov.br') THEN
    -- Inserir o registro de login do usuário administrador na tabela do Supabase Auth
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      new_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@gop3cre.gov.br',
      -- Criptografa a senha padrão 'gop-clima-admin' usando blowfish
      extensions.crypt('gop-clima-admin', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      'authenticated',
      'authenticated'
    );

    -- Inserir na tabela de identidades correspondente com o id como UUID
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      new_uid,
      new_uid,
      jsonb_build_object('sub', new_uid, 'email', 'admin@gop3cre.gov.br'),
      'email',
      new_uid::text,
      now(),
      now(),
      now()
    );
  END IF;
END $$;
