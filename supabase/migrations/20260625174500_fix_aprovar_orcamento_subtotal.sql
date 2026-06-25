-- Redefine a função base para remover a coluna "subtotal" da inserção,
-- pois ela é uma coluna gerada e o PostgreSQL não permite sua inserção manual.
CREATE OR REPLACE FUNCTION public.aprovar_orcamento_financeiro_base_spec001(p_orcamento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento public.orcamentos%ROWTYPE;
  v_cliente_nome text;
  v_status_anterior text;
  v_prazos integer[];
  v_qtd_parcelas integer;
  v_i integer;
  v_valor_total numeric;
  v_valor_base numeric;
  v_valor_parcela numeric;
  v_valor_acumulado numeric := 0;
  v_data_base date := current_date;
  v_itens_existentes integer := 0;
  v_parcelas_existentes integer := 0;
  v_boletos_existentes integer := 0;
  v_itens_criados integer := 0;
  v_parcelas_criadas integer := 0;
  v_boletos_criados integer := 0;
  v_numero_orcamento text;
BEGIN
  SELECT *
    INTO v_orcamento
  FROM public.orcamentos
  WHERE id = p_orcamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento % não encontrado.', p_orcamento_id
      USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_orcamento.status;
  v_numero_orcamento := coalesce(v_orcamento.numero, left(p_orcamento_id::text, 8));

  IF v_orcamento.projeto_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui projeto vinculado.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.empresa_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui empresa vinculada.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.cliente_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui cliente vinculado.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  IF coalesce(v_orcamento.valor_total, 0) <= 0 THEN
    RAISE EXCEPTION 'Orçamento % possui valor total inválido.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.forma_pagamento IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui forma de pagamento estruturada.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.orcamento_itens oi
    WHERE oi.orcamento_id = p_orcamento_id
  ) THEN
    RAISE EXCEPTION 'Orçamento % não possui itens.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.orcamento_itens oi
    WHERE oi.orcamento_id = p_orcamento_id
      AND (
        coalesce(oi.quantidade, 0) <= 0
        OR coalesce(oi.preco_unitario, 0) <= 0
      )
  ) THEN
    RAISE EXCEPTION 'Orçamento % possui item sem quantidade ou preço válido.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  v_prazos := public._lucenera_parse_prazo_pagamento(
    v_orcamento.condicoes_pagamento,
    v_orcamento.prazo_pagamento_dias
  );
  v_qtd_parcelas := coalesce(array_length(v_prazos, 1), 0);

  IF v_qtd_parcelas = 0 THEN
    RAISE EXCEPTION 'Orçamento % não possui prazo de pagamento interpretável.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  SELECT nome
    INTO v_cliente_nome
  FROM public.contatos
  WHERE id = v_orcamento.cliente_id;

  SELECT count(*) INTO v_itens_existentes
  FROM public.projeto_itens
  WHERE orcamento_id = p_orcamento_id;

  SELECT count(*) INTO v_parcelas_existentes
  FROM public.projeto_parcelas
  WHERE orcamento_id = p_orcamento_id;

  SELECT count(*) INTO v_boletos_existentes
  FROM public.boletos
  WHERE orcamento_id = p_orcamento_id;

  IF v_itens_existentes > 0
     OR v_parcelas_existentes > 0
     OR v_boletos_existentes > 0 THEN
    IF v_itens_existentes > 0
       AND v_parcelas_existentes = v_qtd_parcelas
       AND v_boletos_existentes = v_qtd_parcelas THEN
      UPDATE public.orcamentos
      SET status = 'aprovado'
      WHERE id = p_orcamento_id;

      RETURN jsonb_build_object(
        'orcamento_id', p_orcamento_id,
        'status', 'aprovado',
        'projeto_id', v_orcamento.projeto_id,
        'projeto_itens_criados', 0,
        'parcelas_criadas', 0,
        'boletos_criados', 0,
        'nota_fiscal_status', 'pendente_api',
        'ja_processado', true
      );
    END IF;

    RAISE EXCEPTION
      'Orçamento % possui processamento parcial inconsistente: itens %, parcelas %, boletos %.',
      v_numero_orcamento,
      v_itens_existentes,
      v_parcelas_existentes,
      v_boletos_existentes
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orcamentos
  SET status = 'aprovado'
  WHERE id = p_orcamento_id;

  BEGIN
    INSERT INTO public.historico_status_orcamento (
      orcamento_id,
      status_anterior,
      status_novo,
      usuario,
      observacao
    )
    VALUES (
      p_orcamento_id,
      v_status_anterior,
      'aprovado',
      auth.uid()::text,
      'Aprovação integrada por aprovar_orcamento_financeiro'
    );
  EXCEPTION
    WHEN undefined_table OR undefined_column OR foreign_key_violation THEN
      NULL;
  END;

  INSERT INTO public.projeto_itens (
    projeto_id,
    produto_id,
    descricao,
    quantidade,
    preco_unitario,
    desconto,
    validado,
    orcamento_id
  )
  SELECT
    v_orcamento.projeto_id,
    oi.produto_id,
    coalesce(oi.descricao, oi.custom_id, p.nome, 'Item do Orçamento'),
    coalesce(oi.quantidade, 0),
    coalesce(oi.preco_unitario, 0),
    coalesce(oi.desconto, 0),
    true,
    p_orcamento_id
  FROM public.orcamento_itens oi
  LEFT JOIN public.produtos p ON p.id = oi.produto_id
  WHERE oi.orcamento_id = p_orcamento_id;

  GET DIAGNOSTICS v_itens_criados = ROW_COUNT;

  v_valor_total := coalesce(v_orcamento.valor_total, 0);
  v_valor_base := round(v_valor_total / v_qtd_parcelas, 2);

  FOR v_i IN 1..v_qtd_parcelas LOOP
    IF v_i = v_qtd_parcelas THEN
      v_valor_parcela := v_valor_total - v_valor_acumulado;
    ELSE
      v_valor_parcela := v_valor_base;
      v_valor_acumulado := v_valor_acumulado + v_valor_parcela;
    END IF;

    INSERT INTO public.projeto_parcelas (
      projeto_id,
      numero_parcela,
      valor,
      data_fechamento,
      data_vencimento,
      status,
      forma_pagamento,
      orcamento_id,
      venda_id,
      descricao
    )
    VALUES (
      v_orcamento.projeto_id,
      v_i,
      v_valor_parcela,
      current_date,
      v_data_base + v_prazos[v_i],
      'pendente',
      v_orcamento.forma_pagamento,
      p_orcamento_id,
      NULL,
      'Parcela gerada pelo orçamento ' || v_numero_orcamento
    );

    v_parcelas_criadas := v_parcelas_criadas + 1;
  END LOOP;

  INSERT INTO public.boletos (
    nosso_numero,
    numero_documento,
    parcela_id,
    orcamento_id,
    projeto_id,
    empresa_id,
    valor,
    vencimento,
    nome_pagador,
    status,
    tipo,
    venda,
    num_parcela,
    total_parcelas,
    emissao
  )
  SELECT
    'ORC-' || regexp_replace(v_numero_orcamento, '[^a-zA-Z0-9]', '', 'g') || '-P' || pp.numero_parcela,
    v_numero_orcamento || '-P' || pp.numero_parcela,
    pp.id,
    p_orcamento_id,
    v_orcamento.projeto_id,
    v_orcamento.empresa_id,
    pp.valor,
    pp.data_vencimento,
    coalesce(v_cliente_nome, 'Cliente do orçamento'),
    'pendente_registro',
    'Nota Fiscal',
    NULL,
    pp.numero_parcela,
    v_qtd_parcelas,
    current_date
  FROM public.projeto_parcelas pp
  WHERE pp.orcamento_id = p_orcamento_id
  ON CONFLICT (nosso_numero) DO NOTHING;

  GET DIAGNOSTICS v_boletos_criados = ROW_COUNT;

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'aprovado',
    'projeto_id', v_orcamento.projeto_id,
    'projeto_itens_criados', v_itens_criados,
    'parcelas_criadas', v_parcelas_criadas,
    'boletos_criados', v_boletos_criados,
    'nota_fiscal_status', 'pendente_api',
    'ja_processado', false
  );
END;
$$;

-- Redefine a função principal usada atualmente, também removendo o "subtotal" manual
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
        orcamento_id,
        descricao
      ) VALUES (
        v_projeto_id,
        v_item.produto_id,
        v_item.quantidade,
        v_item.preco_unitario,
        v_item.desconto,
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
