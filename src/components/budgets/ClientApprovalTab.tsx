import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { UserCheck, Edit, Loader2, FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useAuth } from '@/hooks/use-auth'
import { normalizeStatus } from '@/lib/utils'

const APPROVAL_ROLES = ['admin', 'gerente', 'operador']

export function ClientApprovalTab() {
  const { budgets, loading, initialized, approveBudgetClient } =
    useBudgetStore()
  const { role } = useAuth()
  const navigate = useNavigate()
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const canApprove = role !== null && APPROVAL_ROLES.includes(role)

  const clientPendingBudgets = useMemo(
    () =>
      budgets.filter((b) => {
        const ns = normalizeStatus(b.status)
        return ns === 'aguardando_cliente' || b.status === 'aguardando_cliente'
      }),
    [budgets],
  )

  const handleEdit = (budget: Budget) => navigate(`/budgets/${budget.id}`)

  const handleApprove = async (budget: Budget) => {
    if (!canApprove) {
      toast.error('Permissão negada', {
        description: 'Apenas admin, gerente ou operador podem aprovar.',
        duration: 6000,
      })
      return
    }
    setApprovingId(budget.id)
    try {
      await approveBudgetClient(budget)
      toast.success(
        'Orçamento aprovado pelo cliente! Enviado para aprovação financeira.',
      )
    } catch (error: any) {
      toast.error('Falha ao aprovar orçamento', {
        description: error?.message || 'Erro desconhecido.',
        duration: 8000,
      })
    } finally {
      setApprovingId(null)
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)

  if (loading && !initialized) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 p-2 flex-shrink-0">
            <FileSignature className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide">
              Aprovação do Cliente
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Aguarde a finalização do contrato com o cliente antes de enviar
              para aprovação financeira.
            </p>
            {!canApprove && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                ⚠ Seu usuário não possui permissão para aprovar orçamentos nesta
                etapa.
              </p>
            )}
          </div>
        </div>
      </div>

      {clientPendingBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserCheck className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            Nenhum orçamento aguardando aprovação do cliente
          </p>
          <p className="text-sm text-gray-500">
            Todos os orçamentos foram enviados para o cliente.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Emissão</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPendingBudgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="text-sm text-gray-600">
                      {budget.data_emissao &&
                      !isNaN(new Date(budget.data_emissao).getTime())
                        ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {budget.cliente?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {budget.empresa?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {fmt(budget.valor_total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Aguardando Cliente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canApprove ? (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleApprove(budget)}
                            disabled={approvingId === budget.id}
                          >
                            {approvingId === budget.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-1" />
                            )}
                            Aprovar
                          </Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" /> Aprovar
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                Apenas admin, gerente ou operador podem aprovar.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
