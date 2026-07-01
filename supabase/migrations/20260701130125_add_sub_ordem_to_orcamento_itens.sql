-- Add sub_ordem column for secondary ordering within the same circuit
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS sub_ordem integer DEFAULT 0;

-- Backfill sub_ordem based on insertion order within each (orcamento_id, circuit_number) group
DO $$
BEGIN
  WITH ranked_items AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          orcamento_id,
          CASE
            WHEN custom_id ~ '[0-9]' THEN NULLIF(regexp_replace(custom_id, '[^0-9]', '', 'g'), '')::integer
            ELSE 0
          END
        ORDER BY created_at, id
      ) - 1 AS new_sub_ordem
    FROM public.orcamento_itens
  )
  UPDATE public.orcamento_itens oi
  SET sub_ordem = ri.new_sub_ordem
  FROM ranked_items ri
  WHERE oi.id = ri.id;
END $$;

-- Composite index for efficient two-level ordering
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_ordem_sub
  ON public.orcamento_itens(ordem, sub_ordem);

-- Ensure RLS is enabled and policies exist for authenticated users
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orcamento_itens_select" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_select" ON public.orcamento_itens
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "orcamento_itens_insert" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_insert" ON public.orcamento_itens
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orcamento_itens_update" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_update" ON public.orcamento_itens
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "orcamento_itens_delete" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_delete" ON public.orcamento_itens
  FOR DELETE TO authenticated USING (true);
