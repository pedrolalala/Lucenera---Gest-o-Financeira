import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface UbiquaBudget {
  id: string
  numero_orcamento: string
  cliente_id: string
  valor_total: number
  created_at: string
  status: string
  cliente?: { nome: string } | null
}

interface ApprovalsState {
  pendingBudgets: UbiquaBudget[]
  loading: boolean
  fetchPending: () => Promise<void>
  approveBudget: (
    id: string,
    currentStatus: string,
    userName: string,
  ) => Promise<void>
}

const useApprovalsStore = create<ApprovalsState>((set, get) => ({
  pendingBudgets: [],
  loading: false,

  fetchPending: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('orcamentos_revenda_ubiqua')
      .select(
        `
        id,
        numero_orcamento,
        cliente_id,
        valor_total,
        created_at,
        status,
        cliente:informacoes_cliente_ubiqua(nome)
      `,
      )
      .eq('status', 'Aguardando Aprovação')
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ pendingBudgets: data as any, loading: false })
    } else {
      set({ loading: false })
    }
  },

  approveBudget: async (
    id: string,
    currentStatus: string,
    userName: string,
  ) => {
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('orcamentos_revenda_ubiqua')
      .update({
        status: 'aprovado',
        aprovado_em: now,
        aprovado_por: userName,
      })
      .eq('id', id)

    if (updateError) throw updateError

    const { error: historyError } = await supabase
      .from('historico_status_orcamento')
      .insert({
        orcamento_id: id,
        status_anterior: currentStatus,
        status_novo: 'aprovado',
        usuario: userName,
      })

    if (historyError) throw historyError

    await get().fetchPending()
  },
}))

export default useApprovalsStore
