import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface BudgetItem {
  id?: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  desconto: number
  custom_id?: string
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
  arquiteto_id: string | null
  vendedor_id: string | null
  status: string
  data_emissao: string
  validade: string | null
  condicoes_pagamento: string | null
  forma_pagamento: string | null
  desconto_global: number | null
  observacoes: string | null
  valor_total: number
  created_at: string
  empresa?: { nome: string }
  cliente?: { nome: string }
  arquiteto?: { nome: string }
  vendedor?: { nome: string }
  itens?: BudgetItem[]
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
  deleteBudget: (id: string) => Promise<void>
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
      vendedor:funcionarios!orcamentos_vendedor_id_fkey(nome),
      itens:orcamento_itens(
        id,
        produto_id,
        quantidade,
        preco_unitario,
        desconto,
        custom_id,
        item_pai_id,
        produto:produtos(nome, codigo_produto, codigo_legado, referencia, unidade)
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
    if (error) throw error

    if (items && items.length > 0) {
      const itemsToInsert = items.map((i) => ({
        orcamento_id: data.id,
        produto_id: i.produto_id || null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
        custom_id: i.custom_id || null,
        item_pai_id: i.item_pai_id || null,
      }))
      const { error: itemsError } = await supabase
        .from('orcamento_itens')
        .insert(itemsToInsert)
      if (itemsError) throw itemsError
    }

    await get().fetchBudgets()
  },

  updateBudget: async (id, budget, items) => {
    const { error } = await supabase
      .from('orcamentos')
      .update(budget)
      .eq('id', id)
    if (error) throw error

    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

    if (items && items.length > 0) {
      const itemsToInsert = items.map((i) => ({
        orcamento_id: id,
        produto_id: i.produto_id || null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
        custom_id: i.custom_id || null,
        item_pai_id: i.item_pai_id || null,
      }))
      const { error: itemsError } = await supabase
        .from('orcamento_itens')
        .insert(itemsToInsert)
      if (itemsError) throw itemsError
    }

    await get().fetchBudgets()
  },

  deleteBudget: async (id) => {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) throw error
    await get().fetchBudgets()
  },
}))

export default useBudgetStore
