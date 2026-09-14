-- SPEC-136: numero da venda, distinto do numero do orcamento.
--
-- Pedido do usuario (rotina de Separacao): hoje a tela mostra so o numero do
-- orcamento (ORC-XXXX) como se fosse "numero da venda" -- sem nenhum
-- identificador proprio pra diferenciar a venda em si do orcamento de
-- origem. Decisoes tomadas com o usuario em 2026-09-11:
--   1) Gerado no momento da aprovacao financeira (aprovar_orcamento_financeiro),
--      quando o orcamento de fato vira uma venda -- so no ramo VENDA, nao no
--      ramo devolucao (devolucao e credito sobre venda ja existente, nao uma
--      venda nova).
--   2) Sequencia global (mesmo padrao de ORC-0001/ORC-0002 ja usado hoje).
--   3) Formato "VENDA-0001".
--   4) Numero novo e independente -- NAO reaproveita a tabela legada
--      `vendas` (numeracao antiga do Connect, hoje sem novos inserts desde
--      que o fluxo de Orcamentos entrou em producao). Esse gap fica fora do
--      escopo desta SPEC, documentado a parte.
--
-- Esta migration ja parte da versao de aprovar_orcamento_financeiro corrigida
-- pela SPEC-135 (bloqueio de peca sem cadastro) -- e um superset dela, pode
-- ser aplicada sozinha ou depois da 135, o resultado final e o mesmo.

BEGIN;

ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS numero_venda text;

CREATE OR REPLACE FUNCTION public.aprovar_orcamento_financeiro(p_orcamento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_orcamento public.orcamentos%ROWTYPE;
  v_cliente_nome text;
  v_status_anterior text;
  v_prazos integer[];
  v_qtd_parcelas integer;
  v_i integer;
  v_valor_total numeric;
  v_valor_base numeric;
  v_valor_parcela numeric;
  v_valor_acumulado numeric := 0;
  v_data_base date := current_date;
  v_itens_existentes integer := 0;
  v_parcelas_existentes integer := 0;
  v_boletos_existentes integer := 0;
  v_itens_criados integer := 0;
  v_parcelas_criadas integer := 0;
  v_boletos_criados integer := 0;
  v_numero_orcamento text;
  v_numero_venda text;
  v_seq_venda integer;
  v_item record;
  v_estoque_fisico numeric(10,2);
  v_estoque_reservado_atual numeric(10,2);
  v_disponivel_fisico numeric(10,3);
  v_q_reserva numeric(10,3);
  v_q_entrega_futura numeric(10,3);
  v_reservas_criadas integer := 0;
  v_saldos_criados integer := 0;
  v_devolucoes_processadas integer := 0;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.hub_pode_executar(auth.uid(), 'orcamentos', NULL, 'aprovar') THEN
    RAISE EXCEPTION 'Permissão negada para aprovar orçamento financeiramente.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_orcamento FROM public.orcamentos WHERE id = p_orcamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento % não encontrado.', p_orcamento_id USING ERRCODE = 'P0001';
  END IF;

  v_status_anterior := v_orcamento.status;
  v_numero_orcamento := coalesce(v_orcamento.numero, left(p_orcamento_id::text, 8));

  IF v_orcamento.projeto_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui projeto vinculado.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF v_orcamento.empresa_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui empresa vinculada.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF v_orcamento.cliente_id IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui cliente vinculado.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(v_orcamento.valor_total, 0) <= 0 THEN
    RAISE EXCEPTION 'Orçamento % possui valor total inválido.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF v_orcamento.forma_pagamento IS NULL THEN
    RAISE EXCEPTION 'Orçamento % não possui forma de pagamento estruturada.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orcamento_itens oi WHERE oi.orcamento_id = p_orcamento_id) THEN
    RAISE EXCEPTION 'Orçamento % não possui itens.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.orcamento_itens oi
    WHERE oi.orcamento_id = p_orcamento_id AND (coalesce(oi.quantidade, 0) <= 0 OR coalesce(oi.preco_unitario, 0) <= 0)
  ) THEN
    RAISE EXCEPTION 'Orçamento % possui item sem quantidade ou preço válido.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  v_prazos := public._lucenera_parse_prazo_pagamento(v_orcamento.condicoes_pagamento, v_orcamento.prazo_pagamento_dias);
  v_qtd_parcelas := coalesce(array_length(v_prazos, 1), 0);
  IF v_qtd_parcelas = 0 THEN
    RAISE EXCEPTION 'Orçamento % não possui prazo de pagamento interpretável.', v_numero_orcamento USING ERRCODE = 'P0001';
  END IF;

  SELECT nome INTO v_cliente_nome FROM public.contatos WHERE id = v_orcamento.cliente_id;

  -- =====================================================================
  -- SPEC-071: ramo de DEVOLUÇÃO — não cria projeto_itens/reserva de estoque
  -- positiva; devolve estoque via registrar_devolucao_projeto_item (SPEC-015)
  -- e lança crédito financeiro negativo em vez de cobrança.
  -- SPEC-136: devolução não gera numero_venda — é crédito sobre uma venda já
  -- existente, não uma venda nova.
  -- =====================================================================
  IF v_orcamento.natureza_operacao = 'devolucao' THEN
    IF EXISTS (
      SELECT 1 FROM public.orcamento_itens oi
      WHERE oi.orcamento_id = p_orcamento_id AND oi.projeto_item_origem_id IS NULL
    ) THEN
      RAISE EXCEPTION 'Orçamento de devolução % possui item sem venda de origem vinculada.', v_numero_orcamento
        USING ERRCODE = 'P0001';
    END IF;

    SELECT count(*) INTO v_parcelas_existentes FROM public.projeto_parcelas WHERE orcamento_id = p_orcamento_id;
    SELECT count(*) INTO v_boletos_existentes FROM public.boletos WHERE orcamento_id = p_orcamento_id;

    IF v_parcelas_existentes = v_qtd_parcelas AND v_boletos_existentes = v_qtd_parcelas THEN
      UPDATE public.orcamentos SET status = 'Orçamento Aprovado' WHERE id = p_orcamento_id;
      RETURN jsonb_build_object(
        'orcamento_id', p_orcamento_id, 'status', 'Orçamento Aprovado', 'natureza_operacao', 'devolucao',
        'projeto_id', v_orcamento.projeto_id,
        'devolucoes_processadas', 0, 'parcelas_criadas', 0, 'boletos_criados', 0, 'ja_processado', true
      );
    END IF;

    IF v_parcelas_existentes > 0 OR v_boletos_existentes > 0 THEN
      RAISE EXCEPTION 'Orçamento de devolução % possui processamento parcial inconsistente: parcelas %, boletos %.',
        v_numero_orcamento, v_parcelas_existentes, v_boletos_existentes USING ERRCODE = 'P0001';
    END IF;

    IF v_orcamento.status != 'Aprovação Financeira' THEN
      RAISE EXCEPTION 'Orçamento % não está aguardando aprovação financeira. Status atual: %', v_numero_orcamento, v_status_anterior
        USING ERRCODE = 'P0003';
    END IF;

    UPDATE public.orcamentos SET status = 'Orçamento Aprovado', requer_revisao_financeira = false WHERE id = p_orcamento_id;

    BEGIN
      INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
      VALUES (p_orcamento_id, v_status_anterior, 'Orçamento Aprovado', auth.uid()::text, 'Aprovação financeira de devolução — estoque devolvido e crédito lançado');
    EXCEPTION
      WHEN undefined_table OR undefined_column OR foreign_key_violation THEN
        NULL;
    END;

    FOR v_item IN
      SELECT oi.projeto_item_origem_id AS projeto_item_id, oi.quantidade, oi.descricao
      FROM public.orcamento_itens oi
      WHERE oi.orcamento_id = p_orcamento_id
    LOOP
      PERFORM public.registrar_devolucao_projeto_item(
        v_item.projeto_item_id,
        v_item.quantidade,
        format('Devolução via orçamento %s%s', v_numero_orcamento,
          CASE WHEN v_item.descricao IS NOT NULL THEN ' — ' || v_item.descricao ELSE '' END)
      );
      v_devolucoes_processadas := v_devolucoes_processadas + 1;
    END LOOP;

    v_valor_total := coalesce(v_orcamento.valor_total, 0);
    v_valor_base := round(v_valor_total / v_qtd_parcelas, 2);

    FOR v_i IN 1..v_qtd_parcelas LOOP
      IF v_i = v_qtd_parcelas THEN
        v_valor_parcela := v_valor_total - v_valor_acumulado;
      ELSE
        v_valor_parcela := v_valor_base;
        v_valor_acumulado := v_valor_acumulado + v_valor_parcela;
      END IF;
      INSERT INTO public.projeto_parcelas (projeto_id, numero_parcela, valor, data_fechamento, data_vencimento, status, forma_pagamento, orcamento_id, descricao)
      VALUES (v_orcamento.projeto_id, v_i, -v_valor_parcela, current_date, v_data_base + v_prazos[v_i], 'pendente', v_orcamento.forma_pagamento, p_orcamento_id, 'Crédito de devolução gerado pelo orçamento ' || v_numero_orcamento);
      v_parcelas_criadas := v_parcelas_criadas + 1;
    END LOOP;

    INSERT INTO public.boletos (nosso_numero, numero_documento, parcela_id, orcamento_id, empresa_id, valor, vencimento, nome_pagador, status, tipo, venda, num_parcela, total_parcelas, emissao)
    SELECT 'DEV-' || regexp_replace(v_numero_orcamento, '[^a-zA-Z0-9]', '', 'g') || '-P' || pp.numero_parcela,
      v_numero_orcamento || '-P' || pp.numero_parcela, pp.id, p_orcamento_id, v_orcamento.empresa_id,
      pp.valor, pp.data_vencimento, coalesce(v_cliente_nome, 'Cliente do orçamento'), 'pendente_registro', 'Nota de Crédito', NULL,
      pp.numero_parcela, v_qtd_parcelas, current_date
    FROM public.projeto_parcelas pp WHERE pp.orcamento_id = p_orcamento_id
    ON CONFLICT (nosso_numero) DO NOTHING;
    GET DIAGNOSTICS v_boletos_criados = ROW_COUNT;

    RETURN jsonb_build_object(
      'orcamento_id', p_orcamento_id, 'status', 'Orçamento Aprovado', 'natureza_operacao', 'devolucao',
      'projeto_id', v_orcamento.projeto_id,
      'devolucoes_processadas', v_devolucoes_processadas,
      'parcelas_criadas', v_parcelas_criadas, 'boletos_criados', v_boletos_criados,
      'ja_processado', false
    );
  END IF;

  -- =====================================================================
  -- Ramo VENDA — comportamento original, exceto pela correção de prioridade
  -- da descrição do item (ver cabeçalho da migration).
  -- =====================================================================
  -- SPEC-135: bloqueia aprovação (faturamento) quando existe item sem
  -- produto cadastrado — sem isso, vira uma venda "fantasma" sem controle
  -- de estoque nenhum (o loop abaixo já pula reserva pra item sem
  -- produto_id, mas antes disso deixava aprovar e gerar parcela/boleto
  -- normalmente). O item precisa ser vinculado a um produto real (cadastro)
  -- antes desta aprovação — não se aplica à devolução, que já retorna acima.
  IF EXISTS (
    SELECT 1 FROM public.orcamento_itens oi
    WHERE oi.orcamento_id = p_orcamento_id AND oi.produto_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Orçamento % possui item sem produto cadastrado (peça sem código interno) — cadastre o produto antes de aprovar financeiramente.', v_numero_orcamento
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_itens_existentes FROM public.projeto_itens WHERE orcamento_id = p_orcamento_id;
  SELECT count(*) INTO v_parcelas_existentes FROM public.projeto_parcelas WHERE orcamento_id = p_orcamento_id;
  SELECT count(*) INTO v_boletos_existentes FROM public.boletos WHERE orcamento_id = p_orcamento_id;

  IF v_itens_existentes > 0 AND v_parcelas_existentes = v_qtd_parcelas AND v_boletos_existentes = v_qtd_parcelas THEN
    UPDATE public.orcamentos SET status = 'Orçamento Aprovado' WHERE id = p_orcamento_id;
    RETURN jsonb_build_object(
      'orcamento_id', p_orcamento_id, 'status', 'Orçamento Aprovado', 'projeto_id', v_orcamento.projeto_id,
      'numero_venda', v_orcamento.numero_venda,
      'projeto_itens_criados', 0, 'parcelas_criadas', 0, 'boletos_criados', 0,
      'reservas_estoque_aplicadas', 0, 'saldos_operacionais_criados', 0,
      'nota_fiscal_status', 'pendente_api', 'ja_processado', true
    );
  END IF;

  IF v_itens_existentes > 0 OR v_parcelas_existentes > 0 OR v_boletos_existentes > 0 THEN
    RAISE EXCEPTION 'Orçamento % possui processamento parcial inconsistente: itens %, parcelas %, boletos %.',
      v_numero_orcamento, v_itens_existentes, v_parcelas_existentes, v_boletos_existentes USING ERRCODE = 'P0001';
  END IF;

  IF v_orcamento.status != 'Aprovação Financeira' THEN
    RAISE EXCEPTION 'Orçamento % não está aguardando aprovação financeira. Status atual: %', v_numero_orcamento, v_status_anterior
      USING ERRCODE = 'P0003';
  END IF;

  -- SPEC-136: numero da venda, gerado uma unica vez, sequencia global
  -- "VENDA-0001" no mesmo padrao de set_orcamento_numero() para ORC-XXXX.
  IF v_orcamento.numero_venda IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_venda FROM 7) AS INTEGER)), 0) + 1
    INTO v_seq_venda
    FROM public.orcamentos
    WHERE numero_venda LIKE 'VENDA-%' AND numero_venda ~ '^VENDA-\d+$';
    v_numero_venda := 'VENDA-' || LPAD(v_seq_venda::text, 4, '0');
  ELSE
    v_numero_venda := v_orcamento.numero_venda;
  END IF;

  UPDATE public.orcamentos
  SET status = 'Orçamento Aprovado', requer_revisao_financeira = false, numero_venda = v_numero_venda
  WHERE id = p_orcamento_id;

  BEGIN
    INSERT INTO public.historico_status_orcamentos (orcamento_id, status_anterior, status_novo, usuario, observacao)
    VALUES (p_orcamento_id, v_status_anterior, 'Orçamento Aprovado', auth.uid()::text, 'Aprovação financeira — processamento de itens, parcelas e boletos');
  EXCEPTION
    WHEN undefined_table OR undefined_column OR foreign_key_violation THEN
      NULL;
  END;

  FOR v_item IN
    INSERT INTO public.projeto_itens (
      projeto_id, produto_id, descricao, quantidade, preco_unitario, desconto, validado, orcamento_id,
      orcamento_item_id, l_fixo
    )
    SELECT v_orcamento.projeto_id, oi.produto_id, coalesce(oi.descricao, p.nome, oi.custom_id, 'Item do Orçamento'),
      coalesce(oi.quantidade, 0), coalesce(oi.preco_unitario, 0), coalesce(oi.desconto, 0),
      true, p_orcamento_id,
      oi.id, oi.custom_id
    FROM public.orcamento_itens oi LEFT JOIN public.produtos p ON p.id = oi.produto_id
    WHERE oi.orcamento_id = p_orcamento_id
    RETURNING id, produto_id, quantidade
  LOOP
    v_itens_criados := v_itens_criados + 1;

    CONTINUE WHEN v_item.produto_id IS NULL OR coalesce(v_item.quantidade, 0) <= 0;

    INSERT INTO public.estoque_itens (produto_id, local, quantidade, quantidade_reservada, atualizado_em)
    VALUES (v_item.produto_id, 'Estoque'::public.estoque_local, 0, 0, NOW())
    ON CONFLICT (produto_id, local) DO NOTHING;

    SELECT quantidade, quantidade_reservada
      INTO v_estoque_fisico, v_estoque_reservado_atual
    FROM public.estoque_itens
    WHERE produto_id = v_item.produto_id AND local = 'Estoque'::public.estoque_local
    FOR UPDATE;

    v_disponivel_fisico := GREATEST(0, coalesce(v_estoque_fisico, 0) - coalesce(v_estoque_reservado_atual, 0));
    v_q_reserva := LEAST(v_item.quantidade, v_disponivel_fisico);
    v_q_entrega_futura := GREATEST(0, v_item.quantidade - v_q_reserva);

    UPDATE public.estoque_itens
    SET quantidade_reservada = quantidade_reservada + v_item.quantidade, atualizado_em = NOW()
    WHERE produto_id = v_item.produto_id AND local = 'Estoque'::public.estoque_local;

    v_reservas_criadas := v_reservas_criadas + 1;

    INSERT INTO public.estoque_saldos_projeto_item (projeto_item_id, q_reserva, q_entrega_futura)
    VALUES (v_item.id, v_q_reserva, v_q_entrega_futura)
    ON CONFLICT (projeto_item_id) DO NOTHING;

    v_saldos_criados := v_saldos_criados + 1;

    INSERT INTO public.estoque_movimentos_projeto_item (
      projeto_item_id, tipo, quantidade, origem, referencia_id, observacao, criado_por
    )
    VALUES (
      v_item.id, 'aprovacao_orcamento', v_item.quantidade, 'aprovar_orcamento_financeiro', p_orcamento_id,
      format('Reserva %s / entrega futura %s na aprovação do orçamento %s', v_q_reserva, v_q_entrega_futura, v_numero_orcamento),
      auth.uid()
    );
  END LOOP;

  v_valor_total := coalesce(v_orcamento.valor_total, 0);
  v_valor_base := round(v_valor_total / v_qtd_parcelas, 2);

  FOR v_i IN 1..v_qtd_parcelas LOOP
    IF v_i = v_qtd_parcelas THEN
      v_valor_parcela := v_valor_total - v_valor_acumulado;
    ELSE
      v_valor_parcela := v_valor_base;
      v_valor_acumulado := v_valor_acumulado + v_valor_parcela;
    END IF;
    INSERT INTO public.projeto_parcelas (projeto_id, numero_parcela, valor, data_fechamento, data_vencimento, status, forma_pagamento, orcamento_id, descricao)
    VALUES (v_orcamento.projeto_id, v_i, v_valor_parcela, current_date, v_data_base + v_prazos[v_i], 'pendente', v_orcamento.forma_pagamento, p_orcamento_id, 'Parcela gerada pelo orçamento ' || v_numero_orcamento);
    v_parcelas_criadas := v_parcelas_criadas + 1;
  END LOOP;

  INSERT INTO public.boletos (nosso_numero, numero_documento, parcela_id, orcamento_id, empresa_id, valor, vencimento, nome_pagador, status, tipo, venda, num_parcela, total_parcelas, emissao)
  SELECT 'ORC-' || regexp_replace(v_numero_orcamento, '[^a-zA-Z0-9]', '', 'g') || '-P' || pp.numero_parcela,
    v_numero_orcamento || '-P' || pp.numero_parcela, pp.id, p_orcamento_id, v_orcamento.empresa_id,
    pp.valor, pp.data_vencimento, coalesce(v_cliente_nome, 'Cliente do orçamento'), 'pendente_registro', 'Nota Fiscal', NULL,
    pp.numero_parcela, v_qtd_parcelas, current_date
  FROM public.projeto_parcelas pp WHERE pp.orcamento_id = p_orcamento_id
  ON CONFLICT (nosso_numero) DO NOTHING;
  GET DIAGNOSTICS v_boletos_criados = ROW_COUNT;

  RETURN jsonb_build_object(
    'orcamento_id', p_orcamento_id, 'status', 'Orçamento Aprovado', 'projeto_id', v_orcamento.projeto_id,
    'numero_venda', v_numero_venda,
    'projeto_itens_criados', v_itens_criados, 'parcelas_criadas', v_parcelas_criadas, 'boletos_criados', v_boletos_criados,
    'reservas_estoque_aplicadas', v_reservas_criadas, 'saldos_operacionais_criados', v_saldos_criados,
    'nota_fiscal_status', 'pendente_api', 'ja_processado', false
  );
END;
$function$;

-- Expõe numero_venda para a Separação (vw_estoque_saldos_projeto_item já
-- fazia LEFT JOIN orcamentos, só faltava esta coluna).
-- NOTA (achado na aplicação, 2026-09-14): CREATE OR REPLACE VIEW no Postgres
-- só aceita colunas novas no FINAL da lista -- inserir no meio (como a
-- primeira versão desta migration fazia, entre orcamento_numero e q_venda)
-- falha com "cannot change name of view column". venda_numero foi movida pro
-- fim da lista; nenhum nome/posicao de coluna existente muda.
CREATE OR REPLACE VIEW public.vw_estoque_saldos_projeto_item AS
 SELECT esp.projeto_item_id,
    pi.projeto_id,
    pi.orcamento_id,
    pi.produto_id,
    COALESCE(o.cliente_id, pr.cliente_id) AS cliente_id,
    p.nome AS produto,
    p.codigo_produto AS produto_codigo,
    pr.codigo AS projeto_codigo,
    o.numero AS orcamento_numero,
    pi.quantidade AS q_venda,
    esp.q_reserva,
    esp.q_entrega_futura,
    esp.q_ag_separar,
    esp.q_separado,
    esp.q_entregue,
    esp.q_devolvida,
    esp.q_transferida_saida,
    esp.status_operacional,
    esp.atualizado_em,
    o.numero_venda AS venda_numero
   FROM estoque_saldos_projeto_item esp
     JOIN projeto_itens pi ON pi.id = esp.projeto_item_id
     LEFT JOIN projetos pr ON pr.id = pi.projeto_id
     LEFT JOIN orcamentos o ON o.id = pi.orcamento_id
     LEFT JOIN produtos p ON p.id = pi.produto_id;

NOTIFY pgrst, 'reload schema';

COMMIT;
