-- 20260602000001_auto_increment_ids.sql — Sequence e Trigger para ID sequencial resiliente de chamados
-- Controle de Climatização — GOP / 3ª CRE — SME-RJ

-- 1. Criação da Sequence para auto-incremento de ID de chamados (começa em 29, pois 1 a 28 já existem no seed)
CREATE SEQUENCE IF NOT EXISTS seq_id_chamado START WITH 29;

-- 2. Função PL/pgSQL para gerar o ID formatado como GOP-AR-2026-XXXX
CREATE OR REPLACE FUNCTION generate_next_id_chamado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_chamado IS NULL OR NEW.id_chamado = '' THEN
    NEW.id_chamado := 'GOP-AR-2026-' || LPAD(nextval('seq_id_chamado')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criação da Trigger BEFORE INSERT na tabela 'chamados'
DROP TRIGGER IF EXISTS trg_generate_id_chamado ON chamados;
CREATE TRIGGER trg_generate_id_chamado
BEFORE INSERT ON chamados
FOR EACH ROW
EXECUTE FUNCTION generate_next_id_chamado();
