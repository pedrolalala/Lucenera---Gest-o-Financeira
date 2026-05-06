DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user (idempotent: skip if email already exists)
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
      '{"nome": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'pedro@lucenera.com.br';
    
    INSERT INTO public.usuarios (id, email, nome, role, ativo)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;
