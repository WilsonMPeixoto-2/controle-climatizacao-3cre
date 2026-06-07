-- Migração: 20260607043000_storage_anon_policies.sql
-- Descrição: Recriar políticas da tabela storage.objects para conceder acesso às roles anon e authenticated.

-- 1. Remover políticas anteriores da tabela storage.objects no bucket gop-anexos
DROP POLICY IF EXISTS "Permitir leitura de anexos em gop-anexos para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de anexos no subdiretorio chamados em gop-anexo" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de anexos no subdiretorio chamados em gop-an" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de anexos em gop-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de anexos no subdiretorio chamados em gop-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos" ON storage.objects;

-- 2. Recriar políticas liberando acesso para 'anon' e 'authenticated' no bucket 'gop-anexos' e pasta 'chamados'
CREATE POLICY "Permitir leitura pública de anexos em gop-anexos" 
ON storage.objects FOR SELECT TO anon, authenticated 
USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

CREATE POLICY "Permitir upload de anexos no subdiretorio chamados em gop-anexos" 
ON storage.objects FOR INSERT TO anon, authenticated 
WITH CHECK (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');

CREATE POLICY "Permitir exclusão de anexos no subdiretorio chamados em gop-anexos" 
ON storage.objects FOR DELETE TO anon, authenticated 
USING (bucket_id = 'gop-anexos' AND (storage.foldername(name))[1] = 'chamados');
