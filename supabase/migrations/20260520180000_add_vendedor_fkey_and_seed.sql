DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user pedro@lucenera.com.br
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

    INSERT INTO public.usuarios (id, email, nome, role)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert priority employees if they don't exist
  INSERT INTO public.funcionarios (nome, email, status)
  VALUES 
    ('Marina Pousa Barbara Gregorio', 'marina@lucenera.com.br', 'Ativo'),
    ('Thairine Cristina da Silva', 'thairine@lucenera.com.br', 'Ativo'),
    ('Thais Gomes Pegrucci Favaron', 'thais@lucenera.com.br', 'Ativo'),
    ('Teresinha do Amaral Figueiredo', 'teresinha@lucenera.com.br', 'Ativo')
  ON CONFLICT (email) DO NOTHING;

  -- Clean up invalid vendedor_id references before adding constraint
  UPDATE public.orcamentos
  SET vendedor_id = NULL
  WHERE vendedor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.funcionarios WHERE id = orcamentos.vendedor_id
  );

END $$;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE public.orcamentos
  DROP CONSTRAINT IF EXISTS orcamentos_vendedor_id_fkey;

ALTER TABLE public.orcamentos
  ADD CONSTRAINT orcamentos_vendedor_id_fkey
  FOREIGN KEY (vendedor_id) REFERENCES public.funcionarios(id) ON DELETE SET NULL;
