-- Migration: Add "Client Approval" (Aprovação do Cliente) stage to budget workflow
-- New status: aguardando_cliente (waiting for client/contract finalization)
-- This stage sits between budget creation and financial approval

-- Change default status for new budgets to aguardando_cliente
ALTER TABLE public.orcamentos ALTER COLUMN status SET DEFAULT 'aguardando_cliente';

-- Create RPC function for client approval
-- Transitions budget from 'aguardando_cliente' to 'aguardando_aprovacao' with financial review flag
-- Only admin, gerente, or operador roles can execute
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
  -- RBAC check: only admin, gerente, or operador can approve
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

  -- Lock the budget row
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

  IF v_orcamento.status != 'aguardando_cliente' THEN
    RAISE EXCEPTION 'Orçamento % não está no status "aguardando_cliente". Status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0001';
  END IF;

  -- Transition to aguardando_aprovacao with financial review requirement
  UPDATE public.orcamentos
  SET status = 'aguardando_aprovacao',
      requer_revisao_financeira = true
  WHERE id = p_orcamento_id;

  -- Insert audit record into historico_status_orcamentos
  INSERT INTO public.historico_status_orcamentos (
    orcamento_id,
    status_anterior,
    status_novo,
    usuario,
    observacao
  )
  VALUES (
    p_orcamento_id,
    v_status_anterior,
    'aguardando_aprovacao',
    auth.uid()::text,
    'Aprovação do cliente finalizada — transição para aprovação financeira'
  );

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id,
    'status_anterior', v_status_anterior,
    'status_novo', 'aguardando_aprovacao',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_orcamento_cliente(uuid) TO authenticated;
