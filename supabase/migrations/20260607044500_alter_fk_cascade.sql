-- Migração: 20260607044500_alter_fk_cascade.sql
-- Descrição: Atualizar a restrição de chave estrangeira da tabela historico para permitir deleção em cascata (ON DELETE CASCADE).

-- 1. Remover a constraint de chave estrangeira antiga sem cascade
ALTER TABLE public.historico DROP CONSTRAINT IF EXISTS historico_id_chamado_fkey;

-- 2. Recriar a constraint adicionando a deleção em cascata
ALTER TABLE public.historico
  ADD CONSTRAINT historico_id_chamado_fkey
  FOREIGN KEY (id_chamado)
  REFERENCES public.chamados(id_chamado)
  ON DELETE CASCADE;
