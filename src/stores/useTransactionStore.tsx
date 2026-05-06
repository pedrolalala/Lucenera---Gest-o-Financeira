import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import { Transacao, Categoria } from '@/lib/types'
import { mockCategories } from '@/lib/data'
import { FilterState } from '@/components/transactions/TransactionFilters'
import { transactionService } from '@/services/transactionService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface TransactionState {
  transactions: Transacao[]
  categories: Categoria[]
  loading: boolean
  initialized: boolean
  fetchTransactions: (filters: FilterState) => Promise<void>
  addTransaction: (transaction: Omit<Transacao, 'id'>) => Promise<void>
  updateTransaction: (
    id: string,
    transaction: Partial<Transacao>,
  ) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

const TransactionContext = createContext<TransactionState | undefined>(
  undefined,
)

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [categories] = useState<Categoria[]>(mockCategories)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const { role } = useAuth()

  // Ref to track the latest fetch request ID for race condition prevention
  const fetchIdRef = useRef(0)

  const fetchTransactions = useCallback(
    async (filters: FilterState) => {
      // If no role is set, we shouldn't fetch yet or invalid state
      if (!role) return

      const currentId = ++fetchIdRef.current
      try {
        setLoading(true)
        // Pass the user role to the service layer for conditional fetching logic
        const data = await transactionService.fetchTransactions(filters, role)

        // Only update state if this is the most recent request
        if (currentId === fetchIdRef.current) {
          setTransactions(data)
        }
      } catch (error) {
        if (currentId === fetchIdRef.current) {
          console.error('Error fetching transactions:', error)
          toast.error('Erro ao carregar transações')
        }
      } finally {
        if (currentId === fetchIdRef.current) {
          setLoading(false)
          setInitialized(true)
        }
      }
    },
    [role],
  )

  const addTransaction = useCallback(
    async (transaction: Omit<Transacao, 'id'>) => {
      try {
        const newTransaction =
          await transactionService.createTransaction(transaction)
        setTransactions((prev) => [newTransaction, ...prev])
      } catch (error) {
        console.error('Error adding transaction:', error)
        throw error // Propagate error to form
      }
    },
    [],
  )

  const updateTransaction = useCallback(
    async (id: string, updatedFields: Partial<Transacao>) => {
      try {
        const updatedTransaction = await transactionService.updateTransaction(
          id,
          updatedFields,
        )
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updatedTransaction : t)),
        )
      } catch (error) {
        console.error('Error updating transaction:', error)
        throw error // Propagate error to form
      }
    },
    [],
  )

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionService.deleteTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toast.success('Transação excluída com sucesso')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Erro ao excluir transação')
    }
  }, [])

  const value = useMemo(
    () => ({
      transactions,
      categories,
      loading,
      initialized,
      fetchTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [
      transactions,
      categories,
      loading,
      initialized,
      fetchTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    ],
  )

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

const useTransactionStore = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error(
      'useTransactionStore must be used within a TransactionProvider',
    )
  }
  return context
}

export default useTransactionStore
