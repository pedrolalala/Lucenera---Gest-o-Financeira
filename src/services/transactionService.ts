import { supabase } from '@/lib/supabase/client'
import { FilterState } from '@/components/transactions/TransactionFilters'
import { Transacao, TipoTransacao, FormaPagamento, Role } from '@/lib/types'
import { format } from 'date-fns'

// Helper to map DB row to Transacao type
const mapToTransacao = (row: any): Transacao => ({
  id: row.id,
  data: new Date(row.date),
  descricao: row.description,
  valor: Number(row.amount),
  categoria_id: row.category,
  tipo_id: row.type as TipoTransacao,
  forma_pagamento_id: row.payment_method as FormaPagamento,
  observacoes: row.notes,
  responsavel: row.responsavel,
  operacao: row.operacao,
  tipo_situacao: row.tipo_situacao,
  tipo_data: row.tipo_data,
  data_inicio: row.data_inicio ? new Date(row.data_inicio) : null,
  data_final: row.data_final ? new Date(row.data_final) : null,
  venda: row.venda,
  fatura: row.fatura,
  duplicata: row.duplicata,
  boleto: row.boleto,
  pessoa: row.pessoa,
  codigo: row.codigo,
  cliente: row.cliente,
})

// Helper to map Transacao to DB row
const mapToRow = (transaction: Omit<Transacao, 'id'>, userId: string) => ({
  user_id: userId,
  date: format(transaction.data, 'yyyy-MM-dd'),
  description: transaction.descricao,
  amount: transaction.valor,
  category: transaction.categoria_id,
  type: transaction.tipo_id,
  payment_method: transaction.forma_pagamento_id,
  notes: transaction.observacoes,
  responsavel: transaction.responsavel,
  operacao: transaction.operacao,
  tipo_situacao: transaction.tipo_situacao,
  tipo_data: transaction.tipo_data,
  data_inicio: transaction.data_inicio
    ? format(transaction.data_inicio, 'yyyy-MM-dd')
    : null,
  data_final: transaction.data_final
    ? format(transaction.data_final, 'yyyy-MM-dd')
    : null,
  venda: transaction.venda,
  fatura: transaction.fatura,
  duplicata: transaction.duplicata,
  boleto: transaction.boleto,
  pessoa: transaction.pessoa,
  codigo: transaction.codigo,
  cliente: transaction.cliente,
})

export const transactionService = {
  async fetchTransactions(filters: FilterState, role: Role) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Initial query
    let query = supabase.from('transactions').select('*')

    // Apply filters based on Role and FilterState
    if (role === 'visitante' || role === 'viewer') {
      // Visitor should not see anything (RLS handles this too, but explicit return saves a call)
      return []
    }

    if (
      role === 'colaborador' ||
      role === 'operador' ||
      role === 'funcionario'
    ) {
      // Collaborator restricted view: Single most recent transaction.
      // RLS enforces this, but we explicitly order and limit to match application logic expectations.
      // We add ID sort to ensure deterministic behavior matching the RLS policy.
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
    }

    if (role === 'admin' || role === 'gerente') {
      // Admin sees all, applies filters
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod)
      }

      if (filters.responsavel && filters.responsavel !== 'all') {
        query = query.eq('responsavel', filters.responsavel)
      }

      if (filters.dateRange?.from) {
        query = query.gte('date', format(filters.dateRange.from, 'yyyy-MM-dd'))
        if (filters.dateRange.to) {
          query = query.lte('date', format(filters.dateRange.to, 'yyyy-MM-dd'))
        }
      }

      // Default sort by date desc for full list
      query = query.order('date', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }

    return data.map(mapToTransacao)
  },

  async createTransaction(transaction: Omit<Transacao, 'id'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const dbRow = mapToRow(transaction, user.id)
    const { data, error } = await supabase
      .from('transactions')
      .insert(dbRow)
      .select()
      .single()

    if (error) throw error
    return mapToTransacao(data)
  },

  async updateTransaction(id: string, transaction: Partial<Transacao>) {
    // Policies have been updated to allow Admins and Owners to update their transactions.

    const updates: any = {}
    if (transaction.data) updates.date = format(transaction.data, 'yyyy-MM-dd')
    if (transaction.descricao) updates.description = transaction.descricao
    if (transaction.valor) updates.amount = transaction.valor
    if (transaction.categoria_id) updates.category = transaction.categoria_id
    if (transaction.tipo_id) updates.type = transaction.tipo_id
    if (transaction.forma_pagamento_id)
      updates.payment_method = transaction.forma_pagamento_id
    if (transaction.observacoes !== undefined)
      updates.notes = transaction.observacoes
    if (transaction.responsavel !== undefined)
      updates.responsavel = transaction.responsavel
    if (transaction.operacao !== undefined)
      updates.operacao = transaction.operacao
    if (transaction.tipo_situacao !== undefined)
      updates.tipo_situacao = transaction.tipo_situacao
    if (transaction.tipo_data !== undefined)
      updates.tipo_data = transaction.tipo_data
    if (transaction.data_inicio !== undefined)
      updates.data_inicio = transaction.data_inicio
        ? format(transaction.data_inicio, 'yyyy-MM-dd')
        : null
    if (transaction.data_final !== undefined)
      updates.data_final = transaction.data_final
        ? format(transaction.data_final, 'yyyy-MM-dd')
        : null
    if (transaction.venda !== undefined) updates.venda = transaction.venda
    if (transaction.fatura !== undefined) updates.fatura = transaction.fatura
    if (transaction.duplicata !== undefined)
      updates.duplicata = transaction.duplicata
    if (transaction.boleto !== undefined) updates.boleto = transaction.boleto
    if (transaction.pessoa !== undefined) updates.pessoa = transaction.pessoa
    if (transaction.codigo !== undefined) updates.codigo = transaction.codigo
    if (transaction.cliente !== undefined) updates.cliente = transaction.cliente

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapToTransacao(data)
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) throw error
  },
}
