-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

-- Policies for orcamentos
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

-- Policies for orcamento_itens
DROP POLICY IF EXISTS "authenticated_select_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_select_orcamento_itens" ON public.orcamento_itens
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_insert_orcamento_itens" ON public.orcamento_itens
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_update_orcamento_itens" ON public.orcamento_itens
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "authenticated_delete_orcamento_itens" ON public.orcamento_itens
  FOR DELETE TO authenticated USING (true);
