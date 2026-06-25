CREATE OR REPLACE FUNCTION public.aprovar_orcamento_financeiro(p_orcamento_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_orcamento record;
  v_projeto_id uuid;
  v_itens_criados int := 0;
  v_parcelas_criadas int := 0;
  v_boletos_criados int := 0;
  v_item record;
  v_num_parcelas int := 1;
  v_valor_parcela numeric;
  v_data_venc date;
  v_i int;
  v_ja_processado boolean := true;
BEGIN
  -- Obter dados do orçamento
  SELECT * INTO v_orcamento FROM public.orcamentos WHERE id = p_orcamento_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado';
  END IF;

  -- Determinar projeto_id
  IF v_orcamento.projeto_id IS NULL THEN
    INSERT INTO public.projetos (
      nome, 
      cliente_id, 
      arquiteto_id, 
      empresa_id, 
      status, 
      data_entrada
    ) VALUES (
      COALESCE(v_orcamento.numero, 'PROJ-' || substr(p_orcamento_id::text, 1, 8)),
      v_orcamento.cliente_id,
      v_orcamento.arquiteto_id,
      v_orcamento.empresa_id,
      'Estudo Inicial',
      CURRENT_DATE
    ) RETURNING id INTO v_projeto_id;

    UPDATE public.orcamentos SET projeto_id = v_projeto_id WHERE id = p_orcamento_id;
    v_ja_processado := false;
  ELSE
    v_projeto_id := v_orcamento.projeto_id;
  END IF;

  -- Migrar itens
  FOR v_item IN SELECT * FROM public.orcamento_itens WHERE orcamento_id = p_orcamento_id LOOP
    IF NOT EXISTS (SELECT 1 FROM public.projeto_itens WHERE orcamento_id = p_orcamento_id AND produto_id = v_item.produto_id AND quantidade = v_item.quantidade) THEN
      INSERT INTO public.projeto_itens (
        projeto_id,
        produto_id,
        quantidade,
        preco_unitario,
        desconto,
        subtotal,
        orcamento_id,
        descricao
      ) VALUES (
        v_projeto_id,
        v_item.produto_id,
        v_item.quantidade,
        v_item.preco_unitario,
        v_item.desconto,
        v_item.quantidade * COALESCE(v_item.preco_unitario, 0) * (1 - COALESCE(v_item.desconto, 0)/100.0),
        p_orcamento_id,
        v_item.descricao
      );
      v_itens_criados := v_itens_criados + 1;
      v_ja_processado := false;
    END IF;
  END LOOP;

  -- Parse condicoes_pagamento para parcelas (ex: "3x")
  IF COALESCE(v_orcamento.condicoes_pagamento, '') ~ '^[0-9]+[xX]$' THEN
    v_num_parcelas := regexp_replace(v_orcamento.condicoes_pagamento, '[^0-9]', '', 'g')::int;
  END IF;
  
  IF v_num_parcelas < 1 THEN
    v_num_parcelas := 1;
  END IF;

  v_valor_parcela := COALESCE(v_orcamento.valor_total, 0) / v_num_parcelas;
  
  -- Gerar parcelas apenas se não existirem
  IF NOT EXISTS (SELECT 1 FROM public.projeto_parcelas WHERE orcamento_id = p_orcamento_id) THEN
    FOR v_i IN 1..v_num_parcelas LOOP
      v_data_venc := CURRENT_DATE + (v_i * 30);
      
      INSERT INTO public.projeto_parcelas (
        projeto_id,
        orcamento_id,
        numero_parcela,
        valor,
        data_vencimento,
        status,
        forma_pagamento
      ) VALUES (
        v_projeto_id,
        p_orcamento_id,
        v_i,
        v_valor_parcela,
        v_data_venc,
        'pendente',
        v_orcamento.forma_pagamento
      );
      v_parcelas_criadas := v_parcelas_criadas + 1;
      v_ja_processado := false;
    END LOOP;
  END IF;

  -- Atualizar status do orçamento se não for aprovado
  IF v_orcamento.status IS DISTINCT FROM 'aprovado' THEN
    UPDATE public.orcamentos SET status = 'aprovado' WHERE id = p_orcamento_id;
    v_ja_processado := false;
  END IF;

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'aprovado',
    'projeto_id', v_projeto_id,
    'projeto_itens_criados', v_itens_criados,
    'parcelas_criadas', v_parcelas_criadas,
    'boletos_criados', v_boletos_criados,
    'nota_fiscal_status', 'pendente',
    'ja_processado', v_ja_processado
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
