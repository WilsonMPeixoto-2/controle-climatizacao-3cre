-- 20260602000003_add_appliance_fields.sql — Adiciona campos de especificações técnicas do aparelho na tabela chamados
-- Controle de Climatização — GOP / 3ª CRE — SME-RJ

ALTER TABLE chamados 
  ADD COLUMN IF NOT EXISTS tipo_aparelho TEXT DEFAULT 'Split',
  ADD COLUMN IF NOT EXISTS btu_existente TEXT,
  ADD COLUMN IF NOT EXISTS btu_pretendido TEXT;
