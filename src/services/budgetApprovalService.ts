import { supabase } from '@/lib/supabase/client'
import { isValidUUID } from '@/lib/uuid'

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

export interface ValidationResult {
  ready: boolean
  issues: string[]
}

export function validateBudget(budget: any): ValidationResult {
  const issues: string[] = []
  if (
    budget.status !== 'Aprovação Financeira' &&
    budget.status !== 'aprovado' &&
    budget.status !== 'aprovado_financeiro'
  )
    issues.push('Orçamento não foi aprovado pelo cliente')
  if (!budget.cliente_id) issues.push('Cliente não vinculado')
  if (!budget.empresa_id) issues.push('Empresa não vinculada')
  if (!budget.frete_tipo) issues.push('Frete não estruturado')
  if (
    !Array.isArray(budget.prazo_pagamento_dias) ||
    budget.prazo_pagamento_dias.length === 0
  )
    issues.push('Prazo de cobrança não definido')
  if (!budget.itens || budget.itens.length === 0)
    issues.push('Orçamento sem itens')
  if (budget.itens?.some((i: any) => Number(i.preco_unitario) === 0))
    issues.push('Itens sem preço')
  return { ready: issues.length === 0, issues }
}

export async function approveBudgetFinancial(
  budgetId: string,
): Promise<ApprovalResult> {
  if (!isValidUUID(budgetId)) {
    throw new Error(
      'ID do orçamento inválido. Verifique o orçamento e tente novamente.',
    )
  }

  const { data, error } = await supabase.rpc('aprovar_orcamento_financeiro', {
    p_orcamento_id: budgetId,
  })

  if (error) {
    throw new Error(
      error.message ||
        'Erro ao processar aprovação financeira no banco de dados.',
    )
  }
  if (!data) {
    throw new Error('Resposta vazia do servidor ao aprovar orçamento.')
  }

  const result = data as ApprovalResult

  try {
    await supabase.from('logs_auditoria').insert({
      tabela: 'orcamentos',
      operacao: 'APROVACAO_FINANCEIRA',
      registro_id: budgetId,
      dados_novos: result as unknown as Record<string, unknown>,
      observacao: `Aprovação financeira — Itens: ${result.projeto_itens_criados}, Parcelas: ${result.parcelas_criadas}, Boletos: ${result.boletos_criados}`,
    })
  } catch {
    // Non-critical: RPC already records in historico_status_orcamento
  }

  return result
}
