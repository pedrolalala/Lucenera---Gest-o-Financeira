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
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import useBudgetStore, {
  ApprovalResult,
  Budget,
} from '@/stores/useBudgetStore'
import { normalizeStatus, cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import logoImg from '@/assets/lucenera-vertical-527dd.png'

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
  const { deleteBudget, approveBudgetAndMigrate } = useBudgetStore()
  const { role } = useAuth()
  const [isApproving, setIsApproving] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showFinanceModal, setShowFinanceModal] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(
    null,
  )

  const normalizedStatus = normalizeStatus(status)

  const hasSpecialItemsWithoutPrice = budget.itens?.some(
    (i) => Number(i.preco_unitario) === 0,
  )

  const canAccessFinanceiro = ['admin', 'gerente', 'operador'].includes(
    role || '',
  )

  const subtotalItens =
    budget.itens?.reduce((acc, item) => {
      return (
        acc +
        item.quantidade * item.preco_unitario * (1 - (item.desconto || 0) / 100)
      )
    }, 0) || 0
  const valorLiquido = subtotalItens * (1 - (budget.desconto_global || 0) / 100)

  const cfopItems =
    budget.itens?.map((item) => {
      const isST = (item.produto?.porc_st || 0) > 0
      const cfop = isST ? '5405' : '5102'
      const sub =
        item.quantidade * item.preco_unitario * (1 - (item.desconto || 0) / 100)
      return {
        nome: item.produto?.nome || item.custom_id || 'Item',
        cfop,
        subtotal: sub * (1 - (budget.desconto_global || 0) / 100),
      }
    }) || []

  const hasNoInterpretablePrazo =
    !Array.isArray(budget.prazo_pagamento_dias) ||
    budget.prazo_pagamento_dias.length === 0

  const handleApprove = async () => {
    if (hasSpecialItemsWithoutPrice) {
      toast.error(
        'Atenção: Peças especiais detectadas sem preço. Solicite a precificação manual para Débora ou Vinícius antes de prosseguir.',
        {
          duration: 8000,
        },
      )
      return
    }

    if (hasNoInterpretablePrazo) {
      toast.error(
        'Este orçamento ainda não tem o "Prazo para Início da Cobrança" preenchido. Edite o orçamento e informe o prazo antes de aprovar.',
        {
          duration: 8000,
        },
      )
      return
    }

    try {
      setIsApproving(true)
      const result = await approveBudgetAndMigrate(budget)
      setApprovalResult(result)
      if (canAccessFinanceiro) {
        setShowFinanceModal(true)
        toast.success('Orçamento aprovado e enviado para o Financeiro.')
      } else {
        toast.success('Orçamento aprovado e enviado para Administração Bancária.')
      }
    } catch (error: any) {
      toast.error('Erro ao aprovar orçamento', { description: error.message })
    } finally {
      setIsApproving(false)
    }
  }

  const handleSync = async () => {
    if (hasNoInterpretablePrazo) {
      toast.error(
        'Este orçamento ainda não tem o "Prazo para Início da Cobrança" preenchido. Edite o orçamento e informe o prazo antes de sincronizar.',
        {
          duration: 8000,
        },
      )
      return
    }

    try {
      setIsApproving(true)
      const result = await approveBudgetAndMigrate(budget)
      setApprovalResult(result)
      if (canAccessFinanceiro) {
        setShowFinanceModal(true)
      }
      toast.success(
        result.ja_processado
          ? 'Orçamento já estava sincronizado.'
          : 'Sincronização concluída com sucesso.',
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
      let logoBase64 = null
      try {
        const res = await fetch(logoImg)
        if (res.ok) {
          const blob = await res.blob()
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
        }
      } catch (e) {
        console.warn('Não foi possível carregar a logo', e)
      }

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
            filters: { id: budgetId, logoBase64 },
          }),
        },
      )

      if (!response.ok) {
        let errorMessage = 'Erro ao gerar o PDF.'
        try {
          const errData = await response.json()
          errorMessage = errData.error || errorMessage
        } catch {
          /* ignore */
        }
        throw new Error(errorMessage)
      }

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
      console.error(error)
      toast.error('Falha ao gerar o PDF', { description: error.message })
    } finally {
      setIsPrinting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  const openFinanceRoute = (path: 'boletos' | 'notas-fiscais') => {
    const orcamentoId = approvalResult?.orcamento_id || budget.id
    const financeiroBaseUrl = (
      import.meta.env.VITE_FINANCEIRO_URL as string | undefined
    )?.replace(/\/$/, '')

    window.open(
      `${financeiroBaseUrl || ''}/${path}?orcamento_id=${encodeURIComponent(orcamentoId)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <>
      <TableRow>
      <TableCell className="font-medium text-gray-600">
        {budget.data_emissao && !isNaN(new Date(budget.data_emissao).getTime())
          ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
          : '-'}
      </TableCell>
      <TableCell className="font-semibold text-gray-900">
        {budget.empresa?.nome || '-'}
      </TableCell>
      <TableCell className="text-gray-700">
        <div className="flex flex-col">
          <span>{budget.cliente?.nome || '-'}</span>
          <span className="text-[10px] text-gray-400">
            #{budget.numero || budgetId.split('-')[0]}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-gray-500 text-sm">
        {budget.arquiteto?.nome || '-'}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            normalizedStatus === 'aprovado'
              ? 'bg-green-50 text-green-700 border-green-200'
              : normalizedStatus === 'aguardando_aprovacao'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-gray-50'
          }
        >
          {normalizedStatus === 'aguardando_aprovacao'
            ? 'Aguardando Aprovação'
            : normalizedStatus === 'aprovado'
              ? 'Aprovado'
              : status || 'Rascunho'}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-bold text-gray-900">
        {formatCurrency(budget.valor_total)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                title="Resumo Fiscal (NF 4740)"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Resumo Fiscal (NF 4740 - Roberta Lucchesi)
                </DialogTitle>
                <DialogDescription>
                  Consolidação de dados para emissão de nota fiscal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Valor Bruto dos Itens
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(subtotalItens)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Valor Líquido (com Desconto Global)
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(valorLiquido)}
                    </p>
                  </div>
                </div>

                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 text-left">
                      <tr>
                        <th className="p-2 font-medium">Item</th>
                        <th className="p-2 font-medium">CFOP</th>
                        <th className="p-2 font-medium text-right">
                          Subtotal Líquido
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfopItems.map((ci, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{ci.nome}</td>
                          <td className="p-2 font-mono">
                            <span
                              className={cn(
                                'px-2 py-1 rounded text-xs font-semibold',
                                ci.cfop === '5405'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800',
                              )}
                            >
                              {ci.cfop}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            {formatCurrency(ci.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {normalizedStatus === 'aguardando_aprovacao' && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50',
                hasSpecialItemsWithoutPrice &&
                  'text-amber-500 hover:text-amber-600 hover:bg-amber-50',
              )}
              title={
                hasSpecialItemsWithoutPrice
                  ? 'Atenção: Peças sem preço'
                  : 'Aprovar'
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
              <span className="sr-only">Aprovar</span>
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
            title="Baixar PDF do Orçamento"
            onClick={handleDownloadPdf}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            <span className="sr-only">Download PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => onEdit(budget)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente
                  o orçamento e seus itens.
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
    <Dialog open={showFinanceModal} onOpenChange={setShowFinanceModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar para Administração Bancária</DialogTitle>
          <DialogDescription>
            O orçamento foi aprovado com vínculo por orçamento. Abra os boletos
            pendentes ou a nota fiscal para validação financeira.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">Orçamento:</span>{' '}
            {budget.numero || budget.id.split('-')[0].toUpperCase()}
          </p>
          <p>
            <span className="font-medium">Itens criados:</span>{' '}
            {approvalResult?.projeto_itens_criados ?? 0}
          </p>
          <p>
            <span className="font-medium">Parcelas:</span>{' '}
            {approvalResult?.parcelas_criadas ?? 0}
          </p>
          <p>
            <span className="font-medium">Boletos:</span>{' '}
            {approvalResult?.boletos_criados ?? 0}
          </p>
          {approvalResult?.ja_processado && (
            <p className="text-xs text-blue-700">
              Este orçamento já estava processado; nada foi duplicado.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => openFinanceRoute('notas-fiscais')}
          >
            Abrir Nota Fiscal
          </Button>
          <Button type="button" onClick={() => openFinanceRoute('boletos')}>
            Abrir Boletos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
