import { supabase } from '@/lib/supabase/client'

// SPEC-178 (R3): setores da venda de onde uma devolução pode sair. "Em
// separação" = a separar + separado (decisão do usuário, 02/10).
export type SetorDevolucao = 'reserva' | 'entrega_futura' | 'em_separacao' | 'entregue'

export const SETOR_DEVOLUCAO_LABEL: Record<SetorDevolucao, string> = {
  reserva: 'Reserva',
  entrega_futura: 'Entrega futura',
  em_separacao: 'Em separação',
  entregue: 'Entregue',
}

// Saldo de cada setor numa linha de vw_estoque_saldos_projeto_item.
export function saldoPorSetor(r: any): Record<SetorDevolucao, number> {
  return {
    reserva: Number(r.q_reserva) || 0,
    entrega_futura: Number(r.q_entrega_futura) || 0,
    em_separacao: (Number(r.q_ag_separar) || 0) + (Number(r.q_separado) || 0),
    entregue: Number(r.q_entregue) || 0,
  }
}

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
  // SPEC-178: cada linha é UM setor de um item da venda. quantidade_disponivel
  // é o saldo desse setor (limite da linha); saldo_item é o que ainda pode ser
  // devolvido do item somando todos os setores (vendido − já devolvido).
  chave: string
  setor: SetorDevolucao
  quantidade_disponivel: number
  saldo_item: number
  quantidade_devolvida: number
  // SPEC-178: dados da venda de origem usados na devolução.
  orcamento_id: string | null
  venda_numero: string
  empresa_id: string | null
  empresa_nome: string | null
  referencia: string | null
  quantidade_venda: number
  // Desconto global da venda (%), já convertido quando a venda usou desconto
  // em R$ (SPEC-068), e o preço unitário líquido = preço x (1 - desconto do
  // item) x (1 - desconto global), arredondado em centavos.
  desconto_venda_percentual: number
  preco_liquido: number
  // Equipe da venda de origem: a devolução herda empresa, vendedor e
  // arquitetos da venda (decisão do usuário, 02/10).
  vendedor_id: string | null
  arquitetos: { arquiteto_id: string; nome: string; percentual: number }[]
}

// SPEC-178: percentual de desconto global efetivo de uma venda. Mesma regra
// do formulário (SPEC-068/SPEC-078): percentual direto, ou valor em R$
// convertido sobre o subtotal já descontado o sinal.
function descontoGlobalPercentual(
  orc: { desconto_global: number | null; desconto_tipo: string | null; valor_sinal: number | null },
  subtotalItens: number,
): number {
  const d = Number(orc.desconto_global) || 0
  if (d <= 0) return 0
  if (orc.desconto_tipo === 'valor') {
    const base = Math.max(0, subtotalItens - (Number(orc.valor_sinal) || 0))
    return base > 0 ? Math.min(100, (Math.min(d, base) / base) * 100) : 0
  }
  return Math.min(100, d)
}

export const precoLiquidoDevolucao = (
  preco: number,
  descontoItemPct: number,
  descontoVendaPct: number,
) => Math.round(preco * (1 - descontoItemPct / 100) * (1 - descontoVendaPct / 100) * 100) / 100

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
      'projeto_item_id, projeto_id, orcamento_id, produto_id, produto, produto_codigo, projeto_codigo, orcamento_numero, venda_numero, q_venda, q_reserva, q_entrega_futura, q_ag_separar, q_separado, q_entregue, q_devolvida, status_operacional',
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

  // SPEC-178: devolução só de VENDA efetivada (com número de venda). R1: o
  // disponível para devolução é tudo o que foi vendido e ainda não devolvido,
  // em qualquer situação — reserva, entrega futura, em separação ou entregue
  // (não é o estoque do produto).
  const rows = (data || []).filter((r: any) => {
    if (!r.venda_numero) return false
    const s = saldoPorSetor(r)
    return s.reserva + s.entrega_futura + s.em_separacao + s.entregue > 0
  })
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

  // SPEC-178: empresa e desconto global de cada venda de origem, referência
  // do produto e subtotal da venda (para converter desconto em R$).
  const orcamentoIds = [...new Set(rows.map((r: any) => r.orcamento_id).filter(Boolean))]
  const produtoIds = [...new Set(rows.map((r: any) => r.produto_id).filter(Boolean))]
  const [orcRes, subRes, prodRes] = await Promise.all([
    supabase
      .from('orcamentos')
      .select(
        'id, empresa_id, vendedor_id, desconto_global, desconto_tipo, valor_sinal, empresa:empresas(nome), arquitetos:orcamento_arquitetos(percentual, arquiteto:arquiteto_id(id, nome))',
      )
      .in('id', orcamentoIds),
    supabase.from('projeto_itens').select('orcamento_id, subtotal').in('orcamento_id', orcamentoIds),
    produtoIds.length > 0
      ? supabase.from('produtos').select('id, referencia').in('id', produtoIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ])
  if (orcRes.error) throw orcRes.error
  if (subRes.error) throw subRes.error
  if (prodRes.error) throw prodRes.error

  const subtotalPorOrc = new Map<string, number>()
  ;(subRes.data || []).forEach((r: any) =>
    subtotalPorOrc.set(
      r.orcamento_id,
      (subtotalPorOrc.get(r.orcamento_id) || 0) + (Number(r.subtotal) || 0),
    ),
  )
  const orcMap = new Map((orcRes.data || []).map((o: any) => [o.id, o]))
  const refMap = new Map((prodRes.data || []).map((p: any) => [p.id, p.referencia]))

  return rows.flatMap((r: any) => {
    const detalhe = piMap.get(r.projeto_item_id)
    const orc: any = orcMap.get(r.orcamento_id)
    const preco = Number(detalhe?.preco_unitario) || 0
    const descontoItem = Number(detalhe?.desconto) || 0
    const descontoVenda = orc ? descontoGlobalPercentual(orc, subtotalPorOrc.get(orc.id) || 0) : 0
    const setores = saldoPorSetor(r)
    const saldoItem =
      setores.reserva + setores.entrega_futura + setores.em_separacao + setores.entregue
    const base = {
      orcamento_id: r.orcamento_id ?? null,
      venda_numero: r.venda_numero,
      empresa_id: orc?.empresa_id ?? null,
      empresa_nome: (Array.isArray(orc?.empresa) ? orc.empresa[0]?.nome : orc?.empresa?.nome) ?? null,
      referencia: r.produto_id ? (refMap.get(r.produto_id) ?? null) : null,
      quantidade_venda: Number(r.q_venda) || 0,
      desconto_venda_percentual: descontoVenda,
      preco_liquido: precoLiquidoDevolucao(preco, descontoItem, descontoVenda),
      vendedor_id: orc?.vendedor_id ?? null,
      arquitetos: ((orc?.arquitetos as any[]) || [])
        .filter((a) => a.arquiteto)
        .map((a) => ({
          arquiteto_id: a.arquiteto.id,
          nome: a.arquiteto.nome,
          percentual: Number(a.percentual) || 0,
        })),
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
      saldo_item: saldoItem,
      quantidade_devolvida: Number(r.q_devolvida) || 0,
    }
    // R3: uma linha por setor com saldo — nunca somar setores numa linha só.
    return (Object.keys(setores) as SetorDevolucao[])
      .filter((setor) => setores[setor] > 0)
      .map((setor) => ({
        ...base,
        chave: `${r.projeto_item_id}:${setor}`,
        setor,
        quantidade_disponivel: setores[setor],
      }))
  })
}

// SPEC-178: conferência na hora de salvar o orçamento de devolução — vale
// também para devolução já gravada e para troca de empresa depois de lançar
// os itens. Regras: (1) toda linha vem de uma VENDA efetivada (com número de
// venda); (2) a venda de origem é da MESMA empresa da devolução; (3) a
// quantidade a devolver não passa do saldo disponível para devolução.
// Devolve a mensagem do primeiro problema, ou null se estiver tudo certo.
export async function validarItensDevolucao(
  empresaId: string | null | undefined,
  itens: {
    projeto_item_origem_id?: string | null
    setor_origem?: string | null
    quantidade: number
    descricao?: string
  }[],
): Promise<string | null> {
  const linhas = itens.filter((i) => i.projeto_item_origem_id)
  if (linhas.length === 0) return null
  if (!empresaId) return 'Selecione a empresa da devolução antes de salvar.'

  const origemIds = [...new Set(linhas.map((i) => i.projeto_item_origem_id as string))]
  const { data: saldos, error } = await supabase
    .from('vw_estoque_saldos_projeto_item')
    .select(
      'projeto_item_id, orcamento_id, venda_numero, q_reserva, q_entrega_futura, q_ag_separar, q_separado, q_entregue',
    )
    .in('projeto_item_id', origemIds)
  if (error) throw error
  const saldoMap = new Map((saldos || []).map((r: any) => [r.projeto_item_id, r]))

  const orcIds = [...new Set((saldos || []).map((r: any) => r.orcamento_id).filter(Boolean))]
  const { data: orcs, error: orcError } = orcIds.length
    ? await supabase.from('orcamentos').select('id, empresa_id, empresa:empresas(nome)').in('id', orcIds)
    : { data: [] as any[], error: null }
  if (orcError) throw orcError
  const orcMap = new Map((orcs || []).map((o: any) => [o.id, o]))

  // R2: soma por item (todos os setores) e por item+setor (R3).
  const qtdPorOrigem = new Map<string, number>()
  const qtdPorSetor = new Map<string, number>()
  linhas.forEach((i) => {
    const q = Number(i.quantidade) || 0
    const origem = i.projeto_item_origem_id as string
    qtdPorOrigem.set(origem, (qtdPorOrigem.get(origem) || 0) + q)
    if (i.setor_origem) {
      const k = `${origem}:${i.setor_origem}`
      qtdPorSetor.set(k, (qtdPorSetor.get(k) || 0) + q)
    }
  })

  for (const i of linhas) {
    const nome = i.descricao || 'item'
    const saldo: any = saldoMap.get(i.projeto_item_origem_id as string)
    if (!saldo || !saldo.venda_numero) {
      return `"${nome}" não está vinculado a uma venda efetivada (sem número de venda). Toda devolução precisa vir de uma venda.`
    }
    const orc: any = orcMap.get(saldo.orcamento_id)
    if (!orc || orc.empresa_id !== empresaId) {
      const empresaVenda = Array.isArray(orc?.empresa) ? orc.empresa[0]?.nome : orc?.empresa?.nome
      return `"${nome}" foi vendido pela empresa ${empresaVenda || 'de outra venda'} (${saldo.venda_numero}). A devolução precisa ser feita pela mesma empresa da venda.`
    }
    const setores = saldoPorSetor(saldo)
    const disponivel =
      setores.reserva + setores.entrega_futura + setores.em_separacao + setores.entregue
    if ((qtdPorOrigem.get(i.projeto_item_origem_id as string) || 0) > disponivel + 1e-9) {
      return `"${nome}": a quantidade a devolver passa do saldo do item (vendido − já devolvido = ${disponivel}) na ${saldo.venda_numero}.`
    }
    if (i.setor_origem) {
      const setor = i.setor_origem as SetorDevolucao
      const k = `${i.projeto_item_origem_id}:${setor}`
      if ((qtdPorSetor.get(k) || 0) > (setores[setor] ?? 0) + 1e-9) {
        return `"${nome}": a quantidade a devolver de ${SETOR_DEVOLUCAO_LABEL[setor] || setor} passa do saldo desse setor (${setores[setor] ?? 0}) na ${saldo.venda_numero}.`
      }
    }
  }
  return null
}
