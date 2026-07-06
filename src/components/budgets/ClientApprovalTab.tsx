import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Send,
  Edit,
  Loader2,
  FileSignature,
  Copy,
  UserCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
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
import {
  getStatusLabel,
  getStatusBadgeClass,
  buildClientApprovalLink,
} from '@/lib/budget-status'
import { cn } from '@/lib/utils'

const APPROVAL_ROLES = ['admin', 'gerente', 'operador']

export function ClientApprovalTab() {
  const {
    budgets,
    loading,
    initialized,
    enviarOrcamentoCliente,
    aprovarManualmenteCliente,
  } = useBudgetStore()
  const { role } = useAuth()
  const navigate = useNavigate()
  const [actionId, setActionId] = useState<string | null>(null)

  const canManage = role !== null && APPROVAL_ROLES.includes(role)

  const clientBudgets = useMemo(
    () =>
      budgets.filter(
        (b) =>
          b.status === 'enviado_cliente' || b.status === 'recusado_cliente',
      ),
    [budgets],
  )

  const handleEdit = (budget: Budget) => navigate(`/budgets/${budget.id}`)

  const handleEnviar = async (budget: Budget) => {
    setActionId(budget.id)
    try {
      const result = await enviarOrcamentoCliente(budget.id)
      const link = buildClientApprovalLink(budget.id, result.token)
      await navigator.clipboard.writeText(link)
      toast.success('Orçamento enviado ao cliente! Link copiado.', {
        description: link,
        duration: 8000,
      })
    } catch (error: any) {
      toast.error('Falha ao enviar orçamento', { description: error?.message })
    } finally {
      setActionId(null)
    }
  }

  const handleCopyLink = async (budget: Budget) => {
    if (!budget.token_aprovacao_cliente) {
      toast.error('Token não disponível. Reenvie o orçamento.')
      return
    }
    const link = buildClientApprovalLink(
      budget.id,
      budget.token_aprovacao_cliente,
    )
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado!', { description: link, duration: 8000 })
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  const handleAprovarManual = async (budget: Budget) => {
    setActionId(budget.id)
    try {
      await aprovarManualmenteCliente(budget.id)
      toast.success('Orçamento aprovado manualmente pelo cliente.')
    } catch (error: any) {
      toast.error('Falha ao aprovar manualmente', {
        description: error?.message,
      })
    } finally {
      setActionId(null)
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
              Envie o link de aprovação ao cliente ou registre a aprovação
              manualmente. Orçamentos recusados podem ser reenviados.
            </p>
          </div>
        </div>
      </div>

      {clientBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Send className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            Nenhum orçamento pendente de aprovação do cliente
          </p>
          <p className="text-sm text-gray-500">
            Orçamentos completos aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Emissão</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Arquiteto</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor Total
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientBudgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="text-sm text-gray-600">
                      {budget.data_emissao &&
                      !isNaN(new Date(budget.data_emissao).getTime())
                        ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {budget.empresa?.nome || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {budget.numero || budget.projeto?.codigo || '-'}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {budget.cliente?.razao_social ||
                        budget.cliente?.nome ||
                        '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {budget.arquiteto?.nome || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={cn(getStatusBadgeClass(budget.status))}
                        >
                          {getStatusLabel(budget.status)}
                        </Badge>
                        {budget.status === 'recusado_cliente' &&
                          budget.motivo_recusa_cliente && (
                            <span
                              className="text-[10px] text-red-600 truncate max-w-[150px]"
                              title={budget.motivo_recusa_cliente}
                            >
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {budget.status === 'enviado_cliente' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Copiar Link"
                              onClick={() => handleCopyLink(budget)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAprovarManual(budget)}
                                disabled={actionId === budget.id}
                              >
                                {actionId === budget.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4 mr-1" />
                                )}
                                Aprovar Manualmente
                              </Button>
                            )}
                          </>
                        )}
                        {budget.status === 'recusado_cliente' && canManage && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleEnviar(budget)}
                            disabled={actionId === budget.id}
                          >
                            {actionId === budget.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            Reenviar
                          </Button>
                        )}
                        {!canManage && (
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
                            <TooltipContent>
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
