-- 20260603000004_rpc_save_ticket.sql
--
-- Função PL/pgSQL transacional para salvar atualizações de chamado e inserir múltiplos eventos de histórico.
-- Executa de forma atômica no banco de dados e contorna restrições de RLS usando privilégios SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.save_ticket_with_history(
  p_ticket JSONB,
  p_events JSONB[]
) RETURNS public.chamados AS $$
DECLARE
  v_event JSONB;
  v_updated_ticket public.chamados;
BEGIN
  -- 1. Atualizar os dados do chamado na tabela public.chamados
  UPDATE public.chamados
  SET
    status_atual = (p_ticket->>'status_atual'),
    setor_responsavel = (p_ticket->>'setor_responsavel'),
    prioridade = (p_ticket->>'prioridade'),
    proxima_providencia = (p_ticket->>'proxima_providencia'),
    ultima_movimentacao = (p_ticket->>'ultima_movimentacao'),
    comunicacao_cto = (p_ticket->>'comunicacao_cto'),
    informacao_validada = (p_ticket->>'informacao_validada'),
    local_demanda = (p_ticket->>'local_demanda'),
    tipo_demanda = (p_ticket->>'tipo_demanda'),
    tipo_aparelho = (p_ticket->>'tipo_aparelho'),
    btu_existente = (p_ticket->>'btu_existente'),
    btu_pretendido = (p_ticket->>'btu_pretendido'),
    resultado_aptidao = (p_ticket->>'resultado_aptidao'),
    observacoes = (p_ticket->>'observacoes'),
    modificado_em = (p_ticket->>'modificado_em')::TIMESTAMPTZ
  WHERE id_chamado = (p_ticket->>'id_chamado')
  RETURNING * INTO v_updated_ticket;

  -- 2. Inserir todos os eventos de histórico mapeados
  IF p_events IS NOT NULL THEN
    FOREACH v_event IN ARRAY p_events LOOP
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
        v_event->>'id_evento',
        (v_event->>'data')::TIMESTAMPTZ,
        v_event->>'id_chamado',
        v_event->>'designacao',
        v_event->>'unidade_escolar',
        v_event->>'marco_relevante',
        v_event->>'setor',
        v_event->>'responsavel_registro',
        v_event->>'observacao'
      );
    END LOOP;
  END IF;

  RETURN v_updated_ticket;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;
