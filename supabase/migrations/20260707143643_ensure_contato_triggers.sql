CREATE OR REPLACE FUNCTION public.handle_contato_tipo()
RETURNS trigger AS $$
BEGIN
  IF NEW.tipo IS NOT NULL THEN
    INSERT INTO public.contato_tipos (contato_id, tipo)
    VALUES (NEW.id, NEW.tipo)
    ON CONFLICT (contato_id, tipo) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.on_contato_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.logs_auditoria (tabela, operacao, registro_id, dados_novos, usuario_id)
  VALUES ('contatos', 'INSERT', NEW.id, to_jsonb(NEW), NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_contato_tipo
  AFTER INSERT ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.handle_contato_tipo();

CREATE OR REPLACE TRIGGER trg_contato_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_contato_created_audit
  AFTER INSERT ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.on_contato_created();

ALTER TABLE public.contato_tipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_contato_tipos" ON public.contato_tipos;
CREATE POLICY "authenticated_select_contato_tipos" ON public.contato_tipos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_contato_tipos" ON public.contato_tipos;
CREATE POLICY "authenticated_insert_contato_tipos" ON public.contato_tipos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_contato_tipos" ON public.contato_tipos;
CREATE POLICY "authenticated_delete_contato_tipos" ON public.contato_tipos
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_logs_auditoria" ON public.logs_auditoria;
CREATE POLICY "authenticated_select_logs_auditoria" ON public.logs_auditoria
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_logs_auditoria" ON public.logs_auditoria;
CREATE POLICY "authenticated_insert_logs_auditoria" ON public.logs_auditoria
  FOR INSERT TO authenticated WITH CHECK (true);
