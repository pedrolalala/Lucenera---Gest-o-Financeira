-- Budget Workflow: Transition from Client Approval to 'Aprovação Financeira'
-- After client approval (manual or public), budget status becomes 'Aprovação Financeira'
-- instead of 'aprovado', ensuring mandatory financial review before finalization.

-- ==========================================================
-- 1. Update handle_orcamento_workflow trigger function
--    Handle transition to 'Aprovação Financeira' from enviado_cliente
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
BEGIN
  v_old_status := COALESCE(OLD.status, '');

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

  -- When customer approves (transition to 'Aprovação Financeira' from enviado_cliente)
  IF (NEW.status = 'Aprovação Financeira' AND v_old_status = 'enviado_cliente') THEN
    NEW.requer_revisao_financeira := true;
    IF NEW.aprovado_cliente_em IS NULL THEN
      NEW.aprovado_cliente_em := now();
    END IF;
  END IF;

  -- When financial approval completes (transition to aprovado from 'Aprovação Financeira')
  IF (NEW.status = 'aprovado' AND v_old_status = 'Aprovação Financeira') THEN
    NEW.requer_revisao_financeira := false;
  END IF;

  -- Auto-transition from rascunho/aguardando_cliente to enviado_cliente
  -- when all mandatory data AND at least one item exist
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

DROP TRIGGER IF EXISTS trg_orcamento_workflow ON public.orcamentos;
CREATE TRIGGER trg_orcamento_workflow
  BEFORE INSERT OR UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_orcamento_workflow();

-- ==========================================================
-- 2. Update aprovar_orcamento_cliente
--    Transition to 'Aprovação Financeira' instead of 'aprovado'
-- ==========================================================
CREATE OR REPLACE FUNCTION public.aprovar_orcamento_cliente(p_orcamento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento public.orcamentos%ROWTYPE;
  v_status_anterior text;
  v_numero_orcamento text;
  v_user_role text;
BEGIN
  SELECT u.role INTO v_user_role
  FROM public.usuarios u
  WHERE u.id = auth.uid();

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado ou não autenticado.'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_user_role NOT IN ('admin', 'gerente', 'operador') THEN
    RAISE EXCEPTION 'Permissão negada. Apenas admin, gerente ou operador podem aprovar orçamentos do cliente. Role atual: %', v_user_role
      USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_orcamento
  FROM public.orcamentos
  WHERE id = p_orcamento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento % não encontrado.', p_orcamento_id
      USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_orcamento.status;
  v_numero_orcamento := coalesce(v_orcamento.numero, left(p_orcamento_id::text, 8));

  IF v_orcamento.status NOT IN ('enviado_cliente', 'recusado_cliente', 'aguardando_cliente', 'rascunho') THEN
    RAISE EXCEPTION 'Orçamento % não pode ser aprovado no status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orcamentos
  SET status = 'Aprovação Financeira',
      aprovado_cliente_em = now(),
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'Aprovação Financeira', auth.uid()::text, 'Aprovação do cliente finalizada — transição para Aprovação Financeira');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status_anterior', v_status_anterior,
    'status_novo', 'Aprovação Financeira',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente(uuid) TO authenticated;

-- ==========================================================
-- 3. Update aprovar_orcamento_cliente_publico
--    Transition to 'Aprovação Financeira' instead of 'aprovado'
-- ==========================================================
CREATE OR REPLACE FUNCTION public.aprovar_orcamento_cliente_publico(p_orcamento_id uuid, p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento public.orcamentos%ROWTYPE;
  v_status_anterior text;
  v_numero_orcamento text;
BEGIN
  SELECT * INTO v_orcamento FROM public.orcamentos WHERE id = p_orcamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado.' USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_orcamento.status;
  v_numero_orcamento := coalesce(v_orcamento.numero, left(p_orcamento_id::text, 8));

  IF v_orcamento.token_aprovacao_cliente IS NULL OR v_orcamento.token_aprovacao_cliente != p_token THEN
    RAISE EXCEPTION 'Token inválido ou expirado.' USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.status != 'enviado_cliente' THEN
    RAISE EXCEPTION 'Orçamento % não está aguardando aprovação do cliente. Status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orcamentos
  SET status = 'Aprovação Financeira',
      aprovado_cliente_em = now(),
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'Aprovação Financeira', null, 'Orçamento aprovado pelo cliente via link público');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'Aprovação Financeira',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente_publico(uuid, text) TO anon, authenticated;

-- ==========================================================
-- 4. Update aprovar_orcamento_cliente_manual
--    Transition to 'Aprovação Financeira' instead of 'aprovado'
-- ==========================================================
CREATE OR REPLACE FUNCTION public.aprovar_orcamento_cliente_manual(p_orcamento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento public.orcamentos%ROWTYPE;
  v_status_anterior text;
  v_numero_orcamento text;
  v_user_role text;
BEGIN
  SELECT u.role INTO v_user_role FROM public.usuarios u WHERE u.id = auth.uid();
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado ou não autenticado.' USING ERRCODE = 'P0001';
  END IF;
  IF v_user_role NOT IN ('admin', 'gerente', 'operador') THEN
    RAISE EXCEPTION 'Permissão negada.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_orcamento FROM public.orcamentos WHERE id = p_orcamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado.' USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_orcamento.status;
  v_numero_orcamento := coalesce(v_orcamento.numero, left(p_orcamento_id::text, 8));

  IF v_orcamento.status NOT IN ('enviado_cliente', 'recusado_cliente', 'aguardando_cliente', 'rascunho') THEN
    RAISE EXCEPTION 'Orçamento % não pode ser aprovado manualmente no status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orcamentos
  SET status = 'Aprovação Financeira',
      aprovado_cliente_em = now(),
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'Aprovação Financeira', auth.uid()::text, 'Aprovação manual do cliente pelo administrador');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'Aprovação Financeira',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente_manual(uuid) TO authenticated;

-- ==========================================================
-- 5. Update aprovar_orcamento_financeiro
--    Accept 'Aprovação Financeira' status and transition to 'aprovado' (final)
-- ==========================================================
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
  SELECT * INTO v_orcamento FROM public.orcamentos WHERE id = p_orcamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento % não encontrado.', p_orcamento_id USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_orcamento.status;
  v_numero_orcamento := coalesce(v_orcamento.numero, left(p_orcamento_id::text, 8));

  IF v_orcamento.projeto_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui projeto vinculado.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF v_orcamento.empresa_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui empresa vinculada.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF v_orcamento.cliente_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui cliente vinculado.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(v_orcamento.valor_total, 0) <= 0 THEN
    RAISE EXCEPTION 'Orçamento % possui valor total inválido.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  -- Accept 'Aprovação Financeira' status (client has approved, awaiting financial review)
  IF v_orcamento.status != 'Aprovação Financeira' THEN
    RAISE EXCEPTION 'Orçamento % não está em "Aprovação Financeira". Status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0001';
  END IF;

  -- Get client name
  SELECT COALESCE(nome, nome_empresa, 'Cliente') INTO v_cliente_nome
  FROM public.contatos WHERE id = v_orcamento.cliente_id;

  v_valor_total := coalesce(v_orcamento.valor_total, 0);

  -- Check if project items already exist
  SELECT count(*) INTO v_itens_existentes
  FROM public.projeto_itens WHERE projeto_id = v_orcamento.projeto_id;

  -- Create project items from orcamento_itens if none exist
  IF v_itens_existentes = 0 THEN
    INSERT INTO public.projeto_itens (projeto_id, produto_id, descricao, quantidade, preco_unitario, desconto, subtotal, validado, orcamento_id)
    SELECT
      v_orcamento.projeto_id,
      oi.produto_id,
      COALESCE(oi.descricao, p.nome),
      oi.quantidade,
      oi.preco_unitario,
      oi.desconto,
      (oi.quantidade * oi.preco_unitario) - coalesce(oi.desconto, 0),
      false,
      v_orcamento.id
    FROM public.orcamento_itens oi
    LEFT JOIN public.produtos p ON p.id = oi.produto_id
    WHERE oi.orcamento_id = p_orcamento_id;
    GET DIAGNOSTICS v_itens_criados = ROW_COUNT;
  END IF;

  -- Check if parcels already exist
  SELECT count(*) INTO v_parcelas_existentes
  FROM public.projeto_parcelas WHERE projeto_id = v_orcamento.projeto_id;

  -- Create parcels if none exist
  IF v_parcelas_existentes = 0 THEN
    v_prazos := coalesce(v_orcamento.prazo_pagamento_dias, ARRAY[0]);
    v_qtd_parcelas := array_length(v_prazos, 1);
    IF v_qtd_parcelas IS NULL OR v_qtd_parcelas = 0 THEN
      v_prazos := ARRAY[0];
      v_qtd_parcelas := 1;
    END IF;

    -- Determine base date for vencimento
    IF v_orcamento.data_base_vencimento = 'aprovacao' THEN
      v_data_base := coalesce(v_orcamento.aprovado_cliente_em, current_date)::date;
    ELSIF v_orcamento.data_base_vencimento = 'emissao' THEN
      v_data_base := coalesce(v_orcamento.data_emissao, current_date)::date;
    ELSE
      v_data_base := current_date;
    END IF;

    v_valor_base := v_valor_total;
    v_valor_acumulado := 0;

    FOR v_i IN 1..v_qtd_parcelas LOOP
      IF v_i = v_qtd_parcelas THEN
        v_valor_parcela := v_valor_base - v_valor_acumulado;
      ELSE
        v_valor_parcela := round(v_valor_base / v_qtd_parcelas, 2);
        v_valor_acumulado := v_valor_acumulado + v_valor_parcela;
      END IF;

      INSERT INTO public.projeto_parcelas (
        projeto_id, numero_parcela, valor, data_vencimento, status,
        forma_pagamento, orcamento_id, descricao
      ) VALUES (
        v_orcamento.projeto_id,
        v_i,
        v_valor_parcela,
        v_data_base + (v_prazos[v_i] || ' days')::interval,
        'pendente',
        v_orcamento.forma_pagamento,
        p_orcamento_id,
        'Parcela ' || v_i || '/' || v_qtd_parcelas || ' - ' || coalesce(v_numero_orcamento, 'Orçamento')
      );
    END LOOP;
    v_parcelas_criadas := v_qtd_parcelas;
  END IF;

  -- Update budget status to aprovado (final)
  UPDATE public.orcamentos
  SET status = 'aprovado',
      requer_revisao_financeira = false
  WHERE id = p_orcamento_id;

  -- Update project value
  UPDATE public.projetos
  SET valor_total = v_valor_total
  WHERE id = v_orcamento.projeto_id;

  -- Insert history
  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'aprovado', auth.uid()::text, 'Aprovação financeira concluída');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status_anterior', v_status_anterior,
    'status_novo', 'aprovado',
    'itens_criados', v_itens_criados,
    'parcelas_criadas', v_parcelas_criadas,
    'valor_total', v_valor_total,
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_financeiro(uuid) TO authenticated;
