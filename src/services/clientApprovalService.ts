import { supabase } from '@/lib/supabase/client'

export interface ClientApprovalBudget {
  orcamento_id: string
  numero: string | null
  valor_total: number
  data_emissao: string | null
  cliente_nome: string | null
  status: string
  condicoes_pagamento: string | null
  forma_pagamento: string | null
  // SPEC-068: desconto (% ou R$) e sinal, para o documento mostrar
  // explicitamente valor total, desconto, sinal e saldo restante.
  subtotal_itens: number
  desconto_tipo: 'percentual' | 'valor'
  desconto_global: number
  desconto_valor: number
  valor_sinal: number
  saldo_restante_apos_sinal: number
}

export async function buscarOrcamentoParaAprovacao(
  orcamentoId: string,
  token: string,
): Promise<ClientApprovalBudget> {
  const { data, error } = await supabase.rpc(
    'buscar_orcamento_para_aprovacao',
    {
      p_orcamento_id: orcamentoId,
      p_token: token,
    },
  )
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Orçamento não encontrado.')
  return data as unknown as ClientApprovalBudget
}

export async function aprovarOrcamentoClientePublico(
  orcamentoId: string,
  token: string,
): Promise<void> {
  const { error } = await supabase.rpc('aprovar_orcamento_cliente_publico', {
    p_orcamento_id: orcamentoId,
    p_token: token,
  })
  if (error) throw new Error(error.message)
}

export async function recusarOrcamentoClientePublico(
  orcamentoId: string,
  token: string,
  motivo: string,
): Promise<void> {
  const { error } = await supabase.rpc('recusar_orcamento_cliente_publico', {
    p_orcamento_id: orcamentoId,
    p_token: token,
    p_motivo: motivo,
  })
  if (error) throw new Error(error.message)
}
