DO $$
BEGIN
  DROP POLICY IF EXISTS "authenticated_insert_projetos" ON public.projetos;
END $$;

CREATE POLICY "authenticated_insert_projetos" ON public.projetos
  FOR INSERT TO authenticated WITH CHECK (true);
