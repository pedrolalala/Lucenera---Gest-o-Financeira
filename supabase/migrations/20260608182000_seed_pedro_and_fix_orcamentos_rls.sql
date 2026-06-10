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
  END IF;
END $$;

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
