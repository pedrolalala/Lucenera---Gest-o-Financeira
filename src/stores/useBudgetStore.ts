import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import {
  computeSubOrdem,
  extractCircuitNumber,
  formatCircuitId,
  sortItemsByCircuitId,
} from '@/lib/utils'

export interface BudgetItem {
  id?: string
  uid?: string
  produto_id: string | null
  descricao?: string | null
  quantidade: number
  preco_unitario: number
  desconto: number
  custom_id?: string
  ordem?: number
  sub_ordem?: number
  item_pai_id?: string
  produto?: {
    nome: string
    codigo_produto?: number
    codigo_legado?: number
    referencia?: string
    unidade?: string
  }
}

export interface Budget {
  id: string
  numero: string | null
  empresa_id: string
  cliente_id: string
  projeto_id: string
  arquiteto_id: string | null
  vendedor_id: string | null
  status: string
  data_emissao: string
  validade: string | null
  condicoes_pagamento: string | null
  forma_pagamento: string | null
  prazo_inicio_cobranca_dias: number | null
  prazo_pagamento_dias: number[] | null
  frete_tipo: string | null
  frete_valor: number | null
  desconto_global: number | null
  observacoes: string | null
  valor_total: number
  requer_revisao_financeira: boolean | null
  created_at: string
  empresa?: { nome: string }
  cliente?: { nome: string }
  arquiteto?: { nome: string }
  vendedor?: { nome: string }
  projeto?: { nome: string; codigo: string }
  itens?: BudgetItem[]
}

export interface ApprovalResult {
  orcamento_id: string
  status: string
  projeto_id: string
  projeto_itens_criados: number
  parcelas_criadas: number
  boletos_criados: number
  nota_fiscal_status: string
  ja_processado: boolean
}

interface BudgetState {
  budgets: Budget[]
  loading: boolean
  initialized: boolean
  fetchBudgets: (filters?: any) => Promise<void>
  addBudget: (
    budget: Omit<
      Budget,
      'id' | 'created_at' | 'empresa' | 'cliente' | 'arquiteto' | 'itens'
    >,
    items: BudgetItem[],
  ) => Promise<void>
  updateBudget: (
    id: string,
    budget: Partial<Budget>,
    items: BudgetItem[],
  ) => Promise<void>
  updateBudgetStatus: (id: string, status: string) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  approveBudgetAndMigrate: (budget: Budget) => Promise<ApprovalResult>
}

const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  loading: false,
  initialized: false,

  fetchBudgets: async (filters) => {
    set({ loading: true })

    let query = supabase.from('orcamentos').select(`
      *,
      empresa:empresas(nome),
      cliente:contatos!orcamentos_cliente_id_fkey(nome),
      arquiteto:contatos!orcamentos_arquiteto_id_fkey(nome),
      projeto:projetos(nome, codigo),
      itens:orcamento_itens(
        id,
        produto_id,
        descricao,
        quantidade,
        preco_unitario,
        desconto,
        custom_id,
        ordem,
        sub_ordem,
        item_pai_id,
        produto:produtos(nome, codigo_produto, codigo_legado, referencia, unidade, porc_st)
      )
    `)

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      console.error('Error fetching budgets:', error)
      set({ loading: false, initialized: true })
      return
    }

    let filtered = data as unknown as Budget[]

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.cliente?.nome?.toLowerCase().includes(s) ||
          b.empresa?.nome?.toLowerCase().includes(s) ||
          b.numero?.toLowerCase().includes(s),
      )
    }

    filtered = filtered.map((b) => ({
      ...b,
      itens: b.itens ? sortItemsByCircuitId(b.itens) : b.itens,
    }))

    set({ budgets: filtered, loading: false, initialized: true })
  },

  addBudget: async (budget, items) => {
    const finalBudget = { ...budget }
    if (!finalBudget.numero) {
      delete (finalBudget as any).numero
    }

    const { data, error } = await supabase
      .from('orcamentos')
      .insert([finalBudget])
      .select()
      .single()

    if (error) {
      console.error('Error inserting budget:', error)
      throw new Error(error.message || 'Erro ao criar orçamento.')
    }

    if (items && items.length > 0) {
      const subOrdens = computeSubOrdem(items)
      const itemsToInsert = items.map((i, idx) => ({
        orcamento_id: data.id,
        produto_id: i.produto_id || null,
        descricao: i.descricao || null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
        custom_id: i.custom_id ? formatCircuitId(i.custom_id) : null,
        ordem: extractCircuitNumber(i.custom_id),
        sub_ordem: subOrdens[idx],
        item_pai_id: i.item_pai_id || null,
      }))
      const { error: itemsError } = await supabase
        .from('orcamento_itens')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Error inserting budget items:', itemsError)
        throw new Error(
          itemsError.message || 'Erro ao inserir itens do orçamento.',
        )
      }
    }

    await get().fetchBudgets()
  },

  updateBudget: async (id, budget, items) => {
    const { error } = await supabase
      .from('orcamentos')
      .update(budget)
      .eq('id', id)

    if (error) {
      console.error('Error updating budget:', error)
      throw new Error(error.message || 'Erro ao atualizar orçamento.')
    }

    if (items && items.length > 0) {
      const subOrdens = computeSubOrdem(items)
      const itemsPayload = items.map((i, idx) => ({
        orcamento_id: id,
        produto_id: i.produto_id || null,
        descricao: i.descricao || null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
        custom_id: i.custom_id ? formatCircuitId(i.custom_id) : null,
        ordem: extractCircuitNumber(i.custom_id),
        sub_ordem: subOrdens[idx],
        item_pai_id: i.item_pai_id || null,
      }))

      const { error: rpcError } = await (supabase as any).rpc(
        'replace_orcamento_itens',
        {
          p_orcamento_id: id,
          p_items: itemsPayload,
        },
      )

      if (rpcError) {
        console.error('Error updating budget items:', rpcError)
        throw new Error(
          rpcError.message || 'Erro ao atualizar itens do orçamento.',
        )
      }
    } else {
      const { error: deleteError } = await supabase
        .from('orcamento_itens')
        .delete()
        .eq('orcamento_id', id)

      if (deleteError) {
        console.error('Error deleting budget items:', deleteError)
        throw new Error(
          deleteError.message || 'Erro ao remover itens do orçamento.',
        )
      }
    }

    await get().fetchBudgets()
  },

  updateBudgetStatus: async (id, status) => {
    const { error } = await supabase
      .from('orcamentos')
      .update({ status })
      .eq('id', id)
    if (error) throw error

    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, status } : b)),
    }))
  },

  deleteBudget: async (id) => {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) throw error
    await get().fetchBudgets()
  },

  approveBudgetAndMigrate: async (budget) => {
    const { data, error } = await (supabase as any).rpc(
      'aprovar_orcamento_financeiro',
      { p_orcamento_id: budget.id },
    )

    if (error) {
      console.error('Error approving budget:', error)
      throw new Error(error.message || 'Erro ao aprovar orçamento.')
    }

    await get().fetchBudgets()

    return data as ApprovalResult
  },
}))

export default useBudgetStore
