-- Migration: rpc_create_ticket (Fase 3: Rodada Transacional)
-- Criação de funções RPC transacionais atômicas com privilégios SECURITY DEFINER para garantir a integridade dos dados e governança.

-- 1. Criar função para criação atômica de chamado + histórico inicial
CREATE OR REPLACE FUNCTION public.create_ticket_with_history(
  p_ticket JSONB,
  p_event JSONB
) RETURNS public.chamados AS $$
DECLARE
  v_inserted_ticket public.chamados;
  v_id_chamado TEXT;
BEGIN
  -- Inserir o chamado na tabela public.chamados
  INSERT INTO public.chamados (
    id_chamado,
    unidade_escolar,
    designacao,
    data_solicitacao,
    local_demanda,
    tipo_demanda,
    tipo_aparelho,
    btu_existente,
    btu_pretendido,
    status_atual,
    setor_responsavel,
    proxima_providencia,
    ultima_movimentacao,
    informacao_validada,
    prioridade,
    comunicacao_cto,
    observacoes,
    resultado_aptidao,
    criado_em,
    modificado_em
  ) VALUES (
    p_ticket->>'id_chamado',
    p_ticket->>'unidade_escolar',
    p_ticket->>'designacao',
    (p_ticket->>'data_solicitacao')::TIMESTAMPTZ,
    p_ticket->>'local_demanda',
    p_ticket->>'tipo_demanda',
    p_ticket->>'tipo_aparelho',
    p_ticket->>'btu_existente',
    p_ticket->>'btu_pretendido',
    p_ticket->>'status_atual',
    p_ticket->>'setor_responsavel',
    p_ticket->>'proxima_providencia',
    p_ticket->>'ultima_movimentacao',
    p_ticket->>'informacao_validada',
    p_ticket->>'prioridade',
    COALESCE(p_ticket->>'comunicacao_cto', 'Não'),
    p_ticket->>'observacoes',
    p_ticket->>'resultado_aptidao',
    COALESCE((p_ticket->>'criado_em')::TIMESTAMPTZ, NOW()),
    COALESCE((p_ticket->>'modificado_em')::TIMESTAMPTZ, NOW())
  )
  RETURNING * INTO v_inserted_ticket;

  v_id_chamado := v_inserted_ticket.id_chamado;

  -- Inserir o evento de histórico inicial
  INSERT INTO public.historico (
    id_evento,
    data,
    id_chamado,
    designacao,
    unidade_escolar,
    marco_relevante,
    setor,
    responsavel_registro,
    observacao
  ) VALUES (
    p_event->>'id_evento',
    (p_event->>'data')::TIMESTAMPTZ,
    v_id_chamado,
    p_event->>'designacao',
    p_event->>'unidade_escolar',
    p_event->>'marco_relevante',
    p_event->>'setor',
    p_event->>'responsavel_registro',
    p_event->>'observacao'
  );

  RETURN v_inserted_ticket;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- 2. Criar função para inserção atômica de anexo + histórico de governança
CREATE OR REPLACE FUNCTION public.create_attachment_with_history(
  p_attachment JSONB,
  p_event JSONB
) RETURNS public.anexos_chamado AS $$
DECLARE
  v_inserted_attachment public.anexos_chamado;
BEGIN
  -- Inserir registro na tabela public.anexos_chamado
  INSERT INTO public.anexos_chamado (
    id_chamado,
    designacao,
    unidade_escolar,
    bucket,
    storage_path,
    nome_original,
    mime_type,
    tamanho_bytes,
    descricao
  ) VALUES (
    p_attachment->>'id_chamado',
    p_attachment->>'designacao',
    p_attachment->>'unidade_escolar',
    COALESCE(p_attachment->>'bucket', 'gop-anexos'),
    p_attachment->>'storage_path',
    p_attachment->>'nome_original',
    p_attachment->>'mime_type',
    (p_attachment->>'tamanho_bytes')::BIGINT,
    p_attachment->>'descricao'
  )
  RETURNING * INTO v_inserted_attachment;

  -- Inserir log correspondente no histórico
  INSERT INTO public.historico (
    id_evento,
    data,
    id_chamado,
    designacao,
    unidade_escolar,
    marco_relevante,
    setor,
    responsavel_registro,
    observacao
  ) VALUES (
    p_event->>'id_evento',
    (p_event->>'data')::TIMESTAMPTZ,
    p_event->>'id_chamado',
    p_event->>'designacao',
    p_event->>'unidade_escolar',
    p_event->>'marco_relevante',
    p_event->>'setor',
    p_event->>'responsavel_registro',
    p_event->>'observacao'
  );

  RETURN v_inserted_attachment;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- 3. Criar função para exclusão atômica de anexo + histórico de governança
CREATE OR REPLACE FUNCTION public.delete_attachment_with_history(
  p_attachment_id BIGINT,
  p_event JSONB
) RETURNS VOID AS $$
BEGIN
  -- Excluir o registro lógico na tabela public.anexos_chamado
  DELETE FROM public.anexos_chamado
  WHERE id = p_attachment_id;

  -- Inserir log correspondente no histórico
  INSERT INTO public.historico (
    id_evento,
    data,
    id_chamado,
    designacao,
    unidade_escolar,
    marco_relevante,
    setor,
    responsavel_registro,
    observacao
  ) VALUES (
    p_event->>'id_evento',
    (p_event->>'data')::TIMESTAMPTZ,
    p_event->>'id_chamado',
    p_event->>'designacao',
    p_event->>'unidade_escolar',
    p_event->>'marco_relevante',
    p_event->>'setor',
    p_event->>'responsavel_registro',
    p_event->>'observacao'
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;
