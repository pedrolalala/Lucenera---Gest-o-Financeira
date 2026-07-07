-- CORRECTION: reverte a renomeacao de status feita nas migracoes anteriores
-- (20260707150000/160000/161500). Descobri, apos aplica-las, que ja existia um
-- contrato oficial JA TESTADO E IMPLANTADO em producao (SPEC-016, repo central
-- Lucenera - ADAPTA PASS, aplicado em 2026-07-06):
--   enviado_cliente -> 'Aprovação Financeira' -> 'Orçamento Aprovado'
-- As strings em portugues NAO eram lixo legado: eram o contrato oficial.
-- Esta migracao reverte para essas strings, mantendo as funcionalidades novas
-- pedidas nesta sessao (aprovado_cliente_origem, reset ao editar apos
-- aprovacao, bypass para a tela de Aprovacao Financeira).

-- ==========================================================
-- 1. Whitelist de status: contrato oficial da SPEC-016 + legado + 'expirado'
--    (adicao nova desta sessao, sem conflito com a SPEC-016). Precisa vir
--    ANTES do UPDATE abaixo, porque a constraint antiga (das migrations
--    anteriores desta sessao, so aceitava snake_case) ainda estaria ativa
--    e bloquearia o proprio UPDATE de reversao.
-- ==========================================================
ALTER TABLE public.orcamentos
  DROP CONSTRAINT IF EXISTS orcamentos_status_check;
ALTER TABLE public.orcamentos
  ADD CONSTRAINT orcamentos_status_check
  CHECK (status IN (
    'rascunho',
    'aguardando_aprovacao',
    'enviado_cliente',
    'recusado_cliente',
    'expirado',
    'cancelado',
    'Aprovação Financeira',
    'Orçamento Aprovado',
    -- legado, conforme SPEC-016 (nao sao mais destino de novas transicoes)
    'aprovado_cliente',
    'aprovado',
    'aprovado_financeiro',
    -- legado desta sessao (migrations 150000/160000/161500, sendo revertidas
    -- pelo UPDATE abaixo; mantido na whitelist so para nao quebrar a ordem
    -- ADD CONSTRAINT -> UPDATE dentro desta mesma transacao)
    'pendente_aprovacao_financeira'
  ));

-- ==========================================================
-- 2. Reverter dados normalizados incorretamente
-- ==========================================================
UPDATE public.orcamentos
SET status = 'Aprovação Financeira'
WHERE status = 'pendente_aprovacao_financeira';

UPDATE public.orcamentos
SET status = 'Orçamento Aprovado'
WHERE status = 'aprovado';

-- ==========================================================
-- 3. aprovar_orcamento_cliente (interno, role-based) -> 'Aprovação Financeira'
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
      aprovado_cliente_origem = 'manual',
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'Aprovação Financeira', auth.uid()::text, 'Aprovação do cliente finalizada — aguardando aprovação financeira');

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
-- 4. aprovar_orcamento_cliente_publico (token do cliente) -> 'Aprovação Financeira'
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
      aprovado_cliente_origem = 'token',
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'Aprovação Financeira', null, 'Orçamento aprovado pelo cliente via link público — aguardando aprovação financeira');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'Aprovação Financeira',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente_publico(uuid, text) TO anon, authenticated;

-- ==========================================================
-- 5. aprovar_orcamento_cliente_manual (vendedor aprova em nome do cliente)
--    Mantem o endurecimento SPEC-ORC-05 (valida frete/forma pagamento/prazo)
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
  v_prazos integer[];
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

  IF v_orcamento.frete_tipo IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui condição de frete definida.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF v_orcamento.forma_pagamento IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui forma de pagamento estruturada.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(v_orcamento.valor_total, 0) <= 0 THEN
    RAISE EXCEPTION 'Orçamento % possui valor total inválido.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.orcamento_itens oi
    WHERE oi.orcamento_id = p_orcamento_id AND oi.produto_id IS NULL AND coalesce(oi.preco_unitario, 0) <= 0
  ) THEN
    RAISE EXCEPTION 'Orçamento % possui item especial sem preço definido.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  v_prazos := public._lucenera_parse_prazo_pagamento(v_orcamento.condicoes_pagamento, v_orcamento.prazo_pagamento_dias);
  IF coalesce(array_length(v_prazos, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Orçamento % não possui prazo de pagamento interpretável.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orcamentos
  SET status = 'Aprovação Financeira',
      aprovado_cliente_em = now(),
      aprovado_cliente_origem = 'manual',
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'Aprovação Financeira', auth.uid()::text, 'Aprovação manual do cliente pelo administrador — aguardando aprovação financeira');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'Aprovação Financeira',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente_manual(uuid) TO authenticated;

-- ==========================================================
-- 6. aprovar_orcamento_financeiro: exige 'Aprovação Financeira', finaliza em
--    'Orçamento Aprovado' (contrato oficial SPEC-016)
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
  IF v_orcamento.forma_pagamento IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui forma de pagamento estruturada.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orcamento_itens oi WHERE oi.orcamento_id = p_orcamento_id) THEN
    RAISE EXCEPTION 'Orçamento % não possui itens.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.orcamento_itens oi
    WHERE oi.orcamento_id = p_orcamento_id AND (coalesce(oi.quantidade, 0) <= 0 OR coalesce(oi.preco_unitario, 0) <= 0)
  ) THEN
    RAISE EXCEPTION 'Orçamento % possui item sem quantidade ou preço válido.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  v_prazos := public._lucenera_parse_prazo_pagamento(v_orcamento.condicoes_pagamento, v_orcamento.prazo_pagamento_dias);
  v_qtd_parcelas := coalesce(array_length(v_prazos, 1), 0);
  IF v_qtd_parcelas = 0 THEN
    RAISE EXCEPTION 'Orçamento % não possui prazo de pagamento interpretável.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  SELECT nome INTO v_cliente_nome FROM public.contatos WHERE id = v_orcamento.cliente_id;

  SELECT count(*) INTO v_itens_existentes FROM public.projeto_itens WHERE orcamento_id = p_orcamento_id;
  SELECT count(*) INTO v_parcelas_existentes FROM public.projeto_parcelas WHERE orcamento_id = p_orcamento_id;
  SELECT count(*) INTO v_boletos_existentes FROM public.boletos WHERE orcamento_id = p_orcamento_id;

  IF v_itens_existentes > 0 AND v_parcelas_existentes = v_qtd_parcelas AND v_boletos_existentes = v_qtd_parcelas THEN
    UPDATE public.orcamentos SET status = 'Orçamento Aprovado' WHERE id = p_orcamento_id;
    RETURN jsonb_build_object(
      'orcamento_id', p_orcamento_id, 'status', 'Orçamento Aprovado', 'projeto_id', v_orcamento.projeto_id,
      'projeto_itens_criados', 0, 'parcelas_criadas', 0, 'boletos_criados', 0,
      'nota_fiscal_status', 'pendente_api', 'ja_processado', true
    );
  END IF;

  IF v_itens_existentes > 0 OR v_parcelas_existentes > 0 OR v_boletos_existentes > 0 THEN
    RAISE EXCEPTION 'Orçamento % possui processamento parcial inconsistente: itens %, parcelas %, boletos %.',
      v_numero_orcamento, v_itens_existentes, v_parcelas_existentes, v_boletos_existentes USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.status != 'Aprovação Financeira' THEN
    RAISE EXCEPTION 'Orçamento % não está aguardando aprovação financeira. Status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.orcamentos SET status = 'Orçamento Aprovado', requer_revisao_financeira = false WHERE id = p_orcamento_id;

  BEGIN
    INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
    VALUES (p_orcamento_id, v_status_anterior, 'Orçamento Aprovado', auth.uid()::text, 'Aprovação financeira — processamento de itens, parcelas e boletos');
  EXCEPTION
    WHEN undefined_table OR undefined_column OR foreign_key_violation THEN
      NULL;
  END;

  INSERT INTO public.projeto_itens (projeto_id, produto_id, descricao, quantidade, preco_unitario, desconto, subtotal, validado, orcamento_id)
  SELECT v_orcamento.projeto_id, oi.produto_id, coalesce(oi.descricao, oi.custom_id, p.nome, 'Item do Orçamento'),
    coalesce(oi.quantidade, 0), coalesce(oi.preco_unitario, 0), coalesce(oi.desconto, 0),
    round(coalesce(oi.quantidade, 0) * coalesce(oi.preco_unitario, 0) * (1 - coalesce(oi.desconto, 0) / 100), 2),
    true, p_orcamento_id
  FROM public.orcamento_itens oi LEFT JOIN public.produtos p ON p.id = oi.produto_id
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
    INSERT INTO public.projeto_parcelas (projeto_id, numero_parcela, valor, data_fechamento, data_vencimento, status, forma_pagamento, orcamento_id, descricao)
    VALUES (v_orcamento.projeto_id, v_i, v_valor_parcela, current_date, v_data_base + v_prazos[v_i], 'pendente', v_orcamento.forma_pagamento, p_orcamento_id, 'Parcela gerada pelo orçamento ' || v_numero_orcamento);
    v_parcelas_criadas := v_parcelas_criadas + 1;
  END LOOP;

  INSERT INTO public.boletos (nosso_numero, numero_documento, parcela_id, orcamento_id, empresa_id, valor, vencimento, nome_pagador, status, tipo, venda, num_parcela, total_parcelas, emissao)
  SELECT 'ORC-' || regexp_replace(v_numero_orcamento, '[^a-zA-Z0-9]', '', 'g') || '-P' || pp.numero_parcela,
    v_numero_orcamento || '-P' || pp.numero_parcela, pp.id, p_orcamento_id, v_orcamento.empresa_id,
    pp.valor, pp.data_vencimento, coalesce(v_cliente_nome, 'Cliente do orçamento'), 'pendente_registro', 'Nota Fiscal', NULL,
    pp.numero_parcela, v_qtd_parcelas, current_date
  FROM public.projeto_parcelas pp WHERE pp.orcamento_id = p_orcamento_id
  ON CONFLICT (nosso_numero) DO NOTHING;
  GET DIAGNOSTICS v_boletos_criados = ROW_COUNT;

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id, 'status', 'Orçamento Aprovado', 'projeto_id', v_orcamento.projeto_id,
    'projeto_itens_criados', v_itens_criados, 'parcelas_criadas', v_parcelas_criadas, 'boletos_criados', v_boletos_criados,
    'nota_fiscal_status', 'pendente_api', 'ja_processado', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_financeiro(uuid) TO authenticated;

-- ==========================================================
-- 7. Trigger de reset ao editar (contra os valores oficiais SPEC-016)
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

  IF (
    TG_OP = 'UPDATE'
    AND NOT v_skip_reset
    AND v_old_status IN ('Aprovação Financeira', 'Orçamento Aprovado')
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
    AND v_old_status IN ('Aprovação Financeira', 'Orçamento Aprovado')
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

  IF (NEW.status = 'enviado_cliente' AND NEW.token_aprovacao_cliente IS NULL) THEN
    NEW.token_aprovacao_cliente := public.gen_token_hex();
    IF NEW.enviado_cliente_em IS NULL THEN
      NEW.enviado_cliente_em := now();
    END IF;
    IF NEW.enviado_cliente_por IS NULL THEN
      NEW.enviado_cliente_por := auth.uid();
    END IF;
  END IF;

  IF (NEW.status IN ('rascunho', 'aguardando_cliente', 'aguardando_aprovacao') OR NEW.status IS NULL) THEN
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

  IF v_status IN ('Aprovação Financeira', 'Orçamento Aprovado') AND NOT v_skip_reset THEN
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
-- 8. financeiro_editar_orcamento: guard contra os valores oficiais SPEC-016
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

  IF v_status NOT IN ('Aprovação Financeira', 'Orçamento Aprovado') THEN
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

-- ==========================================================
-- 9. RPCs publicas que o frontend (ClientApproval.tsx) ja chamava mas NUNCA
--    existiram no banco (achado ao investigar o "Link Inválido" reportado
--    agora, nao introduzido por esta sessao — confirmado por consulta direta
--    a pg_proc antes desta migracao).
-- ==========================================================
CREATE OR REPLACE FUNCTION public.buscar_orcamento_para_aprovacao(p_orcamento_id uuid, p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento public.orcamentos%ROWTYPE;
  v_cliente_nome text;
BEGIN
  SELECT * INTO v_orcamento FROM public.orcamentos WHERE id = p_orcamento_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado.' USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.status NOT IN ('recusado_cliente', 'Aprovação Financeira', 'Orçamento Aprovado')
     AND (v_orcamento.token_aprovacao_cliente IS NULL OR v_orcamento.token_aprovacao_cliente != p_token) THEN
    RAISE EXCEPTION 'Token inválido ou expirado.' USING ERRCODE = 'P0001';
  END IF;

  SELECT nome INTO v_cliente_nome FROM public.contatos WHERE id = v_orcamento.cliente_id;

  RETURN jsonb_build_object(
    'orcamento_id', v_orcamento.id,
    'numero', v_orcamento.numero,
    'valor_total', v_orcamento.valor_total,
    'data_emissao', v_orcamento.data_emissao,
    'cliente_nome', v_cliente_nome,
    'status', v_orcamento.status,
    'condicoes_pagamento', v_orcamento.condicoes_pagamento,
    'forma_pagamento', v_orcamento.forma_pagamento
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_orcamento_para_aprovacao(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.recusar_orcamento_cliente_publico(p_orcamento_id uuid, p_token text, p_motivo text DEFAULT NULL)
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
  SET status = 'recusado_cliente',
      recusado_cliente_em = now(),
      motivo_recusa_cliente = p_motivo,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'recusado_cliente', null, coalesce('Recusado pelo cliente via link público: ' || p_motivo, 'Recusado pelo cliente via link público'));

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'recusado_cliente',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.recusar_orcamento_cliente_publico(uuid, text, text) TO anon, authenticated;

-- Forca o PostgREST a recarregar o cache de schema (novas funcoes ficam
-- invisiveis via API ate esse reload).
NOTIFY pgrst, 'reload schema';
