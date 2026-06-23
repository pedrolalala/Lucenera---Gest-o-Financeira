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
  projeto_id: string
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
  projeto?: { nome: string; codigo: string }
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
  updateBudgetStatus: (id: string, status: string) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  approveBudgetAndMigrate: (budget: Budget) => Promise<void>
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
      projeto:projetos(nome, codigo),
      itens:orcamento_itens(
        id,
        produto_id,
        quantidade,
        preco_unitario,
        desconto,
        custom_id,
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

      if (itemsError) {
        console.error('Error updating budget items:', itemsError)
        throw new Error(
          itemsError.message || 'Erro ao atualizar itens do orçamento.',
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
    if (budget.status !== 'aprovado') {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'aprovado' })
        .eq('id', budget.id)
      if (error) throw error
    }

    if (budget.projeto_id) {
      const { data: existingItens } = await supabase
        .from('projeto_itens')
        .select('id')
        .eq('projeto_id', budget.projeto_id)
        .limit(1)

      if (!existingItens || existingItens.length === 0) {
        if (budget.itens && budget.itens.length > 0) {
          const pItens = budget.itens.map((i) => ({
            projeto_id: budget.projeto_id,
            produto_id: i.produto_id,
            descricao: i.custom_id || i.produto?.nome || 'Item do Orçamento',
            quantidade: i.quantidade,
            preco_unitario: i.preco_unitario,
            desconto: i.desconto || 0,
            subtotal:
              i.quantidade * i.preco_unitario * (1 - (i.desconto || 0) / 100),
            validado: true,
          }))
          await supabase.from('projeto_itens').insert(pItens)
        }
      }

      const { data: existingParcelas } = await supabase
        .from('projeto_parcelas')
        .select('id')
        .eq('projeto_id', budget.projeto_id)
        .limit(1)

      if (!existingParcelas || existingParcelas.length === 0) {
        let parcelas = 1
        if (budget.condicoes_pagamento) {
          const parsed = parseInt(budget.condicoes_pagamento.replace(/\D/g, ''))
          if (!isNaN(parsed) && parsed > 0) parcelas = parsed
        }
        const valorTotal = budget.valor_total || 0
        const valorParcela = valorTotal / parcelas

        const pParcelas = []
        for (let i = 1; i <= parcelas; i++) {
          const vencimento = new Date()
          vencimento.setDate(vencimento.getDate() + 30 * i)

          pParcelas.push({
            projeto_id: budget.projeto_id,
            numero_parcela: i,
            valor: valorParcela,
            data_fechamento: new Date().toISOString().split('T')[0],
            status: 'pendente',
            data_vencimento: vencimento.toISOString().split('T')[0],
            forma_pagamento: budget.forma_pagamento || null,
          })
        }
        await supabase.from('projeto_parcelas').insert(pParcelas)
      }

      try {
        await supabase.functions.invoke('sync-teams', {
          body: {
            message: `Venda fechada! Orçamento #${budget.numero || budget.id.split('-')[0].toUpperCase()} aprovado.\nNotificação para: Matheus.\nProjeto ID: ${budget.projeto_id} pronto para emissão de NF e Boletos.`,
          },
        })
      } catch (err) {
        console.warn('Teams sync failed', err)
      }
    }

    await get().fetchBudgets()
  },
}))

export default useBudgetStore
