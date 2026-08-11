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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  Send,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import useBudgetStore, { ApprovalResult, Budget } from '@/stores/useBudgetStore'
import { normalizeStatus, cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { FiscalSummaryDialog } from './FiscalSummaryDialog'
import { FinanceResultModal } from './FinanceResultModal'
import {
  buildClientApprovalLink,
  getStatusLabel,
  getStatusBadgeClass,
} from '@/lib/budget-status'
import {
  downloadBudgetPdf,
  sendInitialBudgetPdfAndEmail,
} from '@/lib/envio-inicial-cliente'

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
    voltarOrcamentoRascunho,
  } = useBudgetStore()
  const { canApproveQuotes, role } = useAuth()
  const [isApproving, setIsApproving] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showFinanceModal, setShowFinanceModal] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(
    null,
  )
  const [isSending, setIsSending] = useState(false)
  const [showVoltarRascunho, setShowVoltarRascunho] = useState(false)
  const [motivoVoltarRascunho, setMotivoVoltarRascunho] = useState('')
  const [isVoltandoRascunho, setIsVoltandoRascunho] = useState(false)

  const normalizedStatus = normalizeStatus(status)
  const canManageClient =
    role !== null && ['admin', 'gerente', 'operador'].includes(role)
  const canApproveFinancial =
    canApproveQuotes || role === 'admin' || role === 'gerente'

  const hasSpecialItemsWithoutPrice = budget.itens?.some(
    (i) => Number(i.preco_unitario) === 0,
  )
  const hasUnregisteredItems = budget.itens?.some((i) => !i.produto_id)
  const needsFinancialReview =
    budget.requer_revisao_financeira || hasUnregisteredItems

  // SPEC-067 — `isEnvioInicial` distingue o envio inicial de um rascunho
  // (botão "Enviar para o Cliente", ganha download de PDF + mailto) do
  // reenvio (ícone RefreshCw para `enviado_cliente`/`recusado_cliente`,
  // que continua sem esse comportamento). A store `enviarOrcamentoCliente`
  // não conhece essa distinção — ela fica só aqui no componente.
  const handleEnviarCliente = async (isEnvioInicial: boolean) => {
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
      if (isEnvioInicial) {
        try {
          await sendInitialBudgetPdfAndEmail(budget, result.token)
        } catch (pdfError: any) {
          toast.error('Falha ao gerar o PDF', {
            description: pdfError?.message,
          })
        }
      }
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

  const handleConfirmVoltarRascunho = async () => {
    if (!motivoVoltarRascunho.trim()) return
    try {
      setIsVoltandoRascunho(true)
      await voltarOrcamentoRascunho(budget, motivoVoltarRascunho.trim())
      toast.success('Orçamento voltou para Rascunho', {
        description: 'O link de aprovação enviado ao cliente foi invalidado.',
      })
      setShowVoltarRascunho(false)
      setMotivoVoltarRascunho('')
    } catch (error: any) {
      toast.error('Falha ao voltar orçamento para rascunho', {
        description: error?.message,
      })
    } finally {
      setIsVoltandoRascunho(false)
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
      if (canApproveFinancial) {
        setShowFinanceModal(true)
        toast.success('Orçamento aprovado financeiramente.')
      }
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

  const handleDownloadPdf = async () => {
    try {
      setIsPrinting(true)
      await downloadBudgetPdf(budget)
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
      <TableRow onDoubleClick={() => onEdit(budget)} className="cursor-pointer">
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
          {budget.projeto?.codigo || budget.numero || '-'}
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

            {normalizedStatus === 'rascunho' && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Enviar para o Cliente"
                onClick={() => handleEnviarCliente(true)}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Enviar para o Cliente
              </Button>
            )}

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
                    onClick={() => handleEnviarCliente(false)}
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
                {canApproveFinancial && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                    title="Voltar para Rascunho"
                    onClick={() => setShowVoltarRascunho(true)}
                  >
                    <Undo2 className="h-4 w-4" />
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
                onClick={() => handleEnviarCliente(false)}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}

            {normalizedStatus === 'recusado_cliente' && canApproveFinancial && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                title="Voltar para Rascunho"
                onClick={() => setShowVoltarRascunho(true)}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            )}

            {normalizedStatus === 'aprovacao_financeira' &&
              canApproveFinancial && (
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

      <Dialog
        open={showVoltarRascunho}
        onOpenChange={(open) => {
          setShowVoltarRascunho(open)
          if (!open) setMotivoVoltarRascunho('')
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <Undo2 className="h-5 w-5" />
              Voltar para Rascunho
            </DialogTitle>
            <DialogDescription>
              O orçamento voltará para a fase de Rascunho e o link de aprovação
              enviado ao cliente deixará de funcionar. Descreva o motivo (ex.:
              "Cliente pediu alteração no item X").
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Motivo (obrigatório)
            </label>
            <Textarea
              value={motivoVoltarRascunho}
              onChange={(e) => setMotivoVoltarRascunho(e.target.value)}
              placeholder="Motivo da alteração..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVoltarRascunho(false)
                setMotivoVoltarRascunho('')
              }}
              disabled={isVoltandoRascunho}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVoltarRascunho}
              disabled={!motivoVoltarRascunho.trim() || isVoltandoRascunho}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isVoltandoRascunho ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
