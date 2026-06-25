-- Entre 17:39 e 18:20 de hoje, aprovar_orcamento_financeiro foi reescrita (fora da
-- SPEC-001/002) por uma versão simplificada que não cria boletos, não valida nada
-- e ignora o prazo real. Essas migrations ficaram registradas no histórico
-- (20260625173950 a 20260625182000) e não devem ser reaplicadas.
--
-- O wrapper foi revertido manualmente no banco para voltar a delegar para
-- aprovar_orcamento_financeiro_base_spec001 (SPEC-001/002), mas restou uma
-- referência morta a boletos.projeto_id (coluna removida pela migration central
-- 20260625_003_remover_projeto_id_boletos). Essa referência fazia a transação
-- inteira sofrer rollback após criar itens/parcelas/boletos com sucesso.
--
-- Esta migration apenas re-registra, em código, o wrapper já corrigido
-- diretamente no banco em 2026-06-25.

CREATE OR REPLACE FUNCTION public.aprovar_orcamento_financeiro(p_orcamento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public.aprovar_orcamento_financeiro_base_spec001(p_orcamento_id);

  RETURN coalesce(v_result, '{}'::jsonb)
    || jsonb_build_object('financeiro_usa_orcamento_id', true);
END;
$$;
