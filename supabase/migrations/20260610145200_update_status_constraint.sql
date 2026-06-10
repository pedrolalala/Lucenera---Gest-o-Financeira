DO $$
BEGIN
  -- Attempt to drop check constraint on status for orcamentos_revenda_ubiqua if it restricts values
  ALTER TABLE public.orcamentos_revenda_ubiqua DROP CONSTRAINT IF EXISTS orcamentos_revenda_ubiqua_status_check;
  ALTER TABLE public.orcamentos_revenda_ubiqua DROP CONSTRAINT IF EXISTS chk_status_orcamento;
  -- Do the same for the regular orcamentos table just to be safe
  ALTER TABLE public.orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;
END $$;
