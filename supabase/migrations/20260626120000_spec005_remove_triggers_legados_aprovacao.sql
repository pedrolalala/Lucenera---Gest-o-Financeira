-- SPEC-005 — Remoção de triggers legados que bloqueiam aprovação de orçamento
--
-- trg_aprovar_orcamento (BEFORE UPDATE em orcamentos) tentava criar um
-- projeto novo a partir do orçamento (INSERT INTO projetos com coluna
-- orcamento_id, que não existe). Pressupõe um modelo antigo, incompatível
-- com o atual (orcamentos.projeto_id já aponta para um projeto existente).
-- Disparava na mesma condição usada pela RPC de aprovação (status ->
-- 'aprovado'), quebrando a transação inteira.
DROP TRIGGER IF EXISTS trg_aprovar_orcamento ON public.orcamentos;
DROP FUNCTION IF EXISTS public.fn_aprovar_orcamento();

-- trigger_proteger_parcelas (BEFORE INSERT em projeto_parcelas) bloqueava
-- qualquer parcela quando o projeto não estava em "Ajustes finais" ou
-- "Finalizado". Isso impedia 100% das aprovações de orçamento, já que a
-- parcela nasce no momento da aprovação, independente da fase do projeto.
-- Mantém a regra para o fluxo legado (orcamento_id IS NULL) e libera
-- totalmente parcelas geradas por orçamento aprovado, que já são validadas
-- dentro da própria RPC de aprovação.
CREATE OR REPLACE FUNCTION public.trigger_proteger_parcelas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_status public.projeto_status;
BEGIN
  IF NEW.orcamento_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM projetos WHERE id = NEW.projeto_id;

  IF v_status NOT IN ('Ajustes finais'::public.projeto_status, 'Finalizado'::public.projeto_status) THEN
    RAISE EXCEPTION
      'Parcelas só podem ser criadas após o projeto estar em "Ajustes finais" ou "Finalizado". Status atual: %',
      v_status;
  END IF;

  RETURN NEW;
END;
$function$;
