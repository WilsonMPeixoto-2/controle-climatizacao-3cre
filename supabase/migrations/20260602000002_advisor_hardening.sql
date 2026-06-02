-- 20260602000002_advisor_hardening.sql — Hardening de segurança e performance (Achados do Advisor)
-- Controle de Climatização — GOP / 3ª CRE — SME-RJ

-- ============================================================================
-- 1. Limpeza de Políticas de Storage Obsoletas
-- ============================================================================
DROP POLICY IF EXISTS "gop_anexos_select" ON storage.objects;
DROP POLICY IF EXISTS "gop_anexos_insert" ON storage.objects;
DROP POLICY IF EXISTS "gop_anexos_delete" ON storage.objects;

-- ============================================================================
-- 2. Restrição de SELECT no bucket 'gop-anexos' estritamente para a subpasta 'chamados/'
-- ============================================================================
DROP POLICY IF EXISTS "Permitir leitura pública de anexos em gop-anexos" ON storage.objects;
CREATE POLICY "Permitir leitura pública de anexos em gop-anexos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

-- ============================================================================
-- 3. Hardening da Função da Trigger (Fixação de search_path e Security Definer)
-- ============================================================================
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

-- ============================================================================
-- 4. Exclusão do Índice Redundante na coluna 'id_chamado' da tabela 'anexos_chamado'
-- ============================================================================
DROP INDEX IF EXISTS public.idx_anexos_chamado_id;
