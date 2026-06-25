# AI DB Context — Sistema de Orçamentos

Este sistema é um módulo do ecossistema Lucenera e usa um Supabase compartilhado.

Este arquivo resume o recorte de banco necessário para trabalhar em Orçamentos sem depender de documentação externa.

Se uma demanda exigir estrutura de banco que não aparece neste contexto, documente a necessidade em `DB_CHANGE_REQUEST_TEMPLATE.md` antes de alterar código que dependa dela.

## Papel do sistema

Sistema responsável por criar, revisar, aprovar e acompanhar orçamentos.

## Objetos reais relevantes no Supabase

Principais tabelas:

- `orcamentos`
- `orcamento_itens`
- `projetos`
- `projeto_itens`
- `projeto_parcelas`
- `boletos`
- `notas_fiscais`
- `contatos`
- `empresas`
- `produtos`

Views úteis:

- `vw_financeiro_projetos`
- `vw_projetos_dashboard`
- `vw_projetos_pipeline`
- `vw_projetos_resumo`
- `vw_vendas_por_projeto`

RPCs/funções relevantes:

- `aprovar_orcamento_financeiro(p_orcamento_id uuid)`
- `_lucenera_parse_prazo_pagamento(...)`
- `fn_gerar_numero_orcamento(...)`

## Colunas-chave reais

`orcamentos` possui, entre outras:

- `id`
- `empresa_id`
- `cliente_id`
- `arquiteto_id`
- `vendedor_id`
- `status`
- `valor_total`
- `numero`
- `condicoes_pagamento`
- `forma_pagamento`
- `projeto_id`
- `prazo_pagamento_dias`
- `data_base_vencimento`

`orcamento_itens` possui:

- `id`
- `orcamento_id`
- `produto_id`
- `quantidade`
- `preco_unitario`
- `desconto`
- `descricao`

`projeto_itens` possui:

- `id`
- `projeto_id`
- `produto_id`
- `descricao`
- `quantidade`
- `preco_unitario`
- `desconto`
- `validado`
- `orcamento_id`

`projeto_parcelas` possui `orcamento_id` para rastrear a origem do fluxo aprovado. Não possui `venda_id`.

`projetos` possui, entre outras:

- `id`
- `codigo`
- `nome`
- `empresa_id`
- `valor_total`

## Decisões de negócio

- Somente orçamento aprovado gera `projeto_itens`.
- O fluxo aprovado usa `orcamento_id` como chave de rastreio.
- Não usar `venda_id` no fluxo orçamento aprovado -> financeiro.
- Ao aprovar orçamento, chamar a RPC `aprovar_orcamento_financeiro(p_orcamento_id uuid)`.
- A RPC deve preparar itens aprovados, parcelas e boletos.
- O financeiro deve exibir orçamento, projeto e cliente por relacionamento a partir de `orcamento_id`.
- Vencimentos vêm da forma de pagamento e prazo registrados no orçamento; o financeiro valida, não presume manualmente.
- `orcamentos.empresa_id` aponta para `empresas.id`, ou seja, empresa do grupo Lucenera responsável pela operação. Não confundir com a empresa/PJ de um cliente, fornecedor ou arquiteto, que é representada como registro em `contatos` e pode ser vinculada por `contatos.empresa_id -> contatos.id`.
- Boletos gerados pela aprovação devem preencher `boletos.orcamento_id`. A coluna `boletos.projeto_id` foi removida, porque o projeto já é derivado de `orcamentos.projeto_id`.
- `projetos.valor_total` é denormalizado e mantido por `public.sync_projeto_valor_total()` a partir da soma de `projeto_itens.subtotal`.

## Como agir ao codar

- Não reimplementar aprovação no frontend.
- Não inserir diretamente em `projeto_itens`, `projeto_parcelas` ou `boletos` se o fluxo é aprovação de orçamento; use a RPC existente.
- Se a RPC retornar erro de schema, registre pendência de DB.
- Se a tela precisa abrir modal financeiro, só exibir se houver permissão de acesso ao financeiro.
- Se a demanda exigir alteração estrutural de banco, preencha `DB_CHANGE_REQUEST_TEMPLATE.md`.
