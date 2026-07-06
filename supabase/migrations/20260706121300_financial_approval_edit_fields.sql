ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS peca_nova BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.finalizar_validacao_financeira(
  p_project_id UUID,
  p_project_data JSONB,
  p_orcamentos JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_valor_total NUMERIC;
  v_orcamento JSONB;
  v_item JSONB;
  v_orcamento_id UUID;
  v_status_anterior TEXT;
BEGIN
  SELECT status INTO v_status_anterior FROM public.projetos WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Projeto não encontrado';
  END IF;

  UPDATE public.projetos SET
    valor_total = COALESCE((p_project_data->>'valor_total')::NUMERIC, valor_total),
    nivel_estrategico = COALESCE(NULLIF(p_project_data->>'nivel_estrategico', '')::projeto_nivel, nivel_estrategico),
    cidade = COALESCE(NULLIF(p_project_data->>'cidade', ''), cidade),
    estado = COALESCE(NULLIF(p_project_data->>'estado', ''), estado),
    updated_at = NOW()
  WHERE id = p_project_id;

  FOR v_orcamento IN SELECT * FROM jsonb_array_elements(COALESCE(p_orcamentos, '[]'::JSONB))
  LOOP
    v_orcamento_id := (v_orcamento->>'id')::UUID;

    UPDATE public.orcamentos SET
      forma_pagamento = COALESCE(NULLIF(v_orcamento->>'forma_pagamento', '')::pagamento_forma, forma_pagamento),
      valor_total = COALESCE((v_orcamento->>'valor_total')::NUMERIC, valor_total)
    WHERE id = v_orcamento_id AND projeto_id = p_project_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_orcamento->'itens', '[]'::JSONB))
    LOOP
      UPDATE public.orcamento_itens SET
        quantidade = COALESCE((v_item->>'quantidade')::NUMERIC, quantidade),
        preco_unitario = COALESCE((v_item->>'preco_unitario')::NUMERIC, preco_unitario),
        descricao = COALESCE(v_item->>'descricao', descricao),
        peca_nova = COALESCE((v_item->>'peca_nova')::BOOLEAN, false)
      WHERE id = (v_item->>'id')::UUID AND orcamento_id = v_orcamento_id;
    END LOOP;
  END LOOP;

  SELECT valor_total INTO v_valor_total FROM public.projetos WHERE id = p_project_id;
  IF v_valor_total IS NULL OR v_valor_total <= 0 THEN
    RAISE EXCEPTION 'Valor total do projeto deve ser maior que zero';
  END IF;

  UPDATE public.projetos SET
    status = 'Orçamento Aprovado',
    updated_at = NOW()
  WHERE id = p_project_id;

  UPDATE public.orcamentos SET
    status = 'Orçamento Aprovado'
  WHERE projeto_id = p_project_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, observacao)
  SELECT id, v_status_anterior, 'Orçamento Aprovado', 'Validação financeira finalizada via edição'
  FROM public.orcamentos WHERE projeto_id = p_project_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'project_id', p_project_id,
    'status_anterior', v_status_anterior,
    'status_novo', 'Orçamento Aprovado'
  );
END;
$$;
