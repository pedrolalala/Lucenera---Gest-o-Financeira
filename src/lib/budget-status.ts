export const CLIENT_APPROVAL_BASE_URL =
  'https://gestaofinanceiralucenera.goskip.app/aprovacao'

export const FINANCIAL_APPROVAL_STATUS = 'Aprovação Financeira'

export const APPROVED_STATUSES: string[] = [
  'Orçamento Aprovado',
  'aprovado_financeiro',
  'Finalizado',
  'Obra Finalizada',
]

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
    'Aprovação Financeira': 'Aprovação Financeira',
    'Orçamento Aprovado': 'Orçamento Aprovado',
    Finalizado: 'Finalizado',
    'Obra Finalizada': 'Obra Finalizada',
    enviado_cliente: 'Enviado ao Cliente',
    recusado_cliente: 'Recusado pelo Cliente',
    aprovado: 'Aprovado pelo Cliente',
    aprovado_financeiro: 'Orçamento Aprovado',
    rascunho: 'Rascunho',
    recusado: 'Recusado',
    expirado: 'Expirado',
  }
  return labels[status || ''] || status || 'Rascunho'
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  const classes: Record<string, string> = {
    'Aprovação Financeira': 'bg-amber-50 text-amber-700 border-amber-300',
    'Orçamento Aprovado': 'bg-green-50 text-green-700 border-green-200',
    Finalizado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Obra Finalizada': 'bg-teal-50 text-teal-700 border-teal-200',
    aprovado: 'bg-blue-50 text-blue-700 border-blue-200',
    aprovado_financeiro: 'bg-green-50 text-green-700 border-green-200',
    enviado_cliente: 'bg-blue-50 text-blue-700 border-blue-200',
    recusado_cliente: 'bg-red-50 text-red-700 border-red-200',
    recusado: 'bg-red-50 text-red-700 border-red-200',
    rascunho: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return classes[status || ''] || 'bg-gray-50'
}

export function isClientApprovalStatus(
  status: string | null | undefined,
): boolean {
  return status === 'enviado_cliente' || status === 'recusado_cliente'
}

export function isFinancialApprovalStatus(
  status: string | null | undefined,
): boolean {
  return status === 'Aprovação Financeira'
}
