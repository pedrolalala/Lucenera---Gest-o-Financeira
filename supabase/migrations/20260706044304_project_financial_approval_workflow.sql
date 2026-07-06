-- Project financial approval workflow: RPC, RLS, and audit support
-- Depends on: 20260706044303_add_project_financial_status_enum.sql (enum values must be committed)

-- ==========================================================
-- 1. RPC: aprovar_projeto_financeiro
--    Transitions a project from 'Aprovação Financeira' to 'Orçamento Aprovado'
--    Restricted to admin and gerente roles
-- ==========================================================
CREATE OR REPLACE FUNCTION public.aprovar_projeto_financeiro(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.projetos%ROWTYPE;
  v_user_role text;
  v_status_anterior text;
BEGIN
  SELECT u.role INTO v_user_role
  FROM public.usuarios u
  WHERE u.id = auth.uid();

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.' USING ERRCODE = 'P0001';
  END IF;

  IF v_user_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'Permissão negada. Apenas admin ou gerente podem aprovar projetos financeiramente. Role atual: %', v_user_role
      USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_project
  FROM public.projetos
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Projeto não encontrado.' USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_project.status::text;

  IF v_project.status::text != 'Aprovação Financeira' THEN
    RAISE EXCEPTION 'Projeto não está em "Aprovação Financeira". Status atual: %', v_status_anterior
      USING ERRCODE = 'P0001';
  END IF;

  IF v_project.codigo IS NULL OR btrim(v_project.codigo) = '' THEN
    RAISE EXCEPTION 'Código do projeto não existe ou é inválido. Aprovação requer código válido.'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.projetos
  SET status = 'Orçamento Aprovado'::projeto_status,
      updated_at = now()
  WHERE id = p_project_id;

  INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
  SELECT o.id, v_status_anterior, 'Orçamento Aprovado', auth.uid()::text, 'Projeto aprovado financeiramente'
  FROM public.orcamentos o
  WHERE o.projeto_id = p_project_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'status_anterior', v_status_anterior,
    'status_novo', 'Orçamento Aprovado',
    'sucesso', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_projeto_financeiro(uuid) TO authenticated;

-- ==========================================================
-- 2. RLS policies for authenticated role
--    Ensure authenticated users can SELECT from relevant tables
--    for the financial approval workflow joins and queries
-- ==========================================================
DROP POLICY IF EXISTS "authenticated_select_projetos_financial" ON public.projetos;
CREATE POLICY "authenticated_select_projetos_financial" ON public.projetos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_contatos_financial" ON public.contatos;
CREATE POLICY "authenticated_select_contatos_financial" ON public.contatos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_orcamentos_financial" ON public.orcamentos;
CREATE POLICY "authenticated_select_orcamentos_financial" ON public.orcamentos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_orcamento_itens_financial" ON public.orcamento_itens;
CREATE POLICY "authenticated_select_orcamento_itens_financial" ON public.orcamento_itens
  FOR SELECT TO authenticated USING (true);
