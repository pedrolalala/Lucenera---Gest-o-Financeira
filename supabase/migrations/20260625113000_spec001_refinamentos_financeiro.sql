-- SPEC-001 — refinamentos pós-aplicação
-- Objetivo:
-- 1. Remover o fluxo antigo por trigger/automação de faturamento.
-- 2. Manter projeto_id nas tabelas de projeto, mas fazer o Financeiro depender de orcamento_id.
-- 3. Evitar que boletos novos do fluxo aprovado carreguem projeto_id redundante.

DROP TRIGGER IF EXISTS on_orcamento_aprovado ON public.orcamentos;
DROP TRIGGER IF EXISTS tr_check_orcamento_approval ON public.orcamentos;

DROP FUNCTION IF EXISTS public.invoke_billing_automation();
DROP FUNCTION IF EXISTS public.check_orcamento_approval();

DO $$
BEGIN
  -- Remove agendamentos antigos caso pg_cron exista no ambiente.
  EXECUTE $sql$
    SELECT cron.unschedule(jobid)
    FROM cron.job
    WHERE lower(coalesce(command, '')) LIKE '%process-billing-automation%'
       OR lower(coalesce(command, '')) LIKE '%invoke_billing_automation%'
       OR lower(coalesce(jobname, '')) LIKE '%billing%'
  $sql$;
EXCEPTION
  WHEN invalid_schema_name
    OR undefined_table
    OR undefined_column
    OR undefined_function
    OR insufficient_privilege THEN
    NULL;
END $$;

-- Boletos financeiros passam a apontar para orçamento.
-- Projeto/cliente devem ser derivados por orcamento_id -> orcamentos.
UPDATE public.boletos
SET projeto_id = NULL
WHERE orcamento_id IS NOT NULL
  AND projeto_id IS NOT NULL;

DO $$
BEGIN
  -- Preserva a função transacional criada na SPEC-001 como função base.
  -- A versão pública adiciona apenas o refinamento de normalização do boleto.
  IF to_regprocedure('public.aprovar_orcamento_financeiro_base_spec001(uuid)') IS NULL
     AND to_regprocedure('public.aprovar_orcamento_financeiro(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.aprovar_orcamento_financeiro(uuid)
      RENAME TO aprovar_orcamento_financeiro_base_spec001;
  END IF;

  IF to_regprocedure('public.aprovar_orcamento_financeiro_base_spec001(uuid)') IS NOT NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.aprovar_orcamento_financeiro(p_orcamento_id uuid)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      DECLARE
        v_result jsonb;
      BEGIN
        v_result := public.aprovar_orcamento_financeiro_base_spec001(p_orcamento_id);

        UPDATE public.boletos
        SET projeto_id = NULL
        WHERE orcamento_id = p_orcamento_id
          AND projeto_id IS NOT NULL;

        RETURN coalesce(v_result, '{}'::jsonb)
          || jsonb_build_object('financeiro_usa_orcamento_id', true);
      END;
      $body$;
    $fn$;
  END IF;
END $$;
