-- Ensure RLS policies on produtos table allow authenticated users to SELECT.
-- The existing migration 20260630174200 covers estoque_itens, marcas, and categorias_produto,
-- but produtos was missing — ProductSearchModal and other queries need SELECT access.

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_produtos" ON public.produtos;
CREATE POLICY "authenticated_select_produtos" ON public.produtos
  FOR SELECT TO authenticated USING (true);
