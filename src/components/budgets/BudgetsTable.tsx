import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Edit, Trash2, Printer, Loader2 } from 'lucide-react'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import logoImg from '@/assets/lucenera-vertical-527dd.png'

interface BudgetsTableProps {
  data: Budget[]
  onEdit: (budget: Budget) => void
}

export function BudgetsTable({ data, onEdit }: BudgetsTableProps) {
  const { deleteBudget } = useBudgetStore()
  const [printingId, setPrintingId] = useState<string | null>(null)

  const handleDownloadPdf = async (budget: Budget) => {
    try {
      setPrintingId(budget.id)

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
            filters: { id: budget.id, logoBase64 },
          }),
        },
      )

      if (!response.ok) {
        let errorMessage = 'Erro ao gerar o PDF.'
        try {
          const errData = await response.json()
          errorMessage = errData.error || errorMessage
        } catch {
          // ignore
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Orcamento_${budget.numero || budget.id.split('-')[0].toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Orçamento baixado com sucesso!')
    } catch (error: any) {
      console.error(error)
      toast.error('Falha ao gerar o PDF', {
        description: error.message,
      })
    } finally {
      setPrintingId(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500 mb-2">Nenhum orçamento encontrado.</p>
        <p className="text-sm text-gray-400">
          Ajuste os filtros ou crie um novo orçamento.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            <TableHead className="w-[120px]">Emissão</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Arquiteto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium text-gray-600">
                {budget.data_emissao &&
                !isNaN(new Date(budget.data_emissao).getTime())
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
                    #{budget.numero || budget.id.split('-')[0]}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {budget.arquiteto?.nome || '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-gray-50">
                  {budget.status || 'Rascunho'}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold text-gray-900">
                {formatCurrency(budget.valor_total)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    title="Baixar PDF do Orçamento"
                    onClick={() => handleDownloadPdf(budget)}
                    disabled={printingId === budget.id}
                  >
                    {printingId === budget.id ? (
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
                        <AlertDialogTitle>
                          Tem certeza absoluta?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá
                          permanentemente o orçamento e seus itens.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteBudget(budget.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
