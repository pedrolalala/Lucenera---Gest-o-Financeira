-- Remove o vínculo legado por venda em parcelas de projeto.
-- O fluxo aprovado deve rastrear parcelas por orcamento_id.

BEGIN;

DO $$
DECLARE
  v_fn text;
BEGIN
  IF to_regprocedure('public.aprovar_orcamento_financeiro_base_spec001(uuid)') IS NOT NULL THEN
    v_fn := pg_get_functiondef('public.aprovar_orcamento_financeiro_base_spec001(uuid)'::regprocedure);

    v_fn := replace(
      v_fn,
      E'      orcamento_id,\n      venda_id,\n      descricao',
      E'      orcamento_id,\n      descricao'
    );

    v_fn := replace(
      v_fn,
      E'      p_orcamento_id,\n      NULL,\n      ''Parcela gerada pelo orçamento '' || v_numero_orcamento',
      E'      p_orcamento_id,\n      ''Parcela gerada pelo orçamento '' || v_numero_orcamento'
    );

    IF v_fn LIKE '%venda_id%' THEN
      RAISE EXCEPTION 'Não foi possível remover venda_id da função public.aprovar_orcamento_financeiro_base_spec001(uuid).';
    END IF;

    EXECUTE v_fn;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_parcelas_venda;

ALTER TABLE public.projeto_parcelas
  DROP CONSTRAINT IF EXISTS projeto_parcelas_venda_id_fkey;

ALTER TABLE public.projeto_parcelas
  DROP COLUMN IF EXISTS venda_id;

COMMIT;
