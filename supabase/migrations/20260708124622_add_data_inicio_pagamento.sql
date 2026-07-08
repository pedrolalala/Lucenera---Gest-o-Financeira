-- Add data_inicio_pagamento DATE column to orcamentos
-- Replaces the numeric prazo_inicio_cobranca_dias with a specific date
-- for more precise control over the billing schedule.

ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS data_inicio_pagamento date;

-- Add a CHECK constraint to prevent historical dates (nullable for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orcamentos_data_inicio_pagamento_check'
  ) THEN
    ALTER TABLE public.orcamentos
      ADD CONSTRAINT orcamentos_data_inicio_pagamento_check
      CHECK (data_inicio_pagamento IS NULL OR data_inicio_pagamento >= CURRENT_DATE);
  END IF;
END $$;
