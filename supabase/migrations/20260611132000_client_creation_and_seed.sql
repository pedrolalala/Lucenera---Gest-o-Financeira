DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed test user if it doesn't exist
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
    
    INSERT INTO public.usuarios (id, email, nome, onboarding_completado, role)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', true, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Remove duplicate cpf_cnpj to apply unique constraint safely
  DELETE FROM public.contatos a USING public.contatos b
  WHERE a.id > b.id AND a.cpf_cnpj = b.cpf_cnpj AND a.cpf_cnpj IS NOT NULL;
END $$;

ALTER TABLE public.contatos DROP CONSTRAINT IF EXISTS uq_contatos_cpf_cnpj;
ALTER TABLE public.contatos ADD CONSTRAINT uq_contatos_cpf_cnpj UNIQUE (cpf_cnpj);

DROP POLICY IF EXISTS "authenticated_select" ON public.contatos;
CREATE POLICY "authenticated_select" ON public.contatos
  FOR SELECT TO authenticated USING (true);
  
DROP POLICY IF EXISTS "authenticated_insert" ON public.contatos;
CREATE POLICY "authenticated_insert" ON public.contatos
  FOR INSERT TO authenticated WITH CHECK (true);
  
DROP POLICY IF EXISTS "authenticated_update" ON public.contatos;
CREATE POLICY "authenticated_update" ON public.contatos
  FOR UPDATE TO authenticated USING (true);
  
DROP POLICY IF EXISTS "authenticated_delete" ON public.contatos;
CREATE POLICY "authenticated_delete" ON public.contatos
  FOR DELETE TO authenticated USING (true);
