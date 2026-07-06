-- Auto-sync contact type to 'cliente' when a budget is created or updated with a cliente_id
-- This ensures data integrity: any contact linked to a budget is classified as a customer
-- Runs in the same transaction as the budget INSERT/UPDATE (AFTER trigger)

CREATE OR REPLACE FUNCTION public.sync_contact_type_on_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cliente_id IS NOT NULL THEN
    -- Update the tipo column on contatos to 'cliente'
    UPDATE public.contatos
    SET tipo = 'cliente'
    WHERE id = NEW.cliente_id
      AND tipo IS DISTINCT FROM 'cliente'::public.contato_tipo;

    -- Also ensure the contato_tipos junction table has the 'cliente' entry
    INSERT INTO public.contato_tipos (contato_id, tipo)
    VALUES (NEW.cliente_id, 'cliente')
    ON CONFLICT (contato_id, tipo) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_contact_type_on_budget ON public.orcamentos;
CREATE TRIGGER trg_sync_contact_type_on_budget
  AFTER INSERT OR UPDATE OF cliente_id ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.sync_contact_type_on_budget();
