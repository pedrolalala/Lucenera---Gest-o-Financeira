export const CLIENT_APPROVAL_BASE_URL =
  'https://gestaofinanceiralucenera.goskip.app/aprovacao'

export const FINANCIAL_APPROVAL_STATUS = 'pendente_aprovacao_financeira'

export const APPROVED_STATUSES: string[] = ['aprovado']

export function isApprovedStatus(status: string | null | undefined): boolean {
  if (!status) return false
  return APPROVED_STATUSES.includes(status)
}

export function buildClientApprovalLink(
  orcamentoId: string,
  token: string,
): string {
  return `${CLIENT_APPROVAL_BASE_URL}?orcamento_id=${orcamentoId}&token=${token}`
}

export function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    rascunho: 'Rascunho',
    enviado_cliente: 'Enviado para o Cliente',
    recusado_cliente: 'Recusado pelo Cliente',
    expirado: 'Expirado',
    pendente_aprovacao_financeira: 'Pendente Aprovação Financeira',
    aprovado: 'Orçamento Aprovado',
  }
  return labels[status || ''] || status || 'Rascunho'
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  const classes: Record<string, string> = {
    rascunho: 'bg-gray-50 text-gray-700 border-gray-200',
    enviado_cliente: 'bg-blue-50 text-blue-700 border-blue-200',
    recusado_cliente: 'bg-red-50 text-red-700 border-red-200',
    expirado: 'bg-red-50 text-red-700 border-red-200',
    pendente_aprovacao_financeira:
      'bg-amber-50 text-amber-700 border-amber-300',
    aprovado: 'bg-green-50 text-green-700 border-green-200',
  }
  return classes[status || ''] || 'bg-gray-50'
}

export function getClientApprovalOriginLabel(
  origem: string | null | undefined,
): string | null {
  if (origem === 'manual') return 'Aprovado pelo cliente (manual)'
  if (origem === 'token') return 'Aprovado pelo cliente (token)'
  return null
}

export function isClientApprovalStatus(
  status: string | null | undefined,
): boolean {
  return status === 'enviado_cliente' || status === 'recusado_cliente'
}

export function isFinancialApprovalStatus(
  status: string | null | undefined,
): boolean {
  return status === 'pendente_aprovacao_financeira'
}
