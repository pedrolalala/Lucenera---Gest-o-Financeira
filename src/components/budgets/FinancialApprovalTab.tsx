import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Eye,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useAuth } from '@/hooks/use-auth'
import useBudgetStore, { type Budget } from '@/stores/useBudgetStore'
import {
  approveBudgetFinancial,
  type ApprovalResult,
  validateBudget,
} from '@/services/budgetApprovalService'
import { FinancialApprovalDialog } from '@/components/budgets/FinancialApprovalDialog'
import { FinanceResultModal } from '@/components/budgets/FinanceResultModal'
import {
  FINANCIAL_APPROVAL_STATUS,
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/budget-status'
import { cn } from '@/lib/utils'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

function matchesBudgetSearch(budget: Budget, query: string) {
  const term = query.trim().toLowerCase()
  if (!term) return true

  return [
    budget.numero,
    budget.empresa?.nome,
    budget.projeto?.codigo,
    budget.projeto?.nome,
    budget.cliente?.nome,
    budget.cliente?.razao_social,
    budget.cliente?.email,
    budget.cliente?.nome_empresa,
    budget.arquiteto?.nome,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term))
}

export function FinancialApprovalTab() {
  const navigate = useNavigate()
  const { role, canApproveQuotes } = useAuth()
  const { budgets, fetchBudgets } = useBudgetStore()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(
    null,
  )
  const [resultBudget, setResultBudget] = useState<Budget | null>(null)

  const canManage = role === 'admin' || role === 'gerente'
  const canApproveFinancial = canManage || canApproveQuotes

  const loadBudgets = useCallback(async () => {
    setLoading(true)
    try {
      await fetchBudgets()
    } catch (error: any) {
      toast.error('Erro ao carregar orçamentos', {
        description: error?.message,
      })
    } finally {
      setLoading(false)
    }
  }, [fetchBudgets])

  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  const pendingBudgets = useMemo(
    () =>
      budgets.filter((budget) => budget.status === FINANCIAL_APPROVAL_STATUS),
    [budgets],
  )

  const filteredBudgets = useMemo(
    () =>
      pendingBudgets.filter((budget) =>
        matchesBudgetSearch(budget, searchTerm),
      ),
    [pendingBudgets, searchTerm],
  )

  const handleOpenBudget = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  const handleApproveRequest = (budget: Budget) => {
    setSelectedBudget(budget)
    setDialogOpen(true)
  }

  const handleConfirmApproval = async () => {
    if (!selectedBudget) return
    const result = await approveBudgetFinancial(selectedBudget.id)
    setResultBudget(selectedBudget)
    setApprovalResult(result)
    toast.success('Orçamento aprovado financeiramente', {
      description: `Itens: ${result.projeto_itens_criados}, Parcelas: ${result.parcelas_criadas}, Boletos: ${result.boletos_criados}`,
    })
    await fetchBudgets()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">
              Revisão Financeira de Orçamentos
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              Revise ou edite o orçamento na mesma tela do fluxo comum. A
              aprovação final processa somente o orçamento selecionado.
            </p>
            {!canApproveFinancial && (
              <p className="text-xs text-amber-700 mt-2 font-medium">
                Apenas administradores, gerentes ou usuários autorizados podem
                confirmar a aprovação financeira.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar por orçamento, projeto, cliente, arquiteto ou email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {filteredBudgets.length > 0 && (
          <span className="text-sm text-gray-500 self-center whitespace-nowrap">
            {filteredBudgets.length}{' '}
            {filteredBudgets.length === 1 ? 'orçamento' : 'orçamentos'}
          </span>
        )}
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            {searchTerm
              ? 'Nenhum orçamento encontrado.'
              : 'Nenhum orçamento aguardando aprovação financeira'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Orçamentos em "Revisão Financeira Pendente" aparecerão aqui.'}
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
                  <TableHead className="font-semibold">Orçamento</TableHead>
                  <TableHead className="font-semibold">Projeto</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Arquiteto</TableHead>
                  <TableHead className="font-semibold">Validação</TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const validation = validateBudget(budget)
                  const canApprove =
                    canApproveFinancial &&
                    validation.ready &&
                    Boolean(budget.id)
                  const disabledReason = !canApproveFinancial
                    ? 'Você não tem permissão para aprovar financeiramente.'
                    : validation.issues.join('; ')

                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(budget.data_emissao)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {budget.empresa?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm font-bold text-gray-900">
                          {budget.numero || budget.id.slice(0, 8)}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(getStatusBadgeClass(budget.status))}
                        >
                          {getStatusLabel(budget.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="font-mono text-sm">
                          {budget.projeto?.codigo || '-'}
                        </div>
                        {budget.projeto?.nome && (
                          <div className="max-w-[220px] truncate text-xs text-gray-500">
                            {budget.projeto.nome}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {budget.cliente?.razao_social ||
                          budget.cliente?.nome ||
                          budget.cliente?.nome_empresa ||
                          '-'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {budget.arquiteto?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {validation.ready ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <ShieldCheck className="h-4 w-4" /> Pronto
                          </span>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-sm text-red-600 cursor-help">
                                <AlertTriangle className="h-4 w-4" />{' '}
                                {validation.issues.length} pendência(s)
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <ul className="list-disc list-inside text-xs space-y-1">
                                {validation.issues.map((issue, index) => (
                                  <li key={index}>{issue}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {BRL.format(budget.valor_total || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleOpenBudget(budget)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Ver/Editar
                          </Button>
                          {canApprove ? (
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleApproveRequest(budget)}
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
                                    Aprovar
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{disabledReason}</p>
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
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedBudget(null)
        }}
        onConfirm={handleConfirmApproval}
      />

      {resultBudget && (
        <FinanceResultModal
          budget={resultBudget}
          result={approvalResult}
          open={!!approvalResult}
          onOpenChange={(open) => {
            if (!open) setApprovalResult(null)
          }}
        />
      )}
    </div>
  )
}
