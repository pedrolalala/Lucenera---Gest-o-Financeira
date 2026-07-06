-- Add new projeto_status enum values for financial approval workflow
-- These values support the project-level financial approval state machine

ALTER TYPE public.projeto_status ADD VALUE IF NOT EXISTS 'Aprovação Financeira';
ALTER TYPE public.projeto_status ADD VALUE IF NOT EXISTS 'Orçamento Aprovado';
