-- Fix RLS for orcamentos
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orcamentos_select" ON public.orcamentos;
CREATE POLICY "orcamentos_select" ON public.orcamentos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "orcamentos_insert" ON public.orcamentos;
CREATE POLICY "orcamentos_insert" ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "orcamentos_update" ON public.orcamentos;
CREATE POLICY "orcamentos_update" ON public.orcamentos FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "orcamentos_delete" ON public.orcamentos;
CREATE POLICY "orcamentos_delete" ON public.orcamentos FOR DELETE TO authenticated USING (true);

-- Fix RLS for orcamento_itens
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orcamento_itens_select" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_select" ON public.orcamento_itens FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "orcamento_itens_insert" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_insert" ON public.orcamento_itens FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "orcamento_itens_update" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_update" ON public.orcamento_itens FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "orcamento_itens_delete" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_delete" ON public.orcamento_itens FOR DELETE TO authenticated USING (true);

-- Fix RLS for empresas (allow full CRUD for authenticated users as requested by story logic)
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresas_insert_auth" ON public.empresas;
CREATE POLICY "empresas_insert_auth" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "empresas_update_auth" ON public.empresas;
CREATE POLICY "empresas_update_auth" ON public.empresas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "empresas_delete_auth" ON public.empresas;
CREATE POLICY "empresas_delete_auth" ON public.empresas FOR DELETE TO authenticated USING (true);
