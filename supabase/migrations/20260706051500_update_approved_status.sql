-- Normalize financially approved status to 'Orçamento Aprovado'
UPDATE public.orcamentos
SET status = 'Orçamento Aprovado'
WHERE status = 'aprovado_financeiro';

-- Create trigger to auto-normalize future statuses
CREATE OR REPLACE FUNCTION public.normalize_orcamento_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'aprovado_financeiro' THEN
    NEW.status := 'Orçamento Aprovado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_orcamento_status ON public.orcamentos;
CREATE TRIGGER trg_normalize_orcamento_status
  BEFORE INSERT OR UPDATE OF status ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.normalize_orcamento_status();
