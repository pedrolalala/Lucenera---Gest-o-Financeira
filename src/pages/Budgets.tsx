import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetsTable } from '@/components/budgets/BudgetsTable'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useAuth } from '@/hooks/use-auth'
import AccessDenied from '@/pages/AccessDenied'

const STATUS_OPTIONS = [
  'Todos',
  'Rascunho',
  'Aguardando Aprovação',
  'Aprovado',
  'Recusado',
  'Expirado',
]

export default function Budgets() {
  const { budgets, fetchBudgets, loading, initialized } = useBudgetStore()
  const { role } = useAuth()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBudgets({ search: searchTerm, status: statusFilter })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, fetchBudgets])

  const handleCreate = () => {
    setEditingBudget(null)
    setIsFormOpen(true)
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  if (role === 'visitante') {
    return <AccessDenied />
  }

  const showLoading = loading && !initialized

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500">
            Gerencie propostas comerciais e orçamentos.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem
                key={status}
                value={status === 'Todos' ? 'all' : status}
              >
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <BudgetsTable data={budgets} onEdit={handleEdit} />
      )}

      <BudgetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        budgetToEdit={editingBudget}
      />
    </div>
  )
}
