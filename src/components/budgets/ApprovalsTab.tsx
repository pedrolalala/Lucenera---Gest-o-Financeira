import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { BudgetsTable } from '@/components/budgets/BudgetsTable'
import { APPROVED_STATUSES } from '@/lib/budget-status'

export function ApprovalsTab() {
  const { budgets, loading, initialized } = useBudgetStore()
  const navigate = useNavigate()

  const approvedBudgets = useMemo(() => {
    return budgets.filter((b) => APPROVED_STATUSES.includes(b.status))
  }, [budgets])

  const handleEdit = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  if (loading && !initialized) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-green-100 p-2 flex-shrink-0">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800 text-sm uppercase tracking-wide">
              Orçamentos Aprovados
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Orçamentos que concluíram o processo de aprovação financeira e
              estão prontos para gestão de vendas concluídas.
            </p>
          </div>
        </div>
      </div>

      {approvedBudgets.length === 0 && initialized ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-white shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            Nenhum orçamento aprovado encontrado
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Orçamentos que passarem pela aprovação financeira aparecerão aqui.
          </p>
        </div>
      ) : (
        <BudgetsTable data={approvedBudgets} onEdit={handleEdit} />
      )}
    </div>
  )
}
