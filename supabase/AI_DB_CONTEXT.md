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
- `marcas`
- `categorias_produto`

Views úteis:

- `vw_financeiro_projetos`
- `vw_projetos_dashboard`
- `vw_projetos_pipeline`
- `vw_projetos_resumo`
- `vw_vendas_por_projeto`

RPCs/funções relevantes:

- `aprovar_orcamento_financeiro(p_orcamento_id uuid)`
- `criar_produto_orcamento(p_payload jsonb)`
- `get_next_sku(prefix text)`
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
- O contrato oficial de status (SPEC-031, 2026-07-18) é `enviado_cliente -> Aprovação da Equipe -> Aprovação Financeira -> Orçamento Aprovado`; `aprovado`, `aprovado_cliente` e `aprovado_financeiro` são legados/compatibilidade. Antes da SPEC-031 a aprovação do cliente ia direto para `Aprovação Financeira` — as 5 funções de aprovação do cliente (`aprovar_orcamento_cliente_publico`, `aprovar_orcamento_cliente_manual`, `aprovar_orcamento_cliente`, `adm_aprovar_pelo_cliente`, `cliente_aprovar_orcamento`) agora terminam em `Aprovação da Equipe`.
- A RPC deve preparar itens aprovados, parcelas e boletos.
- Cadastro de produto feito dentro de Orçamentos deve chamar `criar_produto_orcamento(p_payload jsonb)` e gravar em `public.produtos`, nunca em catálogo paralelo.
- Produtos criados no orçamento devem ser vinculados ao item por `orcamento_itens.produto_id` e trazer snapshot visual de `codigo_produto`, `referencia`, `nome` e `sku` na UI.
- O financeiro deve exibir orçamento, projeto e cliente por relacionamento a partir de `orcamento_id`.
- Vencimentos vêm da forma de pagamento e prazo registrados no orçamento; o financeiro valida, não presume manualmente.
- `orcamentos.empresa_id` aponta para `empresas.id`, ou seja, empresa do grupo Lucenera responsável pela operação. Não confundir com a empresa/PJ de um cliente, fornecedor ou arquiteto, que é representada como registro em `contatos` e pode ser vinculada por `contatos.empresa_id -> contatos.id`.
- Boletos gerados pela aprovação devem preencher `boletos.orcamento_id`. A coluna `boletos.projeto_id` foi removida, porque o projeto já é derivado de `orcamentos.projeto_id`.
- `projetos.valor_total` é denormalizado e mantido por `public.sync_projeto_valor_total()` a partir da soma de `projeto_itens.subtotal`.

## Como agir ao codar

- Não reimplementar aprovação no frontend.
- Não inserir diretamente em `projeto_itens`, `projeto_parcelas` ou `boletos` se o fluxo é aprovação de orçamento; use a RPC existente.
- Não aprovar orçamento por `project_id`.
- Não criar produto por `insert` direto em `produtos` no frontend; use a RPC canônica para preservar validações de permissão, `codigo_produto`, `sku`, marca e categoria.
- Se a RPC retornar erro de schema, registre pendência de DB.
- Se a tela precisa abrir modal financeiro, só exibir se houver permissão de acesso ao financeiro.
- Se a demanda exigir alteração estrutural de banco, preencha `DB_CHANGE_REQUEST_TEMPLATE.md`.

## SPEC-019 — Origem da aprovação do cliente e reset pós-aprovação

- `orcamentos.aprovado_cliente_origem` (`'manual'|'token'`) distingue como o cliente aprovou, sem duplicar o status oficial da SPEC-016.
- Editar `valor_total`, `forma_pagamento`, `frete_tipo`, `frete_valor`, `condicoes_pagamento`, `prazo_pagamento_dias`, `desconto_global` ou os itens de um orçamento já em `Aprovação Financeira`/`Orçamento Aprovado` reinicia o ciclo automaticamente (volta para `enviado_cliente`, limpa aprovação anterior, gera novo token).
- Exceção: a tela de Aprovação Financeira usa a RPC `financeiro_editar_orcamento(p_orcamento_id, p_forma_pagamento, p_valor_total, p_itens, p_reiniciar_aprovacao)`, que permite ao usuário optar por **não** reiniciar o ciclo ao corrigir valores (modal de confirmação em `FinancialApprovalEditDialog.tsx`). Não fazer `UPDATE`/`upsert` direto em `orcamentos`/`orcamento_itens` nessa tela — sempre passar por essa RPC.
- `buscar_orcamento_para_aprovacao(p_orcamento_id, p_token)` e `recusar_orcamento_cliente_publico(p_orcamento_id, p_token, p_motivo)` são as RPCs usadas pelo link público (`ClientApproval.tsx`) — existem desde 2026-07-07 (ver SPEC-019 no repositório central; antes disso nunca existiram, apesar do frontend já as chamar).

## SPEC-031 — Etapa "Aprovação da Equipe" (2026-07-18)

- Novo status `'Aprovação da Equipe'` entre `enviado_cliente` e `Aprovação Financeira`: depois que o cliente aprova, a equipe visita a obra e decide se confirma (segue pro financeiro) ou se precisa trocar peça/cor (devolve ao cliente para nova aprovação).
- `requer_revisao_financeira` deixou de ser setado na aprovação do cliente (era `true` antes da SPEC-031) — agora só é setado `true` dentro de `equipe_aprovar_orcamento`, quando o orçamento de fato entra na fila financeira.
- RPC `equipe_aprovar_orcamento(p_orcamento_id uuid, p_observacao text)`: `Aprovação da Equipe -> Aprovação Financeira`. Exige `status = 'Aprovação da Equipe'`.
- RPC `equipe_devolver_orcamento_cliente(p_orcamento_id uuid, p_motivo text)`: `Aprovação da Equipe -> enviado_cliente`. `p_motivo` obrigatório (fica em `historico_status_orcamentos.observacao`); gera `token_aprovacao_cliente` novo (invalida o link antigo) e limpa `aprovado_cliente_em`/`aprovado_cliente_origem`.
- Permissão das duas RPCs: `usuarios.role IN ('admin','gerente')` OU `hub_pode_executar(auth.uid(), 'orcamentos', 'aprovacao_equipe', 'editar')` — módulo `aprovacao_equipe` cadastrado em `public.modulos` para o sistema `orcamentos` (SPEC-006), reaproveitando a ação `'editar'` já existente (não há ação `'aprovar'` no CHECK constraint do Hub). Conceder o módulo a um papel/usuário é feito pela tela de administração de permissões do Hub — esta migration só cadastra o módulo no catálogo, não concede a ninguém.
- Frontend: aba nova "Aprovação da Equipe" em `Budgets.tsx` (`TeamApprovalTab.tsx`), visível a todos, mas com os botões de ação desabilitados se o usuário não passar no check de `hub_pode_executar` (chamado direto via `supabase.rpc`, sem hook — não existe hook de permissão reutilizável no sistema ainda).
- Rótulo de UI do novo status: `'Revisão da Equipe (Pós-Visita)'` (não confundir com `'Revisão Financeira Pendente'`, que é o rótulo de `'Aprovação Financeira'`).

## SPEC-007 — SSO entre sistemas

- Este app é origem ao abrir o Financeiro pelo modal pós-aprovação e destino quando o CRM abre `Gerar Orçamento`.
- Usar `src/lib/cross-system-auth.ts`.
- A migration `20260708_030_spec007_sso_cross_system` e as Edge Functions `generate-cross-system-code`/`exchange-cross-system-code` estão publicadas no Supabase remoto desde 2026-07-07; falta homologação com usuário real.
- Como origem, chamar `redirectWithCode(destino, redirectTo, sistemaDestino)`.
- Como destino, `AuthProvider` deve chamar `consumeCodeFromUrl('orcamentos')` antes de decidir que precisa mostrar login.
- Não passar tokens Supabase crus em URL. O fluxo usa apenas `sso_code`, trocado pela Edge Function `exchange-cross-system-code`.
