-- Code-review hardening: financeiro_editar_orcamento only checked the caller's
-- role, not whether the target orcamento is actually pendente_aprovacao_financeira.
-- Add the same explicit status guard the other approval RPCs already use.

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
  v_status text;
  v_numero text;
  v_item jsonb;
  v_ids_mantidos uuid[];
BEGIN
  SELECT u.role INTO v_user_role FROM public.usuarios u WHERE u.id = auth.uid();
  IF v_user_role IS NULL OR v_user_role NOT IN ('admin', 'gerente', 'operador') THEN
    RAISE EXCEPTION 'Permissão negada.' USING ERRCODE = 'P0001';
  END IF;

  SELECT status, coalesce(numero, left(id::text, 8)) INTO v_status, v_numero
  FROM public.orcamentos WHERE id = p_orcamento_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Orçamento não encontrado.' USING ERRCODE = 'P0001';
  END IF;

  IF v_status NOT IN ('pendente_aprovacao_financeira', 'aprovado') THEN
    RAISE EXCEPTION 'Orçamento % não está em aprovação financeira. Status atual: %', v_numero, v_status
      USING ERRCODE = 'P0001';
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
