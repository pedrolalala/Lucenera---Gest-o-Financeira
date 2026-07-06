-- Update replace_orcamento_itens to include peca_nova column for full parity
CREATE OR REPLACE FUNCTION public.replace_orcamento_itens(
  p_orcamento_id uuid,
  p_items jsonb
) RETURNS integer AS $$
DECLARE
  inserted_count integer;
BEGIN
  DELETE FROM public.orcamento_itens WHERE orcamento_id = p_orcamento_id;

  INSERT INTO public.orcamento_itens (
    orcamento_id,
    produto_id,
    descricao,
    quantidade,
    preco_unitario,
    desconto,
    custom_id,
    ordem,
    sub_ordem,
    item_pai_id,
    peca_nova
  )
  SELECT
    p_orcamento_id,
    CASE
      WHEN item->>'produto_id' IS NULL OR item->>'produto_id' = '' THEN NULL
      ELSE (item->>'produto_id')::uuid
    END,
    NULLIF(item->>'descricao', ''),
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
    END,
    COALESCE((item->>'peca_nova')::boolean, false)
  FROM jsonb_array_elements(p_items) AS item
  WHERE (item->>'produto_id' IS NOT NULL AND item->>'produto_id' != '')
     OR NULLIF(item->>'descricao', '') IS NOT NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.replace_orcamento_itens(uuid, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.replace_orcamento_itens(uuid, jsonb) TO authenticated;

-- Ensure pedro@lucenera.com.br has admin role and can_approve_quotes permission
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'pedro@lucenera.com.br';

  IF v_user_id IS NOT NULL THEN
    UPDATE public.usuarios
    SET role = 'admin', can_approve_quotes = true
    WHERE id = v_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.usuarios (id, nome, role, can_approve_quotes)
      VALUES (v_user_id, 'Pedro', 'admin', true)
      ON CONFLICT (id) DO UPDATE
      SET role = 'admin', can_approve_quotes = true;
    END IF;
  END IF;
END $$;
