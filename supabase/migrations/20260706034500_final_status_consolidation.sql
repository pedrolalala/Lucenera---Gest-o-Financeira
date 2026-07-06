-- Final consolidation of budget status workflow
-- Idempotent migration ensuring consistent status transitions
-- Fixes: boletos INSERT referencing non-existent projeto_id column

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================================
-- 1. Migrate legacy statuses (idempotent)
-- ==========================================================
UPDATE public.orcamentos SET status = 'enviado_cliente' WHERE status = 'aguardando_aprovacao';
UPDATE public.orcamentos SET status = 'enviado_cliente' WHERE status = 'aguardando_cliente';
UPDATE public.orcamentos SET status = 'aprovado' WHERE status = 'aprovado_cliente';

-- Ensure default status
ALTER TABLE public.orcamentos ALTER COLUMN status SET DEFAULT 'enviado_cliente';

-- ==========================================================
-- 2. Token helper (avoids gen_random_bytes in SECURITY DEFINER)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.gen_token_hex()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
$$;

-- ==========================================================
-- 3. handle_orcamento_workflow trigger function
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

  -- When customer approves (transition to aprovado from enviado_cliente), set financial review flag
  IF (NEW.status = 'aprovado' AND v_old_status = 'enviado_cliente') THEN
    NEW.requer_revisao_financeira := true;
    IF NEW.aprovado_cliente_em IS NULL THEN
      NEW.aprovado_cliente_em := now();
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

DROP TRIGGER IF EXISTS trg_orcamento_workflow ON public.orcamentos;
CREATE TRIGGER trg_orcamento_workflow
  BEFORE INSERT OR UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_orcamento_workflow();

-- ==========================================================
-- 4. handle_orcamento_item_workflow trigger function
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_orcamento_item_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_empresa_id uuid;
  v_projeto_id uuid;
  v_cliente_id uuid;
  v_forma_pagamento public.pagamento_forma;
BEGIN
  SELECT status, empresa_id, projeto_id, cliente_id, forma_pagamento
    INTO v_status, v_empresa_id, v_projeto_id, v_cliente_id, v_forma_pagamento
  FROM public.orcamentos
  WHERE id = NEW.orcamento_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF (v_status IN ('rascunho', 'aguardando_cliente') OR v_status IS NULL) THEN
    IF v_empresa_id IS NOT NULL
       AND v_projeto_id IS NOT NULL
       AND v_cliente_id IS NOT NULL
       AND v_forma_pagamento IS NOT NULL THEN
      UPDATE public.orcamentos
      SET status = 'enviado_cliente',
          token_aprovacao_cliente = COALESCE(token_aprovacao_cliente, public.gen_token_hex()),
          enviado_cliente_em = COALESCE(enviado_cliente_em, now()),
          enviado_cliente_por = COALESCE(enviado_cliente_por, auth.uid())
      WHERE id = NEW.orcamento_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orcamento_item_workflow ON public.orcamento_itens;
CREATE TRIGGER trg_orcamento_item_workflow
  AFTER INSERT ON public.orcamento_itens
  FOR EACH ROW EXECUTE FUNCTION public.handle_orcamento_item_workflow();

-- ==========================================================
-- 5. aprovar_orcamento_cliente (internal, role-based)
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
  SET status = 'aprovado',
      aprovado_cliente_em = now(),
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'aprovado', auth.uid()::text, 'Aprovação do cliente finalizada — transição para aprovado');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status_anterior', v_status_anterior,
    'status_novo', 'aprovado',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente(uuid) TO authenticated;

-- ==========================================================
-- 6. aprovar_orcamento_cliente_publico
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
  SET status = 'aprovado',
      aprovado_cliente_em = now(),
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'aprovado', null, 'Orçamento aprovado pelo cliente via link público');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'aprovado',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente_publico(uuid, text) TO anon, authenticated;

-- ==========================================================
-- 7. aprovar_orcamento_cliente_manual
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
  SET status = 'aprovado',
      aprovado_cliente_em = now(),
      requer_revisao_financeira = true,
      token_aprovacao_cliente = null
  WHERE id = p_orcamento_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  VALUES (p_orcamento_id, v_status_anterior, 'aprovado', auth.uid()::text, 'Aprovação manual do cliente pelo administrador');

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status', 'aprovado',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente_manual(uuid) TO authenticated;

-- ==========================================================
-- 8. aprovar_orcamento_financeiro
--    Accepts status 'aprovado' (not aprovado_cliente)
--    FIX: removed projeto_id from boletos INSERT (column does not exist)
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
    UPDATE public.orcamentos SET status = 'aprovado' WHERE id = p_orcamento_id;
    RETURN jsonb_build_object(
      'orcamento_id', p_orcamento_id, 'status', 'aprovado', 'projeto_id', v_orcamento.projeto_id,
      'projeto_itens_criados', 0, 'parcelas_criadas', 0, 'boletos_criados', 0,
      'nota_fiscal_status', 'pendente_api', 'ja_processado', true
    );
  END IF;

  IF v_itens_existentes > 0 OR v_parcelas_existentes > 0 OR v_boletos_existentes > 0 THEN
    RAISE EXCEPTION 'Orçamento % possui processamento parcial inconsistente: itens %, parcelas %, boletos %.',
      v_numero_orcamento, v_itens_existentes, v_parcelas_existentes, v_boletos_existentes USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.status != 'aprovado' THEN
    RAISE EXCEPTION 'Orçamento % não está no status "aprovado". Status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.orcamentos SET status = 'aprovado' WHERE id = p_orcamento_id;

  BEGIN
    INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
    VALUES (p_orcamento_id, v_status_anterior, 'aprovado', auth.uid()::text, 'Aprovação financeira — processamento de itens, parcelas e boletos');
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

  -- FIX: projeto_id removed from INSERT — column does not exist on boletos table
  INSERT INTO public.boletos (nosso_numero, numero_documento, parcela_id, orcamento_id, empresa_id, valor, vencimento, nome_pagador, status, tipo, venda, num_parcela, total_parcelas, emissao)
  SELECT 'ORC-' || regexp_replace(v_numero_orcamento, '[^a-zA-Z0-9]', '', 'g') || '-P' || pp.numero_parcela,
    v_numero_orcamento || '-P' || pp.numero_parcela, pp.id, p_orcamento_id, v_orcamento.empresa_id,
    pp.valor, pp.data_vencimento, coalesce(v_cliente_nome, 'Cliente do orçamento'), 'pendente_registro', 'Nota Fiscal', NULL,
    pp.numero_parcela, v_qtd_parcelas, current_date
  FROM public.projeto_parcelas pp WHERE pp.orcamento_id = p_orcamento_id
  ON CONFLICT (nosso_numero) DO NOTHING;
  GET DIAGNOSTICS v_boletos_criados = ROW_COUNT;

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id, 'status', 'aprovado', 'projeto_id', v_orcamento.projeto_id,
    'projeto_itens_criados', v_itens_criados, 'parcelas_criadas', v_parcelas_criadas, 'boletos_criados', v_boletos_criados,
    'nota_fiscal_status', 'pendente_api', 'ja_processado', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_financeiro(uuid) TO authenticated;

-- ==========================================================
-- 9. RLS policy for anon access to orcamentos by token
-- ==========================================================
DROP POLICY IF EXISTS "anon_can_read_orcamento_by_token" ON public.orcamentos;
CREATE POLICY "anon_can_read_orcamento_by_token" ON public.orcamentos
  FOR SELECT TO anon, authenticated
  USING (token_aprovacao_cliente IS NOT NULL);

-- ==========================================================
-- 10. Seed admin user (idempotent)
-- ==========================================================
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo, onboarding_completado)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true, true)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      phone = NULL,
      updated_at = NOW()
    WHERE email = 'pedro@lucenera.com.br';

    UPDATE public.usuarios
    SET role = 'admin', ativo = true, onboarding_completado = true
    WHERE email = 'pedro@lucenera.com.br';

    INSERT INTO public.usuarios (id, email, nome, role, ativo, onboarding_completado)
    SELECT id, email, 'Pedro', 'admin', true, true
    FROM auth.users
    WHERE email = 'pedro@lucenera.com.br'
      AND NOT EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.users.id
      );
  END IF;
END $$;
