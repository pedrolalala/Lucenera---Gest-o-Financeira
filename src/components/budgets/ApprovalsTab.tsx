import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { BudgetsTable } from '@/components/budgets/BudgetsTable'
import { normalizeStatus } from '@/lib/utils'

export function ApprovalsTab() {
  const { budgets, loading, initialized } = useBudgetStore()
  const navigate = useNavigate()

  const approvedBudgets = useMemo(() => {
    return budgets.filter((b) => normalizeStatus(b.status) === 'aprovado')
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
    <div className="animate-fade-in">
      <BudgetsTable data={approvedBudgets} onEdit={handleEdit} />
    </div>
  )
}
