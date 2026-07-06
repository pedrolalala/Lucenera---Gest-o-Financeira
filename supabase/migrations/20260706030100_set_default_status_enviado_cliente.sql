-- Ensure the default status for new budgets is enviado_cliente
-- This aligns the database default with the frontend budget form default

ALTER TABLE public.orcamentos ALTER COLUMN status SET DEFAULT 'enviado_cliente';
