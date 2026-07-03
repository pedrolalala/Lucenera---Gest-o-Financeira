-- Ensure logs_auditoria allows authenticated users to insert audit records
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_logs_auditoria" ON public.logs_auditoria;
CREATE POLICY "authenticated_insert_logs_auditoria" ON public.logs_auditoria
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_logs_auditoria" ON public.logs_auditoria;
CREATE POLICY "authenticated_select_logs_auditoria" ON public.logs_auditoria
  FOR SELECT TO authenticated USING (true);
