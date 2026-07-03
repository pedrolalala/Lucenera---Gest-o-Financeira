-- Ensure orcamento_itens allows null produto_id (already done in previous migration, double-check)
ALTER TABLE public.orcamento_itens ALTER COLUMN produto_id DROP NOT NULL;

-- Ensure RLS policies on orcamento_itens allow authenticated operations
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
