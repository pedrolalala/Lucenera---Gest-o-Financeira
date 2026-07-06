-- Automatic Budget Workflow Pipeline
-- 1. Auto-transition budgets to 'enviado_cliente' when all mandatory data + items are present
-- 2. Auto-generate approval token when status becomes 'enviado_cliente'
-- 3. Set requer_revisao_financeira = true when customer approves (status -> 'aprovado_cliente')

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Trigger function for orcamentos: handle status transitions and token generation
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
    NEW.token_aprovacao_cliente := encode(gen_random_bytes(32), 'hex');
    IF NEW.enviado_cliente_em IS NULL THEN
      NEW.enviado_cliente_em := now();
    END IF;
    IF NEW.enviado_cliente_por IS NULL THEN
      NEW.enviado_cliente_por := auth.uid();
    END IF;
  END IF;

  -- When customer approves, set financial review flag
  IF (NEW.status = 'aprovado_cliente' AND v_old_status != 'aprovado_cliente') THEN
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
        NEW.token_aprovacao_cliente := encode(gen_random_bytes(32), 'hex');
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

-- Trigger function for orcamento_itens: transition parent budget when first item is added
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

  -- If budget is in draft/awaiting and now has all mandatory data, transition
  IF (v_status IN ('rascunho', 'aguardando_cliente') OR v_status IS NULL) THEN
    IF v_empresa_id IS NOT NULL
       AND v_projeto_id IS NOT NULL
       AND v_cliente_id IS NOT NULL
       AND v_forma_pagamento IS NOT NULL THEN
      UPDATE public.orcamentos
      SET status = 'enviado_cliente',
          token_aprovacao_cliente = COALESCE(token_aprovacao_cliente, encode(gen_random_bytes(32), 'hex')),
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
