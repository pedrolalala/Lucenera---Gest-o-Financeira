import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Edit,
  Lock,
} from 'lucide-react'
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
import { format } from 'date-fns'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { FinancialApprovalDialog } from '@/components/budgets/FinancialApprovalDialog'
import { normalizeStatus } from '@/lib/utils'

interface ValidationResult {
  ready: boolean
  issues: string[]
}

function validateBudget(budget: Budget): ValidationResult {
  const issues: string[] = []
  if (!budget.cliente_id) issues.push('Cliente não vinculado')
  if (!budget.empresa_id) issues.push('Empresa não vinculada')
  if (!budget.frete_tipo) issues.push('Frete não estruturado')
  if (
    !Array.isArray(budget.prazo_pagamento_dias) ||
    budget.prazo_pagamento_dias.length === 0
  )
    issues.push('Prazo de cobrança não definido')
  if (!budget.itens || budget.itens.length === 0)
    issues.push('Orçamento sem itens')
  if (budget.itens?.some((i) => Number(i.preco_unitario) === 0))
    issues.push('Itens sem preço')
  return { ready: issues.length === 0, issues }
}

export function FinancialApprovalTab() {
  const { budgets, loading, initialized, financialApprove } = useBudgetStore()
  const navigate = useNavigate()
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const pendingBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const ns = normalizeStatus(b.status)
      return (
        b.requer_revisao_financeira === true || ns === 'aguardando_aprovacao'
      )
    })
  }, [budgets])

  const handleEdit = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  const handleApproveClick = (budget: Budget) => {
    const validation = validateBudget(budget)
    if (!validation.ready) {
      toast.error('Orçamento não está pronto para aprovação', {
        description: validation.issues.join('; '),
        duration: 8000,
      })
      return
    }
    setSelectedBudget(budget)
    setDialogOpen(true)
  }

  const handleConfirmApproval = async () => {
    if (!selectedBudget) return
    await financialApprove(selectedBudget)
    toast.success(
      'Orçamento aprovado com sucesso! Registros financeiros foram gerados.',
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)

  if (loading && !initialized) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-amber-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">
              Área de Aprovação Financeira
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Você está na área de Aprovação Financeira. As ações realizadas
              aqui são irreversíveis e disparam integrações com o sistema
              financeiro.
            </p>
          </div>
        </div>
      </div>

      {pendingBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            Nenhum orçamento pendente de aprovação
          </p>
          <p className="text-sm text-gray-500">
            Todos os orçamentos foram revisados.
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
                  <TableHead className="font-semibold">Validação</TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBudgets.map((budget) => {
                  const validation = validateBudget(budget)
                  return (
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
                        {formatCurrency(budget.valor_total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            budget.requer_revisao_financeira
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }
                        >
                          {budget.requer_revisao_financeira
                            ? 'Revisão Pendente'
                            : 'Aguardando Aprovação'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {validation.ready ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <ShieldCheck className="h-4 w-4" />
                            Pronto
                          </span>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-sm text-red-600 cursor-help">
                                <AlertTriangle className="h-4 w-4" />
                                {validation.issues.length} problema(s)
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <ul className="list-disc list-inside text-xs space-y-1">
                                {validation.issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        )}
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
                          {validation.ready ? (
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleApproveClick(budget)}
                            >
                              <ShieldAlert className="h-4 w-4 mr-1" />
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
                                    <Lock className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">
                                  {validation.issues.join('; ')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <FinancialApprovalDialog
        budget={selectedBudget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmApproval}
      />
    </div>
  )
}
