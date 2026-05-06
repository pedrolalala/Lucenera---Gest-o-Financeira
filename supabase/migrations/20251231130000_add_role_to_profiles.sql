ALTER TABLE public.profiles 
ADD COLUMN role TEXT NOT NULL DEFAULT 'visitante' 
CHECK (role IN ('admin', 'colaborador', 'visitante'));
