-- SPEC-001 — Aprovação de orçamento para itens do projeto e Administração Bancária
-- Migration idempotente para preparar vínculos por orcamento_id e criar a RPC transacional.

ALTER TABLE public.projeto_itens
  ADD COLUMN IF NOT EXISTS orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL;

ALTER TABLE public.projeto_parcelas
  ADD COLUMN IF NOT EXISTS orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL;

ALTER TABLE public.boletos
  ADD COLUMN IF NOT EXISTS orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL;

ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL;

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS frete_tipo text,
  ADD COLUMN IF NOT EXISTS frete_valor numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prazo_pagamento_dias integer[],
  ADD COLUMN IF NOT EXISTS data_base_vencimento text DEFAULT 'aprovacao';

CREATE INDEX IF NOT EXISTS idx_projeto_itens_orcamento_id
  ON public.projeto_itens(orcamento_id);

CREATE INDEX IF NOT EXISTS idx_projeto_parcelas_orcamento_id
  ON public.projeto_parcelas(orcamento_id);

CREATE INDEX IF NOT EXISTS idx_boletos_orcamento_id
  ON public.boletos(orcamento_id);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_orcamento_id
  ON public.notas_fiscais(orcamento_id);

CREATE OR REPLACE FUNCTION public._lucenera_parse_prazo_pagamento(
  p_condicoes_pagamento text,
  p_prazo_pagamento_dias integer[]
)
RETURNS integer[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_text text := lower(coalesce(p_condicoes_pagamento, ''));
  v_nums integer[];
  v_count integer;
  v_interval integer;
  v_len integer;
BEGIN
  IF p_prazo_pagamento_dias IS NOT NULL
     AND array_length(p_prazo_pagamento_dias, 1) > 0 THEN
    RETURN p_prazo_pagamento_dias;
  END IF;

  SELECT array_agg((matches.match)[1]::integer)
    INTO v_nums
  FROM regexp_matches(v_text, '([0-9]+)', 'g') AS matches(match);

  v_len := coalesce(array_length(v_nums, 1), 0);

  IF v_len = 0 THEN
    RETURN ARRAY[]::integer[];
  END IF;

  -- Ex.: "3x30" ou "3x 30 dias" = 30/60/90.
  IF v_text ~ '^\s*[0-9]+\s*x\s*[0-9]+'
     AND v_len = 2
     AND v_nums[1] > 1
     AND v_nums[2] > 0 THEN
    v_count := v_nums[1];
    v_interval := v_nums[2];

    SELECT array_agg(i * v_interval ORDER BY i)
      INTO v_nums
    FROM generate_series(1, v_count) AS i;

    RETURN v_nums;
  END IF;

  -- Ex.: "3x 30/60/90" = ignora o primeiro número, que representa quantidade.
  IF v_text ~ '^\s*[0-9]+\s*x' THEN
    v_count := v_nums[1];

    IF v_len - 1 = v_count THEN
      RETURN v_nums[2:v_len];
    END IF;

    IF v_len > 1 THEN
      RETURN v_nums[2:v_len];
    END IF;

    -- "3x" sozinho não tem base suficiente para cálculo seguro.
    RETURN ARRAY[]::integer[];
  END IF;

  -- Ex.: "3 parcelas" sozinho não informa vencimento.
  IF v_len = 1 AND v_text ~ '[0-9]+\s*parcel' THEN
    RETURN ARRAY[]::integer[];
  END IF;

  -- Ex.: "30 dias" ou "15/30/45".
  RETURN v_nums;
END;
$$;

CREATE OR REPLACE FUNCTION public.aprovar_orcamento_financeiro(p_orcamento_id uuid)
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
    subtotal,
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
    round(
      coalesce(oi.quantidade, 0)
      * coalesce(oi.preco_unitario, 0)
      * (1 - coalesce(oi.desconto, 0) / 100),
      2
    ),
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
