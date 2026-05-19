import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface BudgetItem {
  id?: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  desconto: number
  produto?: { nome: string }
}

export interface Budget {
  id: string
  empresa_id: string
  cliente_id: string
  arquiteto_id: string | null
  vendedor_id: string | null
  status: string
  data_emissao: string
  validade: string | null
  valor_total: number
  created_at: string
  empresa?: { nome: string }
  cliente?: { nome: string }
  arquiteto?: { nome: string }
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
      itens:orcamento_itens(
        id,
        produto_id,
        quantidade,
        preco_unitario,
        desconto,
        produto:produtos(nome)
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
          b.empresa?.nome?.toLowerCase().includes(s),
      )
    }

    set({ budgets: filtered, loading: false, initialized: true })
  },

  addBudget: async (budget, items) => {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert([budget])
      .select()
      .single()
    if (error) throw error

    if (items && items.length > 0) {
      const itemsToInsert = items.map((i) => ({
        orcamento_id: data.id,
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
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
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
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
