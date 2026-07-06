-- Auto-status workflow: default to 'rascunho' so triggers can handle transition
-- Budgets without all mandatory fields stay as draft; complete budgets auto-transition to 'enviado_cliente'

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure gen_token_hex helper exists
CREATE OR REPLACE FUNCTION public.gen_token_hex()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
$$;

-- 2. Change default status to 'rascunho' (draft)
ALTER TABLE public.orcamentos ALTER COLUMN status SET DEFAULT 'rascunho';

-- 3. Revert incomplete 'enviado_cliente' budgets to 'rascunho'
--    Only those without a token (never properly sent to client)
UPDATE public.orcamentos
SET status = 'rascunho'
WHERE status = 'enviado_cliente'
  AND token_aprovacao_cliente IS NULL
  AND (
    empresa_id IS NULL
    OR projeto_id IS NULL
    OR cliente_id IS NULL
    OR forma_pagamento IS NULL
  );

-- 4. Update trigger: add INSERT safety check
--    On INSERT, if status is 'enviado_cliente' but mandatory fields are missing, revert to 'rascunho'
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

  -- On INSERT: if status is 'enviado_cliente' but mandatory fields are missing, revert to 'rascunho'
  IF (TG_OP = 'INSERT' AND NEW.status = 'enviado_cliente') THEN
    IF (NEW.empresa_id IS NULL
        OR NEW.projeto_id IS NULL
        OR NEW.cliente_id IS NULL
        OR NEW.forma_pagamento IS NULL) THEN
      NEW.status := 'rascunho';
    END IF;
  END IF;

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

-- 5. Ensure seed user exists (idempotent)
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
  END IF;
END $$;
