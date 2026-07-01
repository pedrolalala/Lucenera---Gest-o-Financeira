-- Add ordem column to orcamento_itens for circuit-based ordering
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;

-- Backfill ordem from custom_id (circuit identifier, e.g. "L15" -> 15)
UPDATE public.orcamento_itens
SET ordem = CASE
  WHEN custom_id ~ '[0-9]' THEN
    NULLIF(regexp_replace(custom_id, '[^0-9]', '', 'g'), '')::integer
  ELSE 0
END
WHERE custom_id IS NOT NULL AND custom_id != '';

-- Index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_ordem ON public.orcamento_itens(ordem);
