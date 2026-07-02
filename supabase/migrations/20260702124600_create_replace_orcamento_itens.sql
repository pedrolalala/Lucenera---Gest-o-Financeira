-- Atomic replacement of orcamento_itens within a single DB transaction.
-- Prevents data loss when delete succeeds but insert fails.
CREATE OR REPLACE FUNCTION public.replace_orcamento_itens(
  p_orcamento_id uuid,
  p_items jsonb
) RETURNS integer AS $$
DECLARE
  inserted_count integer;
BEGIN
  -- Delete existing items for this budget
  DELETE FROM public.orcamento_itens WHERE orcamento_id = p_orcamento_id;

  -- Insert all new items atomically in the same transaction
  INSERT INTO public.orcamento_itens (
    orcamento_id,
    produto_id,
    quantidade,
    preco_unitario,
    desconto,
    custom_id,
    ordem,
    sub_ordem,
    item_pai_id
  )
  SELECT
    p_orcamento_id,
    CASE
      WHEN item->>'produto_id' IS NULL OR item->>'produto_id' = '' THEN NULL
      ELSE (item->>'produto_id')::uuid
    END,
    (item->>'quantidade')::numeric,
    (item->>'preco_unitario')::numeric,
    (item->>'desconto')::numeric,
    NULLIF(item->>'custom_id', ''),
    CASE
      WHEN item->>'ordem' IS NULL OR item->>'ordem' = '' THEN NULL
      ELSE (item->>'ordem')::integer
    END,
    CASE
      WHEN item->>'sub_ordem' IS NULL OR item->>'sub_ordem' = '' THEN NULL
      ELSE (item->>'sub_ordem')::integer
    END,
    CASE
      WHEN item->>'item_pai_id' IS NULL OR item->>'item_pai_id' = '' THEN NULL
      ELSE (item->>'item_pai_id')::uuid
    END
  FROM jsonb_array_elements(p_items) AS item
  WHERE item->>'produto_id' IS NOT NULL
    AND item->>'produto_id' != '';

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.replace_orcamento_itens(uuid, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.replace_orcamento_itens(uuid, jsonb) TO authenticated;
