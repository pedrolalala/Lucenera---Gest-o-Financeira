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
import { Edit, Trash2, Printer, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { normalizeStatus } from '@/lib/utils'
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
  const { deleteBudget, updateBudgetStatus } = useBudgetStore()
  const [isApproving, setIsApproving] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const normalizedStatus = normalizeStatus(status)

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      await updateBudgetStatus(budgetId, 'aprovado')
      toast.success('Orçamento aprovado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao aprovar orçamento', { description: error.message })
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

  return (
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
          {normalizedStatus === 'aguardando_aprovacao' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Aprovar"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span className="sr-only">Aprovar</span>
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
  )
}
