import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import {
  TransactionFilters,
  FilterState,
} from '@/components/transactions/TransactionFilters'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import useTransactionStore from '@/stores/useTransactionStore'
import { Transacao } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import AccessDenied from '@/pages/AccessDenied'

const Payments = () => {
  const { transactions, fetchTransactions, loading, initialized } =
    useTransactionStore()
  const { role } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transacao | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    paymentMethod: 'all',
    dateRange: undefined,
  })

  // Fetch transactions when filters change
  useEffect(() => {
    // Add debounce for search/filter changes to prevent rapid requests
    const timer = setTimeout(() => {
      fetchTransactions(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, fetchTransactions]) // fetchTransactions is stable

  const handleCreate = () => {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }

  const handleEdit = (transaction: Transacao) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  // Double check for visitante logic
  // "If the role is visitante, it must display the message: 'Você não tem acesso. Solicite para um administrador.'"
  if (role === 'visitante') {
    return <AccessDenied />
  }

  // Show loading state if loading is true OR if we haven't initialized data yet
  // This prevents flickering or showing empty state before the first load completes
  const showLoading = loading || !initialized

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-500">
            Gerencie seus registros financeiros e histórico.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <TransactionFilters filters={filters} setFilters={setFilters} />

      {showLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <TransactionsTable data={transactions} onEdit={handleEdit} />
      )}

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transactionToEdit={editingTransaction}
      />
    </div>
  )
}

export default Payments
