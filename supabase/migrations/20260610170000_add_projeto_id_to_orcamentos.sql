ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL;
