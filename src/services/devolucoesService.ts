import { supabase } from '@/lib/supabase/client'

// SPEC-178 (R3): setores da venda onde a peça está. SPEC-182 (D6): "Em
// separação" (a separar + separado) aparece na busca, mas NÃO pode ser
// devolvido — é preciso cancelar a separação antes.
export type SetorDevolucao =
  | 'reserva'
  | 'entrega_futura'
  | 'em_separacao'
  | 'entregue'

export const SETOR_DEVOLUCAO_LABEL: Record<SetorDevolucao, string> = {
  reserva: 'Reserva',
  entrega_futura: 'Entrega futura',
  em_separacao: 'Em separação',
  entregue: 'Entregue',
}

export const setorDevolvivel = (setor: SetorDevolucao) =>
  setor !== 'em_separacao'

// Saldo de cada setor numa linha de vw_estoque_saldos_projeto_item.
// SPEC-182 (D7): o Entregue não baixa na devolução (fica como histórico); o
// que ainda pode voltar dele é q_entregue − q_devolvida_entregue.
export function saldoPorSetor(r: any): Record<SetorDevolucao, number> {
  return {
    reserva: Number(r.q_reserva) || 0,
    entrega_futura: Number(r.q_entrega_futura) || 0,
    em_separacao: (Number(r.q_ag_separar) || 0) + (Number(r.q_separado) || 0),
    entregue: Math.max(
      0,
      (Number(r.q_entregue) || 0) - (Number(r.q_devolvida_entregue) || 0),
    ),
  }
}

// Soma do que pode ser devolvido agora (sem "em separação").
const saldoDevolvivel = (s: Record<SetorDevolucao, number>) =>
  s.reserva + s.entrega_futura + s.entregue

// SPEC-071: representa uma linha de "estoque_saldos_projeto_item" (venda já
// aprovada) que ainda tem saldo no projeto do orçamento de devolução.
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
  // devolvido do item somando os setores devolvíveis.
  chave: string
  setor: SetorDevolucao
  // SPEC-182 (D6): false em "Em separação" — a linha aparece bloqueada.
  devolvivel: boolean
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
  // Preço unitário líquido = preço x (1 - desconto do item) x (1 - desconto
  // global da venda), arredondado em centavos. SPEC-182 (D9): a tela mostra só
  // o líquido, sem o percentual de desconto.
  preco_liquido: number
  // Equipe da venda de origem: a devolução herda vendedor e arquitetos
  // quando ainda não tem (decisão do usuário, 02/10).
  vendedor_id: string | null
  arquitetos: { arquiteto_id: string; nome: string; percentual: number }[]
}

// SPEC-178: percentual de desconto global efetivo de uma venda. Mesma regra
// do formulário (SPEC-068/SPEC-078): percentual direto, ou valor em R$
// convertido sobre o subtotal já descontado o sinal.
function descontoGlobalPercentual(
  orc: {
    desconto_global: number | null
    desconto_tipo: string | null
    valor_sinal: number | null
  },
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
) =>
  Math.round(
    preco * (1 - descontoItemPct / 100) * (1 - descontoVendaPct / 100) * 100,
  ) / 100

// SPEC-182 (D2): empresas em que o projeto tem venda efetivada, com os
// números das vendas — uma só preenche a empresa da devolução; mais de uma
// mostra o aviso para a pessoa escolher.
export interface EmpresaVendaProjeto {
  id: string
  nome: string
  vendas: string[]
}

export async function empresasComVendaNoProjeto(
  projetoId: string,
): Promise<EmpresaVendaProjeto[]> {
  const { data, error } = await (supabase.from('orcamentos') as any)
    .select('empresa_id, numero_venda, empresa:empresas(nome)')
    .eq('projeto_id', projetoId)
    .eq('natureza_operacao', 'venda')
    .not('numero_venda', 'is', null)
    .order('numero_venda', { ascending: true })
  if (error) throw error
  const mapa = new Map<string, EmpresaVendaProjeto>()
  ;(data || []).forEach((o: any) => {
    if (!o.empresa_id) return
    const nome =
      (Array.isArray(o.empresa) ? o.empresa[0]?.nome : o.empresa?.nome) ||
      'Empresa'
    const e = mapa.get(o.empresa_id) || { id: o.empresa_id, nome, vendas: [] }
    e.vendas.push(String(o.numero_venda).replace(/^VENDA-/i, ''))
    mapa.set(o.empresa_id, e)
  })
  return [...mapa.values()]
}

// SPEC-182 (D1/D2/D3): a devolução se liga ao CÓDIGO DO PROJETO — a busca
// olha todas as vendas efetivadas do projeto feitas pela empresa escolhida, e
// o filtro aceita o código da peça (ou o nome).
export async function getVendasOrigemParaDevolucao(
  projetoId: string | null | undefined,
  empresaId: string | null | undefined,
  search = '',
): Promise<VendaOrigemItem[]> {
  if (!projetoId || !empresaId) return []

  // any: a cadeia de filtros reatribuída estoura a inferência do supabase-js
  // (TS2589).
  let query: any = (supabase.from('vw_estoque_saldos_projeto_item') as any)
    .select(
      'projeto_item_id, projeto_id, orcamento_id, produto_id, produto, produto_codigo, projeto_codigo, orcamento_numero, venda_numero, empresa_id, q_venda, q_reserva, q_entrega_futura, q_ag_separar, q_separado, q_entregue, q_devolvida, q_devolvida_entregue, status_operacional',
    )
    .eq('status_operacional', 'ativo')
    .eq('projeto_id', projetoId)
    .eq('empresa_id', empresaId)
    .not('venda_numero', 'is', null)

  const t = search.trim()
  if (t) {
    const numericTerm = Number(t)
    if (!isNaN(numericTerm) && t !== '') {
      query = query.or(`produto.ilike.%${t}%,produto_codigo.eq.${numericTerm}`)
    } else {
      // SPEC-116: multi-termo em qualquer ordem — cada palavra digitada
      // precisa aparecer no nome do produto.
      t.split(/\s+/)
        .filter(Boolean)
        .forEach((term) => {
          query = query.ilike('produto', `%${term}%`)
        })
    }
  }

  const { data, error } = await query
    .order('produto', { ascending: true })
    .limit(300)
  if (error) throw error

  // Só linhas com algo em algum setor (inclusive "em separação", que aparece
  // bloqueada).
  const rows = (data || []).filter((r: any) => {
    const s = saldoPorSetor(r)
    return saldoDevolvivel(s) + s.em_separacao > 0
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
  const orcamentoIds = [
    ...new Set(rows.map((r: any) => r.orcamento_id).filter(Boolean)),
  ]
  const produtoIds = [
    ...new Set(rows.map((r: any) => r.produto_id).filter(Boolean)),
  ]
  const [orcRes, subRes, prodRes] = await Promise.all([
    supabase
      .from('orcamentos')
      .select(
        'id, empresa_id, vendedor_id, desconto_global, desconto_tipo, valor_sinal, empresa:empresas(nome), arquitetos:orcamento_arquitetos(percentual, arquiteto:arquiteto_id(id, nome))',
      )
      .in('id', orcamentoIds),
    supabase
      .from('projeto_itens')
      .select('orcamento_id, subtotal')
      .in('orcamento_id', orcamentoIds),
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
  const refMap = new Map(
    (prodRes.data || []).map((p: any) => [p.id, p.referencia]),
  )

  return rows.flatMap((r: any) => {
    const detalhe = piMap.get(r.projeto_item_id)
    const orc: any = orcMap.get(r.orcamento_id)
    const preco = Number(detalhe?.preco_unitario) || 0
    const descontoItem = Number(detalhe?.desconto) || 0
    const descontoVenda = orc
      ? descontoGlobalPercentual(orc, subtotalPorOrc.get(orc.id) || 0)
      : 0
    const setores = saldoPorSetor(r)
    const base = {
      orcamento_id: r.orcamento_id ?? null,
      venda_numero: r.venda_numero,
      empresa_id: r.empresa_id ?? orc?.empresa_id ?? null,
      empresa_nome:
        (Array.isArray(orc?.empresa)
          ? orc.empresa[0]?.nome
          : orc?.empresa?.nome) ?? null,
      referencia: r.produto_id ? (refMap.get(r.produto_id) ?? null) : null,
      quantidade_venda: Number(r.q_venda) || 0,
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
      saldo_item: saldoDevolvivel(setores),
      quantidade_devolvida: Number(r.q_devolvida) || 0,
    }
    // R3/D5: uma linha por setor com saldo — nunca somar setores numa linha.
    return (Object.keys(setores) as SetorDevolucao[])
      .filter((setor) => setores[setor] > 0)
      .map((setor) => ({
        ...base,
        chave: `${r.projeto_item_id}:${setor}`,
        setor,
        devolvivel: setorDevolvivel(setor),
        quantidade_disponivel: setores[setor],
      }))
  })
}

// Conferência na hora de salvar o orçamento de devolução (vale também para
// devolução já gravada). BLOQUEIA: item que não é de venda efetivada do mesmo
// projeto e da mesma empresa; linha "em separação"; quantidade acima do saldo.
export interface ConferenciaDevolucao {
  erro: string | null
  aviso: string | null
}

export async function validarItensDevolucao(
  empresaId: string | null | undefined,
  projetoId: string | null | undefined,
  itens: {
    projeto_item_origem_id?: string | null
    setor_origem?: string | null
    quantidade: number
    descricao?: string
  }[],
): Promise<ConferenciaDevolucao> {
  if (!projetoId)
    return {
      erro: 'Selecione o código do projeto da devolução antes de salvar.',
      aviso: null,
    }
  if (!empresaId)
    return {
      erro: 'Selecione a empresa da devolução antes de salvar.',
      aviso: null,
    }
  const linhas = itens.filter((i) => i.projeto_item_origem_id)
  if (linhas.length === 0) return { erro: null, aviso: null }

  const origemIds = [
    ...new Set(linhas.map((i) => i.projeto_item_origem_id as string)),
  ]
  const { data: saldos, error } = await supabase
    .from('vw_estoque_saldos_projeto_item')
    .select(
      'projeto_item_id, projeto_id, empresa_id, venda_numero, q_reserva, q_entrega_futura, q_ag_separar, q_separado, q_entregue, q_devolvida_entregue',
    )
    .in('projeto_item_id', origemIds)
  if (error) throw error
  const saldoMap = new Map(
    (saldos || []).map((r: any) => [r.projeto_item_id, r]),
  )

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
      return {
        erro: `"${nome}" não está vinculado a uma venda efetivada (sem número de venda). Toda devolução precisa vir de uma venda.`,
        aviso: null,
      }
    }
    const venda = String(saldo.venda_numero).replace(/^VENDA-/i, '')
    if (saldo.projeto_id !== projetoId) {
      return {
        erro: `"${nome}" é da venda ${venda}, de outro projeto. Remova o item ou troque o projeto.`,
        aviso: null,
      }
    }
    if (saldo.empresa_id !== empresaId) {
      return {
        erro: `"${nome}" é da venda ${venda}, feita por outra empresa; a devolução precisa ser da mesma empresa da venda.`,
        aviso: null,
      }
    }
    if (i.setor_origem === 'em_separacao') {
      return {
        erro: `"${nome}" está em separação (venda ${venda}). Cancele a separação antes de devolver.`,
        aviso: null,
      }
    }
    const setores = saldoPorSetor(saldo)
    const disponivel = saldoDevolvivel(setores)
    if (
      (qtdPorOrigem.get(i.projeto_item_origem_id as string) || 0) >
      disponivel + 1e-9
    ) {
      return {
        erro: `"${nome}": a quantidade a devolver passa do saldo do item (${disponivel}) na venda ${venda}.`,
        aviso: null,
      }
    }
    if (i.setor_origem) {
      const setor = i.setor_origem as SetorDevolucao
      const k = `${i.projeto_item_origem_id}:${setor}`
      if ((qtdPorSetor.get(k) || 0) > (setores[setor] ?? 0) + 1e-9) {
        return {
          erro: `"${nome}": a quantidade a devolver de ${SETOR_DEVOLUCAO_LABEL[setor] || setor} passa do saldo desse setor (${setores[setor] ?? 0}) na venda ${venda}.`,
          aviso: null,
        }
      }
    }
  }
  return { erro: null, aviso: null }
}
