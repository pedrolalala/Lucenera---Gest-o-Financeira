-- Fase 2 (complemento): permite que a tela de Aprovacao Financeira edite um
-- orcamento 'pendente_aprovacao_financeira' SEM reiniciar o ciclo de aprovacao,
-- quando o financeiro escolher explicitamente nao reiniciar. Sem isso, o reset
-- automatico da migracao anterior quebraria o fluxo existente de correcao do
-- financeiro antes de aprovar.

-- ==========================================================
-- 1. Bypass do reset via GUC de sessao/transacao (app.skip_approval_reset)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_orcamento_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_has_items boolean := false;
  v_skip_reset boolean := false;
BEGIN
  v_old_status := COALESCE(OLD.status, '');
  v_skip_reset := coalesce(current_setting('app.skip_approval_reset', true), 'false') = 'true';

  -- Reset: edicao de campos comerciais depois da aprovacao do cliente ou aprovacao final
  IF (
    TG_OP = 'UPDATE'
    AND NOT v_skip_reset
    AND v_old_status IN ('pendente_aprovacao_financeira', 'aprovado')
    AND NEW.status = v_old_status
    AND (
      NEW.valor_total IS DISTINCT FROM OLD.valor_total OR
      NEW.forma_pagamento IS DISTINCT FROM OLD.forma_pagamento OR
      NEW.frete_tipo IS DISTINCT FROM OLD.frete_tipo OR
      NEW.frete_valor IS DISTINCT FROM OLD.frete_valor OR
      NEW.condicoes_pagamento IS DISTINCT FROM OLD.condicoes_pagamento OR
      NEW.prazo_pagamento_dias IS DISTINCT FROM OLD.prazo_pagamento_dias OR
      NEW.desconto_global IS DISTINCT FROM OLD.desconto_global
    )
  ) THEN
    NEW.status := 'enviado_cliente';
    NEW.aprovado_cliente_em := NULL;
    NEW.aprovado_cliente_origem := NULL;
    NEW.requer_revisao_financeira := false;
    NEW.token_aprovacao_cliente := public.gen_token_hex();
    NEW.enviado_cliente_em := now();
    NEW.enviado_cliente_por := auth.uid();

    INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
    VALUES (NEW.id, v_old_status, 'enviado_cliente', auth.uid()::text,
      'Orçamento editado após aprovação — ciclo de aprovação reiniciado (cliente + financeiro)');

    RETURN NEW;
  END IF;

  IF (
    TG_OP = 'UPDATE'
    AND v_skip_reset
    AND v_old_status IN ('pendente_aprovacao_financeira', 'aprovado')
    AND NEW.status = v_old_status
    AND (
      NEW.valor_total IS DISTINCT FROM OLD.valor_total OR
      NEW.forma_pagamento IS DISTINCT FROM OLD.forma_pagamento OR
      NEW.frete_tipo IS DISTINCT FROM OLD.frete_tipo OR
      NEW.frete_valor IS DISTINCT FROM OLD.frete_valor OR
      NEW.condicoes_pagamento IS DISTINCT FROM OLD.condicoes_pagamento OR
      NEW.prazo_pagamento_dias IS DISTINCT FROM OLD.prazo_pagamento_dias OR
      NEW.desconto_global IS DISTINCT FROM OLD.desconto_global
    )
  ) THEN
    INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
    VALUES (NEW.id, v_old_status, v_old_status, auth.uid()::text,
      'Orçamento corrigido pelo financeiro durante a Aprovação Financeira — ciclo de aprovação do cliente mantido (não reiniciado, por escolha explícita)');

    RETURN NEW;
  END IF;

  -- Auto-generate token when status is enviado_cliente and no token exists
  IF (NEW.status = 'enviado_cliente' AND NEW.token_aprovacao_cliente IS NULL) THEN
    NEW.token_aprovacao_cliente := public.gen_token_hex();
    IF NEW.enviado_cliente_em IS NULL THEN
      NEW.enviado_cliente_em := now();
    END IF;
    IF NEW.enviado_cliente_por IS NULL THEN
      NEW.enviado_cliente_por := auth.uid();
    END IF;
  END IF;

  -- Auto-transition from rascunho to enviado_cliente when all mandatory data AND items exist
  IF (NEW.status IN ('rascunho', 'aguardando_cliente') OR NEW.status IS NULL) THEN
    IF NEW.empresa_id IS NOT NULL
       AND NEW.projeto_id IS NOT NULL
       AND NEW.cliente_id IS NOT NULL
       AND NEW.forma_pagamento IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM public.orcamento_itens WHERE orcamento_id = NEW.id
      ) INTO v_has_items;
      IF v_has_items THEN
        NEW.status := 'enviado_cliente';
        NEW.token_aprovacao_cliente := public.gen_token_hex();
        NEW.enviado_cliente_em := COALESCE(NEW.enviado_cliente_em, now());
        NEW.enviado_cliente_por := COALESCE(NEW.enviado_cliente_por, auth.uid());
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_orcamento_item_change_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento_id uuid;
  v_status text;
  v_skip_reset boolean := false;
BEGIN
  v_orcamento_id := COALESCE(NEW.orcamento_id, OLD.orcamento_id);
  v_skip_reset := coalesce(current_setting('app.skip_approval_reset', true), 'false') = 'true';

  SELECT status INTO v_status FROM public.orcamentos WHERE id = v_orcamento_id FOR UPDATE;

  IF v_status IN ('pendente_aprovacao_financeira', 'aprovado') AND NOT v_skip_reset THEN
    UPDATE public.orcamentos
    SET status = 'enviado_cliente',
        aprovado_cliente_em = NULL,
        aprovado_cliente_origem = NULL,
        requer_revisao_financeira = false,
        token_aprovacao_cliente = public.gen_token_hex(),
        enviado_cliente_em = now(),
        enviado_cliente_por = auth.uid()
    WHERE id = v_orcamento_id;

    INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
    VALUES (v_orcamento_id, v_status, 'enviado_cliente', auth.uid()::text,
      'Itens do orçamento alterados após aprovação — ciclo de aprovação reiniciado');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ==========================================================
-- 2. RPC usada pela tela de Aprovacao Financeira para editar orcamento+itens
--    com escolha explicita de reiniciar (ou nao) o ciclo de aprovacao.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.financeiro_editar_orcamento(
  p_orcamento_id uuid,
  p_forma_pagamento text,
  p_valor_total numeric,
  p_itens jsonb,
  p_reiniciar_aprovacao boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
  v_item jsonb;
  v_ids_mantidos uuid[];
BEGIN
  SELECT u.role INTO v_user_role FROM public.usuarios u WHERE u.id = auth.uid();
  IF v_user_role IS NULL OR v_user_role NOT IN ('admin', 'gerente', 'operador') THEN
    RAISE EXCEPTION 'Permissão negada.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT p_reiniciar_aprovacao THEN
    PERFORM set_config('app.skip_approval_reset', 'true', true);
  END IF;

  UPDATE public.orcamentos
  SET forma_pagamento = p_forma_pagamento,
      valor_total = p_valor_total
  WHERE id = p_orcamento_id;

  SELECT array_agg((item->>'id')::uuid) INTO v_ids_mantidos
  FROM jsonb_array_elements(p_itens) AS item
  WHERE item->>'id' IS NOT NULL;

  DELETE FROM public.orcamento_itens
  WHERE orcamento_id = p_orcamento_id
    AND (v_ids_mantidos IS NULL OR id != ALL(v_ids_mantidos));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO public.orcamento_itens (
      id, orcamento_id, produto_id, descricao, quantidade, preco_unitario,
      desconto, custom_id, ordem, peca_nova
    )
    VALUES (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      p_orcamento_id,
      (v_item->>'produto_id')::uuid,
      v_item->>'descricao',
      (v_item->>'quantidade')::numeric,
      (v_item->>'preco_unitario')::numeric,
      (v_item->>'desconto')::numeric,
      v_item->>'custom_id',
      (v_item->>'ordem')::integer,
      coalesce((v_item->>'peca_nova')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
      produto_id = excluded.produto_id,
      descricao = excluded.descricao,
      quantidade = excluded.quantidade,
      preco_unitario = excluded.preco_unitario,
      desconto = excluded.desconto,
      custom_id = excluded.custom_id,
      ordem = excluded.ordem,
      peca_nova = excluded.peca_nova;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'orcamento_id', p_orcamento_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.financeiro_editar_orcamento(uuid, text, numeric, jsonb, boolean) TO authenticated;
