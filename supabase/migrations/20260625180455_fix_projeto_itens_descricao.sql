CREATE OR REPLACE FUNCTION public.set_projeto_itens_descricao()
RETURNS trigger AS $$
BEGIN
  IF NEW.descricao IS NULL OR trim(NEW.descricao) = '' THEN
    IF NEW.produto_id IS NOT NULL THEN
      NEW.descricao := (SELECT nome FROM public.produtos WHERE id = NEW.produto_id);
    END IF;
    
    IF NEW.descricao IS NULL OR trim(NEW.descricao) = '' THEN
      NEW.descricao := 'Item sem descrição';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_projeto_itens_descricao ON public.projeto_itens;
CREATE TRIGGER trg_set_projeto_itens_descricao
  BEFORE INSERT OR UPDATE ON public.projeto_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_projeto_itens_descricao();
