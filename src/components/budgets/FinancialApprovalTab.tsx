import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { FinancialApprovalDialog } from '@/components/budgets/FinancialApprovalDialog'
import { FinancialApprovalRow } from '@/components/budgets/FinancialApprovalRow'
import { normalizeStatus } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { isValidUUID } from '@/lib/uuid'
import {
  approveBudgetFinancial,
  validateBudget,
} from '@/services/budgetApprovalService'

export function FinancialApprovalTab() {
  const { budgets, loading, initialized, financialApprove } = useBudgetStore()
  const { canApproveQuotes } = useAuth()
  const navigate = useNavigate()
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const pendingBudgets = useMemo(
    () =>
      budgets.filter(
        (b: Budget) =>
          b.requer_revisao_financeira === true ||
          normalizeStatus(b.status) === 'aguardando_aprovacao',
      ),
    [budgets],
  )

  const handleEdit = (budget: Budget) => navigate(`/budgets/${budget.id}`)

  const handleApproveClick = (budget: Budget) => {
    if (!canApproveQuotes) {
      toast.error('Permissão negada', {
        description:
          'Você não tem permissão para aprovar orçamentos financeiros.',
        duration: 6000,
      })
      return
    }
    if (!isValidUUID(budget.id)) {
      toast.error('ID inválido', {
        description: 'O identificador do orçamento não é um UUID válido.',
        duration: 6000,
      })
      return
    }
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
    try {
      const result = await approveBudgetFinancial(selectedBudget.id)
      if (result.ja_processado) {
        toast.info('Orçamento já havia sido processado anteriormente.')
      } else {
        toast.success(
          'Orçamento aprovado com sucesso! Registros financeiros foram gerados.',
        )
      }
    } catch (error: any) {
      toast.error('Falha ao aprovar orçamento', {
        description:
          error?.message || 'Erro desconhecido ao processar aprovação.',
        duration: 8000,
      })
      throw error
    }
    try {
      await financialApprove(selectedBudget)
    } catch {
      // Non-critical: RPC already succeeded; store sync failure is safe to ignore
    }
  }

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
              As ações realizadas aqui são irreversíveis e disparam integrações
              com o sistema financeiro.
            </p>
            {!canApproveQuotes && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚠ Seu usuário não possui permissão para aprovar orçamentos.
                Apenas visualização permitida.
              </p>
            )}
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
                {pendingBudgets.map((budget: Budget) => (
                  <FinancialApprovalRow
                    key={budget.id}
                    budget={budget}
                    canApproveQuotes={canApproveQuotes}
                    onEdit={handleEdit}
                    onApprove={handleApproveClick}
                  />
                ))}
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
