-- View that encapsulates accurate stock calculation from estoque_itens:
-- estoque_total = SUM(quantidade)
-- estoque_disponivel = SUM(quantidade - COALESCE(quantidade_reservada, 0))
-- estoque_reservado = SUM(COALESCE(quantidade_reservada, 0))
CREATE OR REPLACE VIEW public.vw_detalhe_produto_estoque
WITH (security_invoker = true) AS
SELECT
  produto_id,
  COALESCE(SUM(quantidade), 0) AS estoque_total,
  COALESCE(SUM(quantidade - COALESCE(quantidade_reservada, 0)), 0) AS estoque_disponivel,
  COALESCE(SUM(COALESCE(quantidade_reservada, 0)), 0) AS estoque_reservado
FROM public.estoque_itens
GROUP BY produto_id;
