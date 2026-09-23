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
- `digitado_por` (SPEC-158 P2.3, uuid, nullable, FK `usuarios(id) ON DELETE SET NULL`): quem de fato criou o orçamento, capturado automaticamente do login em `addBudget()` — nunca editável pela UI, distinto de `vendedor_id` (lista fixa de 5 pessoas, SPEC-140). Orçamentos criados antes desta SPEC ficam `null` (sem backfill).
- `status`
- `valor_total`
- `numero`
- `condicoes_pagamento`
- `forma_pagamento`
- `projeto_id`
- `prazo_pagamento_dias`
- `data_base_vencimento`
- `origem_connect_cod_orcamento` (SPEC-050, integer, único quando não nulo): `cod_orcamento` do XML Connect que originou este orçamento, quando criado via import. Chave de idempotência do import — não reimportar um XML cujo `cod_orcamento` já exista aqui.
- `origem_connect_importado_em` (SPEC-050, timestamptz): quando o import de XML foi aplicado.
- `plano_parcelas` (SPEC-152, jsonb, nullable): array de `{numero, dias_offset, valor, forma_pagamento, permuta_fornecedor_id}` — ver seção SPEC-152 abaixo.

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
- O contrato oficial de status (SPEC-051, 2026-07-27, sobre a base da SPEC-031) é `rascunho -> enviado_cliente -> Aprovação da Equipe -> Aprovação Financeira -> Orçamento Aprovado`; `aprovado`, `aprovado_cliente` e `aprovado_financeiro` são legados/compatibilidade. Antes da SPEC-031 a aprovação do cliente ia direto para `Aprovação Financeira` — as 5 funções de aprovação do cliente (`aprovar_orcamento_cliente_publico`, `aprovar_orcamento_cliente_manual`, `aprovar_orcamento_cliente`, `adm_aprovar_pelo_cliente`, `cliente_aprovar_orcamento`) agora terminam em `Aprovação da Equipe`.
- `rascunho` é a fase real (não mais efêmera) em que um orçamento nasce e permanece enquanto está sendo montado. A transição `rascunho -> enviado_cliente` é **sempre manual**, via RPC `enviar_orcamento_para_cliente(p_orcamento_id uuid)` — nunca mais automática. Não existe mais nenhum trigger de banco que promova o status sozinho quando os campos obrigatórios e itens estão preenchidos (ver SPEC-051 abaixo).
- A RPC deve preparar itens aprovados, parcelas e boletos.
- Cadastro de produto feito dentro de Orçamentos deve chamar `criar_produto_orcamento(p_payload jsonb)` e gravar em `public.produtos`, nunca em catálogo paralelo.
- Produtos criados no orçamento devem ser vinculados ao item por `orcamento_itens.produto_id` e trazer snapshot visual de `codigo_produto`, `referencia`, `nome` e `sku` na UI. Desde a SPEC-053 (27/07/2026), `codigo_produto` é gerado automaticamente por `DEFAULT nextval(...)` na coluna (sequence Postgres) — a RPC `criar_produto_orcamento` não recebe nem valida mais esse campo vindo do payload; o frontend só exibe o valor retornado após a criação.
- O financeiro deve exibir orçamento, projeto e cliente por relacionamento a partir de `orcamento_id`.
- Vencimentos vêm da forma de pagamento e prazo registrados no orçamento; o financeiro valida, não presume manualmente.
- `orcamentos.empresa_id` aponta para `empresas.id`, ou seja, empresa do grupo Lucenera responsável pela operação. Não confundir com a empresa/PJ de um cliente, fornecedor ou arquiteto, que é representada como registro em `contatos` e pode ser vinculada por `contatos.empresa_id -> contatos.id`.
- Boletos gerados pela aprovação devem preencher `boletos.orcamento_id`. A coluna `boletos.projeto_id` foi removida, porque o projeto já é derivado de `orcamentos.projeto_id`.
- `projetos.valor_total` é denormalizado e mantido por `public.sync_projeto_valor_total()` a partir da soma de `projeto_itens.subtotal`.

## Como agir ao codar

- Não reimplementar aprovação no frontend.
- Não inserir diretamente em `projeto_itens`, `projeto_parcelas` ou `boletos` se o fluxo é aprovação de orçamento; use a RPC existente.
- Não aprovar orçamento por `project_id`.
- Não criar produto por `insert` direto em `produtos` no frontend; use a RPC canônica para preservar validações de permissão, `sku`, marca e categoria (`codigo_produto` não precisa mais de validação própria — é gerado pelo `DEFAULT` da coluna desde a SPEC-053).
- Se a RPC retornar erro de schema, registre pendência de DB.
- Se a tela precisa abrir modal financeiro, só exibir se houver permissão de acesso ao financeiro.
- Se a demanda exigir alteração estrutural de banco, preencha `DB_CHANGE_REQUEST_TEMPLATE.md`.

## SPEC-019 — Origem da aprovação do cliente e reset pós-aprovação

- `orcamentos.aprovado_cliente_origem` (`'manual'|'token'`) distingue como o cliente aprovou, sem duplicar o status oficial da SPEC-016.
- **Descrição histórica, superada — não confiar nesta linha isolada** (ver SPEC-135 logo abaixo, que é a versão confirmada direto no banco real): esta seção descrevia editar `valor_total`, `forma_pagamento`, `frete_tipo`, `frete_valor`, `condicoes_pagamento`, `prazo_pagamento_dias`, `desconto_global` como algo que também reiniciava o ciclo de aprovação, junto com os itens. A investigação da SPEC-135 (2026-09-11, `pg_get_functiondef` direto no Supabase real) e a reconfirmação da SPEC-152 (2026-09-17) mostraram que isso nunca foi o mecanismo real em produção: o único gatilho de reset é o trigger em `orcamento_itens` (`trg_orcamento_item_change_reset`). Editar campos de "Pagamento e Totais" (incluindo o novo `plano_parcelas` da SPEC-152) **não** reinicia o ciclo de aprovação.
- Exceção histórica (SPEC-019): a RPC `financeiro_editar_orcamento(p_orcamento_id, p_forma_pagamento, p_valor_total, p_itens, p_reiniciar_aprovacao)` permite optar por **não** reiniciar o ciclo. **Desde a SPEC-017 (2026-07-06) essa RPC está órfã** — `FinancialApprovalEditDialog.tsx` foi descontinuado do fluxo principal (a aba financeira usa `BudgetFormPage.tsx`/`updateBudget`, que nunca chama essa RPC nem seta `app.skip_approval_reset`). Ver SPEC-135 abaixo para o mecanismo real de "não resetar" hoje.
- `buscar_orcamento_para_aprovacao(p_orcamento_id, p_token)` e `recusar_orcamento_cliente_publico(p_orcamento_id, p_token, p_motivo)` são as RPCs usadas pelo link público (`ClientApproval.tsx`) — existem desde 2026-07-07 (ver SPEC-019 no repositório central; antes disso nunca existiram, apesar do frontend já as chamar).

## SPEC-031 — Etapa "Aprovação da Equipe" (2026-07-18)

- Novo status `'Aprovação da Equipe'` entre `enviado_cliente` e `Aprovação Financeira`: depois que o cliente aprova, a equipe visita a obra e decide se confirma (segue pro financeiro) ou se precisa trocar peça/cor (devolve ao cliente para nova aprovação).
- `requer_revisao_financeira` deixou de ser setado na aprovação do cliente (era `true` antes da SPEC-031) — agora só é setado `true` dentro de `equipe_aprovar_orcamento`, quando o orçamento de fato entra na fila financeira.
- RPC `equipe_aprovar_orcamento(p_orcamento_id uuid, p_observacao text)`: `Aprovação da Equipe -> Aprovação Financeira`. Exige `status = 'Aprovação da Equipe'`.
- RPC `equipe_devolver_orcamento_cliente(p_orcamento_id uuid, p_motivo text)`: `Aprovação da Equipe -> enviado_cliente`. `p_motivo` obrigatório (fica em `historico_status_orcamentos.observacao`); gera `token_aprovacao_cliente` novo (invalida o link antigo) e limpa `aprovado_cliente_em`/`aprovado_cliente_origem`.
- Permissão das duas RPCs: `usuarios.role IN ('admin','gerente')` OU `hub_pode_executar(auth.uid(), 'orcamentos', 'aprovacao_equipe', 'editar')` — módulo `aprovacao_equipe` cadastrado em `public.modulos` para o sistema `orcamentos` (SPEC-006), reaproveitando a ação `'editar'` já existente (não há ação `'aprovar'` no CHECK constraint do Hub). Conceder o módulo a um papel/usuário é feito pela tela de administração de permissões do Hub — esta migration só cadastra o módulo no catálogo, não concede a ninguém.
- Frontend: aba nova "Aprovação da Equipe" em `Budgets.tsx` (`TeamApprovalTab.tsx`), visível a todos, mas com os botões de ação desabilitados se o usuário não passar no check de `hub_pode_executar` (chamado direto via `supabase.rpc`, sem hook — não existe hook de permissão reutilizável no sistema ainda).
- Rótulo de UI do novo status: `'Revisão da Equipe (Pós-Visita)'` (não confundir com `'Revisão Financeira Pendente'`, que é o rótulo de `'Aprovação Financeira'`).

## SPEC-051 — Fase explícita de Rascunho antes do envio ao cliente (2026-07-27)

- Removida a auto-transição de `rascunho`/`aguardando_cliente`/`aguardando_aprovacao` para `enviado_cliente` que existia em `handle_orcamento_workflow()` (trigger `trg_orcamento_workflow`, `BEFORE INSERT OR UPDATE ON orcamentos`) — antes disso, bastava preencher `empresa_id`, `projeto_id`, `cliente_id`, `forma_pagamento` e ter pelo menos 1 item para o orçamento "escapar" sozinho do rascunho.
- Removidos por completo o trigger `trg_orcamento_item_workflow` (`AFTER INSERT ON orcamento_itens`) e a função `handle_orcamento_item_workflow()` — era o gatilho mais direto do problema, porque disparava assim que o primeiro item era inserido (inclusive ao editar um rascunho e re-salvar itens via `replace_orcamento_itens`).
- `enviar_orcamento_para_cliente(p_orcamento_id uuid)` passou a ser o único ponto de entrada para `enviado_cliente` e agora valida completude antes do `UPDATE`: `empresa_id`, `projeto_id`, `cliente_id`, `forma_pagamento` não nulos e pelo menos 1 linha em `orcamento_itens`; se faltar algo, `RAISE EXCEPTION` (`ERRCODE = 'P0003'`) com mensagem listando o que falta, sem alterar o orçamento.
- Achado de bug pré-existente corrigido nesta SPEC: `src/stores/useBudgetStore.ts` (`enviarOrcamentoCliente`) chamava a RPC `enviar_orcamento_cliente` (sem "para"), que **não existe** no banco — só `enviar_orcamento_para_cliente` existe. O botão "Reenviar"/"Aprovar" de `ClientApprovalTab.tsx`/`BudgetTableRow.tsx` estava quebrado em produção antes desta correção.
- Frontend: nova aba "Rascunho" em `Budgets.tsx` (`DraftBudgetsTab.tsx`), listando orçamentos com `status === 'rascunho'` (helper `isDraftStatus` em `budget-status.ts`), com ações Editar e "Enviar para o Cliente". Também adicionado o branch equivalente em `BudgetTableRow.tsx` (aba "Todos"). Por decisão do usuário (P-2), **qualquer usuário autenticado** pode acionar "Enviar para o Cliente" a partir do rascunho — sem a restrição de papel (`admin`/`gerente`/`operador`) usada nas demais ações de aprovação/reenvio do sistema.
- Não existe botão "Salvar e Enviar" dentro do formulário de criação/edição (`BudgetFormPage.tsx`) — decisão explícita do usuário (P-4): o envio ao cliente é sempre uma ação separada, feita pela aba "Rascunho".
- `newBudget?.status === 'enviado_cliente'` em `BudgetFormPage.tsx` (pós-criação) deixou de ser alcançável a partir da criação (mantido como fallback defensivo) — a criação agora sempre resulta em `status = 'rascunho'`, e o toast do caminho normal orienta o usuário a usar a aba "Rascunho".
- Migration: `supabase/db/migrations/20260727_066_spec051_fase_rascunho_orcamento/` (redigida no repositório central, **aplicada no Supabase real em 2026-07-27** — confirmado por leitura direta do `pg_get_functiondef`/`pg_get_triggerdef`).

## SPEC-070 — Voltar Orçamento para Rascunho (2026-08-06)

- Nova RPC `voltar_orcamento_rascunho(p_orcamento_id uuid, p_motivo text)`: transição `enviado_cliente|recusado_cliente -> rascunho`, restrita a `usuarios.role IN ('admin','gerente')` (sem fallback via `hub_pode_executar`, diferente de `equipe_devolver_orcamento_cliente`). `p_motivo` obrigatório, gravado em `historico_status_orcamentos.observacao`. Seta `status = 'rascunho'` e `token_aprovacao_cliente = NULL` (invalida o link já enviado ao cliente; nenhum token novo é gerado até o reenvio via `enviar_orcamento_para_cliente`). `enviado_cliente_em`/`enviado_cliente_por`/`recusado_cliente_em` não são apagados.
- Migration redigida no repositório central, **ainda NÃO aplicada no Supabase real**: `supabase/db/migrations/20260806_082_spec070_voltar_orcamento_rascunho/001_voltar_orcamento_rascunho.sql`.
- Frontend: nova action `voltarOrcamentoRascunho(budget, motivo)` em `useBudgetStore.ts`. Botão "Voltar para Rascunho" (ícone `Undo2`) em `BudgetTableRow.tsx` e `ClientApprovalTab.tsx`, visível para `enviado_cliente`/`recusado_cliente`, restrito à mesma checagem `canApproveFinancial` (`canApproveQuotes || role === 'admin' || role === 'gerente'`) já usada em `BudgetTableRow.tsx` — não usar `canManageClient`/`APPROVAL_ROLES`, que incluem `operador`. Dialog de motivo obrigatório no mesmo padrão de `TeamApprovalTab.tsx` ("Devolver ao Cliente"). Após sucesso, o orçamento sai da aba "Aprovação do Cliente" e aparece na aba "Rascunho" automaticamente, só pela mudança de `status` (sem código extra).

## SPEC-135 — Reset falso-positivo do ciclo de aprovação + bloqueio de peça sem cadastro (2026-09-11)

- **Achado**: o único mecanismo real de reset do ciclo de aprovação em produção é o trigger `trg_orcamento_item_change_reset` (`AFTER INSERT OR DELETE OR UPDATE ON orcamento_itens`, função `handle_orcamento_item_change_reset()`) — dispara em **qualquer** escrita em `orcamento_itens` quando `orcamentos.status IN ('Aprovação Financeira','Orçamento Aprovado')`, sem comparar se o valor do item de fato mudou. `handle_orcamento_workflow()` (trigger em `orcamentos`) não tem lógica de reset por campo (confirmado via `pg_get_functiondef` direto no Supabase real — o corpo com reset por campo (`valor_total`/`forma_pagamento`/etc.) que aparece nas migrations locais do submodule (`20260707160000`/`170000`) nunca correspondeu ao que está de fato em produção).
- **Causa raiz do bug reportado por Vinícius** (editar só forma de pagamento/data fazia "voltar para enviado ao cliente"): `useBudgetStore.updateBudget` sempre chama `replace_orcamento_itens` (DELETE + INSERT de todos os itens) em qualquer salvamento do formulário, mesmo quando os itens não mudaram — isso já bastava para disparar o trigger acima.
- **Fix**: `replace_orcamento_itens` agora compara o conjunto de itens recebido com o já salvo (multiset, via `EXCEPT ALL` nos dois sentidos) e não mexe na tabela quando são idênticos — preserva a regra do SPEC-111 (mudança REAL de item/valor continua resetando).
- **2º achado, mesmo teste ao vivo**: `aprovar_orcamento_financeiro` não bloqueava itens com `produto_id IS NULL` (peça sem cadastro/código interno) — o item passava, gerava `projeto_itens`/parcela/boleto normalmente, só pulava a reserva de estoque (`CONTINUE WHEN v_item.produto_id IS NULL`), virando uma venda sem controle de estoque nenhum.
- **Fix**: `aprovar_orcamento_financeiro` agora bloqueia (RAISE EXCEPTION) a aprovação do ramo venda quando existe item com `produto_id IS NULL` — a devolução não é afetada (já tem sua própria validação de `projeto_item_origem_id`). Frontend (`FinancialApprovalDialog.tsx`) replica esse aviso antes de tentar (banner + checkbox/input desabilitados) e agora exibe via toast qualquer erro retornado pela RPC (antes o `catch` do dialog engolia o erro silenciosamente).
- Migration: `supabase/db/migrations/20260911_135_orcamento_aprovacao_financeira_fixes/001_fix_reset_falso_positivo_e_bloqueio_peca_sem_cadastro.sql` (repositório central).

## SPEC-136 — Número da venda (`orcamentos.numero_venda`), distinto do número do orçamento (2026-09-11)

- Nova coluna `orcamentos.numero_venda text` (nullable, sem backfill — orçamentos aprovados antes desta SPEC ficam com `NULL`).
- Gerado dentro de `aprovar_orcamento_financeiro`, só no ramo venda (natureza_operacao != 'devolucao'), no mesmo instante em que o status vira `'Orçamento Aprovado'`. Sequência global, formato `'VENDA-0001'`, mesmo padrão de `set_orcamento_numero()` (`MAX(...)+1` sobre o prefixo). Devolução não gera número de venda — é crédito sobre venda já existente, não uma venda nova.
- **Não é a mesma coisa que a tabela legada `public.vendas`** (numeração antiga do Connect — `cod_venda`/`num_nota`). Essa tabela existe, tem `historico_legado`, e `vw_financeiro_projetos`/`vw_projetos_pipeline`/`vw_projetos_resumo` já somam valores a partir dela — mas `aprovar_orcamento_financeiro` nunca insere nada ali, então esses 3 dashboards provavelmente não recebem nenhuma venda nova desde que o sistema de Orçamentos entrou em produção. Decisão explícita do usuário: não mexer nisso agora, `numero_venda` é um campo novo e independente. Gap documentado, não corrigido por esta SPEC.
- `vw_estoque_saldos_projeto_item` (usada pelo sistema de Separação) ganhou a coluna `venda_numero` (= `orcamentos.numero_venda`), ao lado de `orcamento_numero` que já existia.
- Migration: `supabase/db/migrations/20260911_136_orcamento_numero_venda/001_numero_venda.sql` (repositório central) — é superset da migration da SPEC-135 pra essa mesma função (pode ser aplicada sozinha).

## SPEC-152 — Melhorias no fluxo de Orçamento (reunião Vinícius 16/09/2026)

- **"Novo Cliente" dentro de "Criar Projeto"**: `ProjectCreateModal.tsx` ganhou o mesmo padrão já usado no campo Cliente do próprio orçamento (`BudgetFormPage.tsx`) e no CRM (`ProjectNew.tsx`) — botão "+" ao lado do `SearchableSelect` de Cliente, abrindo `ClientCreateModal.tsx` empilhado sem fechar o formulário de projeto. Prop nova `onClienteCriado` sincroniza o cliente novo de volta na lista global (`useOptions().clientes`/`setClientes`/`fetchClientes`).
- **Responsável da Obra → só Engenheiros**: `ProjectCreateModal.tsx` (`responsavel_obra_id`) passou a listar só contatos com `contato_tipos.tipo = 'engenheiro'` (join, não a coluna singular `contatos.tipo`) — cobre contato com múltiplos papéis, populada automaticamente por trigger sempre que `contatos.tipo` é gravado. Campo "Arquiteto" continua sem filtro (lista `arquitetos`, sem mudança). CRM (`lucenera-crm-3bd29`, `ProjectNew.tsx`/`ProjectDetail.tsx`) já filtrava corretamente (via `contatos.tipo = 'engenheiro'`, coluna singular) — verificado, sem necessidade de mudança lá.
- **Enum `public.pagamento_forma`**: ganhou `'carteira'` (novo) e reconfirmou `'permuta'` — achado da investigação: a migration `20260815_115_spec107_forma_pagamento_permuta` (SPEC-107, marcada "concluído") deveria ter aplicado `'permuta'` em produção, mas `src/lib/supabase/types.ts` (gerado do banco) não tinha o valor — suspeita de "Skip drift"/migration nunca de fato aplicada apesar do registro. Migration desta SPEC usa `ADD VALUE IF NOT EXISTS` pros dois valores (idempotente, seguro mesmo se `'permuta'` já existir).
  - `'carteira'`: gera `projeto_parcelas` normalmente, só **não gera boleto** — decisão do usuário (2026-09-17). Aparece em relatórios de saldo em aberto/pendências.
  - `'permuta'`: a parcela nasce com `status = 'paga'` (recebida, sem cobrança) e sem boleto; a aprovação lança automaticamente uma obrigação de Contas a Pagar espelhada — ver `projeto_parcelas.permuta_fornecedor_id` e a seção "Contrapartida de permuta" abaixo.
- **`orcamentos.plano_parcelas` (jsonb, nullable)**: array de `{numero, dias_offset, valor, forma_pagamento, permuta_fornecedor_id}` — substitui gradualmente `prazo_pagamento_dias` como fonte de **valor** de cada parcela (Opção B, decisão do usuário 2026-09-17). `prazo_pagamento_dias`/`condicoes_pagamento` continuam sendo gravados em paralelo (não removidos). Quando `NULL`/vazio, `aprovar_orcamento_financeiro` cai no comportamento legado (divisão igual de `valor_total`). UI editável por parcela em `BudgetFormPage.tsx` ("Plano de Parcelas"), com validação ao vivo + no backend (dentro da RPC) de que a soma bate **exatamente** com `valor_total` — bloqueia se não bater, nunca arredonda.
- **`projeto_parcelas.permuta_fornecedor_id` (uuid, `REFERENCES contatos(id)`, nullable)**: obrigatório na aplicação quando aquela parcela é `forma_pagamento = 'permuta'` — validado dentro de `aprovar_orcamento_financeiro` (exige que o contato exista e seja `tipo = 'fornecedor'`), não por CHECK de banco (pagamento_forma é enum compartilhado por todo o sistema).
- **Contrapartida de permuta**: em vez de criar uma FK nova em `negociacoes`/`transacoes` (que a SPEC cogitou como exemplo), a aprovação reaproveita o padrão manual já existente de "Cadastrar Duplicatas" (SPEC-073, `retorno-bancario-bradesco-5392a`/`CadastrarDuplicata.tsx`): insere um `boletos` com `tipo_operacao = 'CP'` + `apropriacao_id` (`plano_de_contas`), rastreado até a origem por `boletos.orcamento_id` — já existente, mesmo invariante do resto do sistema (`boletos.orcamento_id` é o link primário). Categoria nova em `plano_de_contas`: `'PERMUTA/CONTRAPARTIDA'` (nível 3/Apropriação, `codigo_connect = 90000035`, `parent_id` = "Com Vendas", `tipo = 'despesa'`) — decisão do usuário (2026-09-17). A função busca essa linha por nome (`WHERE nome = 'PERMUTA/CONTRAPARTIDA'`), não por id fixo.
- **`aprovar_orcamento_financeiro(uuid)`** (assinatura inalterada — o parâmetro `p_valores_parcelas numeric[]` cogitado pela migration abandonada da SPEC-133 (`20260914_141`) nunca foi aplicado em produção e não foi usado aqui): passou a ler `orcamentos.plano_parcelas` como fonte de valor/dias/forma por parcela quando presente; gera boleto normal só para parcelas cuja forma de pagamento não é `'carteira'`/`'permuta'`; gera a contrapartida de Contas a Pagar (`tipo_operacao = 'CP'`) para cada parcela `'permuta'`. Aplica-se aos dois ramos (venda e devolução).
- Migration: `supabase/db/migrations/20260917_152_melhorias_orcamento/` (repositório central) — dividida em 5 arquivos porque `ALTER TYPE ... ADD VALUE` (001) não pode rodar na mesma transação de DDL/DML que já usa o valor novo (002-005).
- PDF do orçamento (`supabase/functions/generate-report/index.ts`, `reportType === 'orcamento'`): parou de imprimir `condicoes_pagamento` como contagem de dias corridos (ex. "14/44/75") — agora desenha uma tabela de parcelas com número, vencimento absoluto (`data_inicio_pagamento` + `dias_offset`, ou "hoje" só como último fallback) e valor, reaproveitando `plano_parcelas` quando presente. Lógica duplicada localmente na Edge Function (`calcularParcelasPdf`) porque ela roda isolada em Deno, sem acesso ao bundle do frontend (`src/lib/budget-financial-summary.ts`).
- Bugs de UI corrigidos em `BudgetFormPage.tsx`: (1) campo "Quantidade de Parcelas" não deixava apagar o valor pra digitar outro (`z.coerce.number()` cravava de volta em 1 a cada tecla) — corrigido com `z.preprocess` (aceita string vazia em trânsito, normaliza só no submit/blur). (2) plano de pagamento não refletia edição ao vivo — não foi encontrado nenhum componente lendo de um snapshot antigo do `budget` carregado (a hipótese do "Bug 2" da SPEC); o novo bloco "Plano de Parcelas" já nasce 100% orientado a `form.watch()`, então esse sintoma não deve mais se repetir de qualquer forma. (3) campo "Quantidade de Parcelas" ficava oculto pra qualquer forma de pagamento fora `boleto`/`cartao` — ampliado para todas exceto `pix`/`dinheiro` (permite parcelar carteira/permuta/cheque/transferência).

## SPEC-007 — SSO entre sistemas

- Este app é origem ao abrir o Financeiro pelo modal pós-aprovação e destino quando o CRM abre `Gerar Orçamento`.
- Usar `src/lib/cross-system-auth.ts`.
- A migration `20260708_030_spec007_sso_cross_system` e as Edge Functions `generate-cross-system-code`/`exchange-cross-system-code` estão publicadas no Supabase remoto desde 2026-07-07; falta homologação com usuário real.
- Como origem, chamar `redirectWithCode(destino, redirectTo, sistemaDestino)`.
- Como destino, `AuthProvider` deve chamar `consumeCodeFromUrl('orcamentos')` antes de decidir que precisa mostrar login.
- Não passar tokens Supabase crus em URL. O fluxo usa apenas `sso_code`, trocado pela Edge Function `exchange-cross-system-code`.
