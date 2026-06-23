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
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "authenticated_select_produtos" ON public.produtos;
CREATE POLICY "authenticated_select_produtos" ON public.produtos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_projetos" ON public.projetos;
CREATE POLICY "authenticated_select_projetos" ON public.projetos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_contatos" ON public.contatos;
CREATE POLICY "authenticated_select_contatos" ON public.contatos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_select_usuarios" ON public.usuarios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_empresas" ON public.empresas;
CREATE POLICY "authenticated_select_empresas" ON public.empresas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_revenda" ON public.revenda_ubiqua;
CREATE POLICY "authenticated_select_revenda" ON public.revenda_ubiqua FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_funcionarios" ON public.funcionarios;
CREATE POLICY "authenticated_select_funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (true);
