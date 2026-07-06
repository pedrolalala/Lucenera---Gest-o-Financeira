export const CLIENT_APPROVAL_BASE_URL =
  'https://gestaofinanceiralucenera.goskip.app/aprovacao'

export function buildClientApprovalLink(
  orcamentoId: string,
  token: string,
): string {
  return `${CLIENT_APPROVAL_BASE_URL}?orcamento_id=${orcamentoId}&token=${token}`
}

export function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    'Aprovação Financeira': 'Aprovação Financeira',
    enviado_cliente: 'Enviado ao Cliente',
    recusado_cliente: 'Recusado pelo Cliente',
    aprovado: 'Aprovado',
    aprovado_financeiro: 'Aprovado Financeiramente',
    rascunho: 'Rascunho',
    recusado: 'Recusado',
    expirado: 'Expirado',
  }
  return labels[status || ''] || status || 'Rascunho'
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  const classes: Record<string, string> = {
    'Aprovação Financeira': 'bg-amber-50 text-amber-700 border-amber-300',
    aprovado: 'bg-green-50 text-green-700 border-green-200',
    aprovado_financeiro: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
  return (
    status === 'enviado_cliente' ||
    status === 'recusado_cliente' ||
    status === 'Aprovação Financeira'
  )
}

export function isFinancialApprovalStatus(
  status: string | null | undefined,
): boolean {
  return status === 'Aprovação Financeira'
}
