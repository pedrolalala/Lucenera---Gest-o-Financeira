ALTER TYPE public.pagamento_forma ADD VALUE IF NOT EXISTS 'dinheiro';

ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS forma_pagamento public.pagamento_forma;
