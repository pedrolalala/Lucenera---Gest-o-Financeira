import { supabase } from '@/lib/supabase/client'

// SPEC-071: representa uma linha de "estoque_saldos_projeto_item" (venda já
// aprovada) que ainda tem saldo passível de devolução para o cliente do
// orçamento de devolução em edição.
export interface VendaOrigemItem {
  projeto_item_id: string
  projeto_id: string
  produto_id: string | null
  produto: string | null
  produto_codigo: number | null
  projeto_codigo: string | null
  orcamento_numero: string | null
  preco_unitario: number
  desconto: number
  l_fixo: string | null
  quantidade_disponivel: number
}

// SPEC-071 (P-2): busca cruza todos os projetos do cliente, não só o projeto
// do orçamento de devolução em edição — o mesmo produto pode ter sido
// vendido ao cliente em obras diferentes.
//
// SPEC-105 (achado 2026-08-15): `projetos.cliente_id` pode divergir do
// `orcamentos.cliente_id` que gerou a venda original — confirmado com dados
// reais (ex.: projeto 26.250 tem cliente_id de um contato, mas a venda que
// criou o saldo em estoque_saldos_projeto_item ficou gravada com o
// cliente_id de outro contato). Buscar só por cliente_id do projeto atual
// fazia a busca voltar vazia mesmo com saldo real disponível. Também cobre
// o caso de `projetos.cliente_id` NULL (a busca antes nem rodava). Fix:
// aceita clienteId E/OU projetoId, e casa por QUALQUER um dos dois (OR) —
// mantém a busca cross-projeto por cliente (SPEC-071) e ainda encontra
// vendas do projeto atual mesmo se o cliente gravado nelas for outro.
export async function getVendasOrigemParaDevolucao(
  clienteId: string | null | undefined,
  projetoId: string | null | undefined,
  search = '',
): Promise<VendaOrigemItem[]> {
  if (!clienteId && !projetoId) return []

  const orParts: string[] = []
  if (clienteId) orParts.push(`cliente_id.eq.${clienteId}`)
  if (projetoId) orParts.push(`projeto_id.eq.${projetoId}`)

  let query = supabase
    .from('vw_estoque_saldos_projeto_item')
    .select(
      'projeto_item_id, projeto_id, produto_id, produto, produto_codigo, projeto_codigo, orcamento_numero, q_reserva, q_entrega_futura, q_entregue, status_operacional',
    )
    .or(orParts.join(','))
    .eq('status_operacional', 'ativo')

  const t = search.trim()
  if (t) {
    const numericTerm = Number(t)
    if (!isNaN(numericTerm) && t !== '') {
      query = query.or(`produto.ilike.%${t}%,produto_codigo.eq.${numericTerm}`)
    } else {
      // SPEC-116: multi-termo em qualquer ordem — cada palavra digitada
      // precisa aparecer no nome do produto (não precisa ser a frase
      // inteira). Encadear .ilike() na mesma coluna gera múltiplos
      // parâmetros `produto=ilike.*termo*` na URL, que o PostgREST some
      // como AND (mesmo comportamento de múltiplos filtros na mesma
      // coluna). A view não expõe marca/descrição, então a busca continua
      // restrita ao nome do produto — o resto (cliente/projeto) já é
      // aplicado fora do texto livre.
      search
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .forEach((term) => {
          query = query.ilike('produto', `%${term}%`)
        })
    }
  }

  const { data, error } = await query
    .order('produto', { ascending: true })
    .limit(200)
  if (error) throw error

  // SPEC-071: só interessa venda de origem com saldo em setor devolvível —
  // mesma soma usada pela RPC registrar_devolucao_projeto_item (cascata
  // q_entrega_futura -> q_reserva -> q_entregue).
  const rows = (data || []).filter(
    (r: any) =>
      (r.q_reserva ?? 0) + (r.q_entrega_futura ?? 0) + (r.q_entregue ?? 0) > 0,
  )
  if (rows.length === 0) return []

  // vw_estoque_saldos_projeto_item não expõe preço/desconto/l_fixo — busca
  // complementar em projeto_itens só para as linhas já filtradas.
  const { data: pi, error: piError } = await supabase
    .from('projeto_itens')
    .select('id, preco_unitario, desconto, l_fixo')
    .in(
      'id',
      rows.map((r: any) => r.projeto_item_id),
    )
  if (piError) throw piError

  const piMap = new Map((pi || []).map((p: any) => [p.id, p]))

  return rows.map((r: any) => {
    const detalhe = piMap.get(r.projeto_item_id)
    return {
      projeto_item_id: r.projeto_item_id,
      projeto_id: r.projeto_id,
      produto_id: r.produto_id,
      produto: r.produto,
      produto_codigo: r.produto_codigo,
      projeto_codigo: r.projeto_codigo,
      orcamento_numero: r.orcamento_numero,
      preco_unitario: detalhe?.preco_unitario ?? 0,
      desconto: detalhe?.desconto ?? 0,
      l_fixo: detalhe?.l_fixo ?? null,
      quantidade_disponivel:
        (r.q_reserva ?? 0) + (r.q_entrega_futura ?? 0) + (r.q_entregue ?? 0),
    }
  })
}
