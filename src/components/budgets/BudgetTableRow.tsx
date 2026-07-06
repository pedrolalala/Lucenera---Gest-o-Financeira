import { useState } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import {
  Edit,
  Trash2,
  Printer,
  Loader2,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Copy,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import useBudgetStore, { ApprovalResult, Budget } from '@/stores/useBudgetStore'
import { normalizeStatus, cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { FiscalSummaryDialog } from './FiscalSummaryDialog'
import { FinanceResultModal } from './FinanceResultModal'
import {
  buildClientApprovalLink,
  getStatusLabel,
  getStatusBadgeClass,
} from '@/lib/budget-status'

interface BudgetTableRowProps {
  budgetId: string
  status: string
  budget: Budget
  onEdit: (budget: Budget) => void
}

export function BudgetTableRow({
  budgetId,
  status,
  budget,
  onEdit,
}: BudgetTableRowProps) {
  const {
    deleteBudget,
    approveBudgetAndMigrate,
    enviarOrcamentoCliente,
    aprovarManualmenteCliente,
  } = useBudgetStore()
  const { canApproveQuotes, role } = useAuth()
  const [isApproving, setIsApproving] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showFinanceModal, setShowFinanceModal] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(
    null,
  )
  const [isSending, setIsSending] = useState(false)

  const normalizedStatus = normalizeStatus(status)
  const canManageClient =
    role !== null && ['admin', 'gerente', 'operador'].includes(role)

  const hasSpecialItemsWithoutPrice = budget.itens?.some(
    (i) => Number(i.preco_unitario) === 0,
  )
  const hasUnregisteredItems = budget.itens?.some((i) => !i.produto_id)
  const needsFinancialReview =
    budget.requer_revisao_financeira || hasUnregisteredItems

  const handleEnviarCliente = async () => {
    try {
      setIsSending(true)
      const result = await enviarOrcamentoCliente(budgetId)
      const link = buildClientApprovalLink(budgetId, result.token)
      await navigator.clipboard.writeText(link)
      toast.success(
        'Orçamento enviado ao cliente! Link copiado para a área de transferência.',
        {
          description: link,
          duration: 8000,
        },
      )
    } catch (error: any) {
      toast.error('Falha ao enviar orçamento', { description: error?.message })
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyLink = async () => {
    if (!budget.token_aprovacao_cliente) {
      toast.error('Token não disponível. Reenvie o orçamento ao cliente.')
      return
    }
    const link = buildClientApprovalLink(
      budgetId,
      budget.token_aprovacao_cliente,
    )
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado!', { description: link, duration: 8000 })
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  const handleAprovarManualmente = async () => {
    if (!canManageClient) {
      toast.error('Permissão negada', {
        description:
          'Apenas admin, gerente ou operador podem aprovar manualmente.',
      })
      return
    }
    try {
      setIsSending(true)
      await aprovarManualmenteCliente(budgetId)
      toast.success('Orçamento aprovado manualmente pelo cliente.')
    } catch (error: any) {
      toast.error('Falha ao aprovar manualmente', {
        description: error?.message,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleApprove = async () => {
    if (hasSpecialItemsWithoutPrice) {
      toast.error(
        'Atenção: Peças especiais detectadas sem preço. Solicite a precificação manual antes de prosseguir.',
        { duration: 8000 },
      )
      return
    }
    if (
      !Array.isArray(budget.prazo_pagamento_dias) ||
      budget.prazo_pagamento_dias.length === 0
    ) {
      toast.error(
        'Este orçamento não tem o "Prazo para Início da Cobrança" preenchido.',
        { duration: 8000 },
      )
      return
    }
    if (!budget.frete_tipo) {
      toast.error('Este orçamento não tem o frete estruturado.', {
        duration: 8000,
      })
      return
    }
    try {
      setIsApproving(true)
      const result = await approveBudgetAndMigrate(budget)
      setApprovalResult(result)
      if (canApproveQuotes) {
        setShowFinanceModal(true)
        toast.success('Orçamento aprovado e enviado para o Financeiro.')
      }
      window.open(
        'https://retorno-bancario-bradesco-5392a.goskip.app/notas-fiscais',
        '_blank',
        'noopener,noreferrer',
      )
    } catch (error: any) {
      const isP0003 =
        error?.code === 'P0003' || error?.message?.includes('P0003')
      toast.error(
        isP0003 ? 'Aprovação bloqueada' : 'Erro ao aprovar orçamento',
        {
          description: isP0003
            ? 'O orçamento deve estar aprovado pelo cliente antes do processamento financeiro.'
            : error.message,
          duration: 8000,
        },
      )
    } finally {
      setIsApproving(false)
    }
  }

  const handleSync = async () => {
    if (
      !Array.isArray(budget.prazo_pagamento_dias) ||
      budget.prazo_pagamento_dias.length === 0
    ) {
      toast.error(
        'Preencha o "Prazo para Início da Cobrança" antes de sincronizar.',
        { duration: 8000 },
      )
      return
    }
    if (!budget.frete_tipo) {
      toast.error('Informe "Com Frete" ou "Sem Frete" antes de sincronizar.', {
        duration: 8000,
      })
      return
    }
    try {
      setIsApproving(true)
      const result = await approveBudgetAndMigrate(budget)
      setApprovalResult(result)
      if (canApproveQuotes) setShowFinanceModal(true)
      toast.success(
        result.ja_processado
          ? 'Orçamento já estava sincronizado.'
          : 'Sincronização concluída.',
      )
    } catch (error: any) {
      toast.error('Erro ao sincronizar', { description: error.message })
    } finally {
      setIsApproving(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setIsPrinting(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            reportType: 'orcamento',
            format: 'pdf',
            filters: { id: budgetId },
          }),
        },
      )
      if (!response.ok) throw new Error('Erro ao gerar o PDF.')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Orcamento_${budget.numero || budgetId.split('-')[0].toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Orçamento baixado com sucesso!')
    } catch (error: any) {
      toast.error('Falha ao gerar o PDF', { description: error.message })
    } finally {
      setIsPrinting(false)
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)

  return (
    <>
      <TableRow>
        <TableCell className="font-medium text-gray-600">
          {budget.data_emissao &&
          !isNaN(new Date(budget.data_emissao).getTime())
            ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
            : '-'}
        </TableCell>
        <TableCell className="font-semibold text-gray-900">
          {budget.empresa?.nome || '-'}
        </TableCell>
        <TableCell className="font-mono text-sm text-gray-600">
          {budget.numero || budget.projeto?.codigo || '-'}
        </TableCell>
        <TableCell className="text-gray-700">
          {budget.cliente?.razao_social || budget.cliente?.nome || '-'}
        </TableCell>
        <TableCell className="text-gray-500 text-sm">
          {budget.arquiteto?.nome || '-'}
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className={cn(getStatusBadgeClass(status))}
            >
              {getStatusLabel(status)}
            </Badge>
            {needsFinancialReview && (
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] whitespace-nowrap"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Revisão Financeira Pendente
              </Badge>
            )}
            {status === 'recusado_cliente' && budget.motivo_recusa_cliente && (
              <span
                className="text-[10px] text-red-600 truncate max-w-[150px]"
                title={budget.motivo_recusa_cliente}
              >
                {budget.motivo_recusa_cliente}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right font-bold text-gray-900">
          {fmt(budget.valor_total)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <FiscalSummaryDialog budget={budget} />

            {normalizedStatus === 'enviado_cliente' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  title="Copiar Link de Aprovação"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {canManageClient && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    title="Reenviar ao Cliente (regenerar token)"
                    onClick={handleEnviarCliente}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {canManageClient && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Aprovar Manualmente"
                    onClick={handleAprovarManualmente}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </>
            )}

            {normalizedStatus === 'recusado_cliente' && canManageClient && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                title="Reenviar ao Cliente"
                onClick={handleEnviarCliente}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}

            {normalizedStatus === 'aprovado' && canApproveQuotes && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50',
                  (hasSpecialItemsWithoutPrice || needsFinancialReview) &&
                    'text-amber-500 hover:text-amber-600 hover:bg-amber-50',
                )}
                title={
                  needsFinancialReview
                    ? 'Requer Revisão Financeira'
                    : hasSpecialItemsWithoutPrice
                      ? 'Atenção: Peças sem preço'
                      : 'Aprovar Financeiramente'
                }
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasSpecialItemsWithoutPrice ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            )}

            {normalizedStatus === 'aprovado' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                title="Sincronizar Projetos/Financeiro"
                onClick={handleSync}
                disabled={isApproving}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isApproving && 'animate-spin')}
                />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Baixar PDF"
              onClick={handleDownloadPdf}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onEdit(budget)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá
                    permanentemente o orçamento e seus itens.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteBudget(budgetId)}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
      <FinanceResultModal
        budget={budget}
        result={approvalResult}
        open={showFinanceModal}
        onOpenChange={setShowFinanceModal}
      />
    </>
  )
}
