# Ecossistema Lucenera — contexto local

Este sistema faz parte de um ecossistema maior da Lucenera.

O objetivo atual é substituir o uso do Connect com um conjunto de sistemas mais simples, focado nas funções necessárias para a operação.

## Sistemas do ecossistema

- Cadastro: dados cadastrais de clientes, contatos, empresas, fornecedores, produtos e funcionários.
- Orçamentos: criação, revisão e aprovação de orçamentos.
- Administração Bancária: boletos, notas fiscais, remessa, retorno e validações financeiras.
- CRM: timeline, etapas, sub-status, checklists, responsáveis e SLA.
- Logística: separação, entrega e acompanhamento operacional de itens aprovados.
- RH: funcionários, férias, faltas, folha e benefícios.
- Catálogo/Produtos: consulta de produtos, peças e disponibilidade.
- Hub/TI: sistemas, acessos, permissões e saúde dos módulos.
- Estoque/Compras: sistema futuro para compras, estoque e movimentações operacionais.

## Diretrizes compartilhadas do ecossistema

- O ecossistema usa um Supabase compartilhado entre módulos.
- Evitar duplicar a mesma regra de negócio em vários sistemas.
- Quando um módulo precisar de dado de outro, preferir relacionamento, consulta ou view existente.
- Se o schema atual não atender uma necessidade, registrar a solicitação de mudança de banco antes de criar código dependente.
- O objetivo atual é substituir o uso do ERP Externo com módulos simples, focados no fluxo necessário.

## Como lidar com mudanças de banco

Este projeto pode não conter a fonte completa do banco.

Quando uma demanda exigir alteração estrutural de banco, registre a necessidade no formato de `DB_CHANGE_REQUEST_TEMPLATE.md`.

Evite corrigir erro de schema inventando tabela, coluna ou função no código.
