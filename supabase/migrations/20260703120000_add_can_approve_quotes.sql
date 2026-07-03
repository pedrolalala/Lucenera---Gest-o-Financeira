-- Add can_approve_quotes column to usuarios
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS can_approve_quotes boolean DEFAULT false;

-- Seed pedro@lucenera.com.br with can_approve_quotes = true
UPDATE public.usuarios
SET can_approve_quotes = true
WHERE email = 'pedro@lucenera.com.br';

-- Helper function to check if current user can approve quotes
CREATE OR REPLACE FUNCTION public.can_user_approve_quotes()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND coalesce(can_approve_quotes, false) = true
  );
END;
$$;

-- Audit trigger: log changes to can_approve_quotes in logs_auditoria
CREATE OR REPLACE FUNCTION public.log_can_approve_quotes_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.can_approve_quotes IS DISTINCT FROM OLD.can_approve_quotes THEN
    INSERT INTO public.logs_auditoria (
      tabela, operacao, registro_id, usuario_id,
      dados_anteriores, dados_novos, observacao
    )
    VALUES (
      'usuarios',
      'UPDATE',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'can_approve_quotes', OLD.can_approve_quotes,
        'nome', OLD.nome,
        'email', OLD.email
      ),
      jsonb_build_object(
        'can_approve_quotes', NEW.can_approve_quotes,
        'nome', NEW.nome,
        'email', NEW.email
      ),
      CASE
        WHEN NEW.can_approve_quotes THEN 'Permissao de aprovacao de orcamento concedida'
        ELSE 'Permissao de aprovacao de orcamento revogada'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_can_approve_quotes ON public.usuarios;
CREATE TRIGGER trg_log_can_approve_quotes
  AFTER UPDATE OF can_approve_quotes ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.log_can_approve_quotes_change();

-- RLS: allow authenticated users to read usuarios
DROP POLICY IF EXISTS "authenticated_select_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_select_usuarios" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

-- RLS: allow admins to update usuarios (for can_approve_quotes management)
DROP POLICY IF EXISTS "admin_update_usuarios" ON public.usuarios;
CREATE POLICY "admin_update_usuarios" ON public.usuarios
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION public.can_user_approve_quotes() TO authenticated;
