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

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_status_orcamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_select_usuarios" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_insert_usuarios" ON public.usuarios
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_update_usuarios" ON public.usuarios
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_delete_usuarios" ON public.usuarios
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_orcamentos" ON public.orcamentos;
CREATE POLICY "authenticated_select_orcamentos" ON public.orcamentos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_orcamentos" ON public.orcamentos;
CREATE POLICY "authenticated_insert_orcamentos" ON public.orcamentos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_orcamentos" ON public.orcamentos;
CREATE POLICY "authenticated_update_orcamentos" ON public.orcamentos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_orcamentos" ON public.orcamentos;
CREATE POLICY "authenticated_delete_orcamentos" ON public.orcamentos
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_select_orcamento_itens" ON public.orcamento_itens
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_insert_orcamento_itens" ON public.orcamento_itens
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_update_orcamento_itens" ON public.orcamento_itens
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_delete_orcamento_itens" ON public.orcamento_itens
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_transacoes" ON public.transacoes;
CREATE POLICY "authenticated_select_transacoes" ON public.transacoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_transacoes" ON public.transacoes;
CREATE POLICY "authenticated_insert_transacoes" ON public.transacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_transacoes" ON public.transacoes;
CREATE POLICY "authenticated_update_transacoes" ON public.transacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_transacoes" ON public.transacoes;
CREATE POLICY "authenticated_delete_transacoes" ON public.transacoes
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "authenticated_select_categorias_financeiras" ON public.categorias_financeiras
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "authenticated_insert_categorias_financeiras" ON public.categorias_financeiras
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_categorias_financeiras" ON public.categorias_financeiras;
CREATE POLICY "authenticated_update_categorias_financeiras" ON public.categorias_financeiras
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "authenticated_select_contas_bancarias" ON public.contas_bancarias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "authenticated_insert_contas_bancarias" ON public.contas_bancarias
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "authenticated_update_contas_bancarias" ON public.contas_bancarias
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_projetos" ON public.projetos;
CREATE POLICY "authenticated_select_projetos" ON public.projetos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projetos" ON public.projetos;
CREATE POLICY "authenticated_insert_projetos" ON public.projetos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_projetos" ON public.projetos;
CREATE POLICY "authenticated_update_projetos" ON public.projetos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_projeto_parcelas" ON public.projeto_parcelas;
CREATE POLICY "authenticated_select_projeto_parcelas" ON public.projeto_parcelas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projeto_parcelas" ON public.projeto_parcelas;
CREATE POLICY "authenticated_insert_projeto_parcelas" ON public.projeto_parcelas
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_projeto_parcelas" ON public.projeto_parcelas;
CREATE POLICY "authenticated_update_projeto_parcelas" ON public.projeto_parcelas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_historico_status_orcamentos" ON public.historico_status_orcamentos;
CREATE POLICY "authenticated_select_historico_status_orcamentos" ON public.historico_status_orcamentos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_historico_status_orcamentos" ON public.historico_status_orcamentos;
CREATE POLICY "authenticated_insert_historico_status_orcamentos" ON public.historico_status_orcamentos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_historico_status_orcamentos" ON public.historico_status_orcamentos;
CREATE POLICY "authenticated_update_historico_status_orcamentos" ON public.historico_status_orcamentos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
