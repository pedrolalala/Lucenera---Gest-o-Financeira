-- Migration concorrente vinda de outra sessão (20260625120000_fix_orcamento_aprovacao_fallback.sql)
-- mudou _lucenera_parse_prazo_pagamento para nunca bloquear: prazo não interpretável
-- passou a cair em ARRAY[0] (1 parcela imediata) em vez de retornar array vazio.
--
-- Decisão do usuário (2026-06-25): manter o bloqueio original da SPEC-002 — orçamento
-- sem prazo interpretável não deve ser aprovado em silêncio com vencimento imediato;
-- deve retornar erro claro pedindo para estruturar o "Prazo para Início da Cobrança".
--
-- Esta migration restaura o comportamento bloqueante, idêntico ao aplicado
-- manualmente no banco em 2026-06-25.

CREATE OR REPLACE FUNCTION public._lucenera_parse_prazo_pagamento(
  p_condicoes_pagamento text,
  p_prazo_pagamento_dias integer[]
)
RETURNS integer[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_text text := lower(coalesce(p_condicoes_pagamento, ''));
  v_nums integer[];
  v_count integer;
  v_interval integer;
  v_len integer;
BEGIN
  IF p_prazo_pagamento_dias IS NOT NULL
     AND array_length(p_prazo_pagamento_dias, 1) > 0 THEN
    RETURN p_prazo_pagamento_dias;
  END IF;

  SELECT array_agg((matches.match)[1]::integer)
    INTO v_nums
  FROM regexp_matches(v_text, '([0-9]+)', 'g') AS matches(match);

  v_len := coalesce(array_length(v_nums, 1), 0);

  IF v_len = 0 THEN
    RETURN ARRAY[]::integer[];
  END IF;

  IF v_text ~ '^\s*[0-9]+\s*x\s*[0-9]+'
     AND v_len = 2
     AND v_nums[1] > 1
     AND v_nums[2] > 0 THEN
    v_count := v_nums[1];
    v_interval := v_nums[2];

    SELECT array_agg(i * v_interval ORDER BY i)
      INTO v_nums
    FROM generate_series(1, v_count) AS i;

    RETURN v_nums;
  END IF;

  IF v_text ~ '^\s*[0-9]+\s*x' THEN
    v_count := v_nums[1];

    IF v_len - 1 = v_count THEN
      RETURN v_nums[2:v_len];
    END IF;

    IF v_len > 1 THEN
      RETURN v_nums[2:v_len];
    END IF;

    RETURN ARRAY[]::integer[];
  END IF;

  IF v_len = 1 AND v_text ~ '[0-9]+\s*parcel' THEN
    RETURN ARRAY[]::integer[];
  END IF;

  RETURN v_nums;
END;
$$;
