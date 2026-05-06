import { supabase } from '@/lib/supabase/client'
import {
  DashboardKPIs,
  Transacao,
  TipoTransacao,
  FormaPagamento,
} from '@/lib/types'
import { format } from 'date-fns'

export const dashboardService = {
  async getKPIs(): Promise<DashboardKPIs> {
    const today = format(new Date(), 'yyyy-MM-dd')
    // RPC call respects RLS because we updated it to SECURITY INVOKER
    const { data, error } = await supabase.rpc('get_dashboard_kpi', {
      p_date_now: today,
    })

    if (error) {
      console.error('Error fetching KPIs:', error)
      throw error
    }

    return data as DashboardKPIs
  },

  async getRecentTransactions(limit = 5): Promise<Transacao[]> {
    // Select respects RLS
    // Admin gets all (limited by 'limit')
    // Collaborator gets max 1 (limited by RLS)
    // Visitor gets 0
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false }) // Use created_at for "most recently registered"
      .limit(limit)

    if (error) {
      console.error('Error fetching recent transactions:', error)
      throw error
    }

    return data.map((row) => ({
      id: row.id,
      data: new Date(row.date),
      descricao: row.description,
      valor: Number(row.amount),
      categoria_id: row.category,
      tipo_id: row.type as TipoTransacao,
      forma_pagamento_id: row.payment_method as FormaPagamento,
      observacoes: row.notes,
    }))
  },

  async getTransactionsForPeriod(start: Date, end: Date): Promise<Transacao[]> {
    // Select respects RLS
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching period transactions:', error)
      throw error
    }

    return data.map((row) => ({
      id: row.id,
      data: new Date(row.date),
      descricao: row.description,
      valor: Number(row.amount),
      categoria_id: row.category,
      tipo_id: row.type as TipoTransacao,
      forma_pagamento_id: row.payment_method as FormaPagamento,
      observacoes: row.notes,
    }))
  },
}
