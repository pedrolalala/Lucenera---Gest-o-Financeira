ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_estoque_itens" ON public.estoque_itens;
CREATE POLICY "authenticated_select_estoque_itens" ON public.estoque_itens
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_marcas" ON public.marcas;
CREATE POLICY "authenticated_select_marcas" ON public.marcas
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_categorias_produto" ON public.categorias_produto;
CREATE POLICY "authenticated_select_categorias_produto" ON public.categorias_produto
  FOR SELECT TO authenticated USING (true);
