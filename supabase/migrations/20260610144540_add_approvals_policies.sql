-- Ensure RLS policies for orcamentos_revenda_ubiqua update
DROP POLICY IF EXISTS "authenticated_update_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "authenticated_update_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS policies for historico_status_orcamento insert
DROP POLICY IF EXISTS "authenticated_insert_historico_status_orcamento" ON public.historico_status_orcamento;
CREATE POLICY "authenticated_insert_historico_status_orcamento" ON public.historico_status_orcamento
  FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure RLS policies for historico_status_orcamento select
DROP POLICY IF EXISTS "authenticated_select_historico_status_orcamento" ON public.historico_status_orcamento;
CREATE POLICY "authenticated_select_historico_status_orcamento" ON public.historico_status_orcamento
  FOR SELECT TO authenticated USING (true);
