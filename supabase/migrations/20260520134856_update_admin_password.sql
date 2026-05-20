DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Seed user (idempotent: skip if email already exists, else update)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Caquidrose17', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"nome": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo)
    VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', ativo = true;
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'pedro@lucenera.com.br';
    
    UPDATE auth.users 
    SET encrypted_password = crypt('Caquidrose17', gen_salt('bf')),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, '')
    WHERE id = v_user_id;
    
    INSERT INTO public.usuarios (id, email, nome, role, ativo)
    VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', ativo = true;
  END IF;
END $$;
