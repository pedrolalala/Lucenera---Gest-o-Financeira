import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Check, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import useApprovalsStore from '@/stores/useApprovalsStore'
import { useAuth } from '@/hooks/use-auth'

export function ApprovalsTab() {
  const { pendingBudgets, loading, fetchPending, approveBudget } =
    useApprovalsStore()
  const { user } = useAuth()
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleApprove = async (id: string, currentStatus: string) => {
    try {
      setApprovingId(id)
      const userName = user?.user_metadata?.name || user?.email || 'Usuário'
      await approveBudget(id, currentStatus, userName)
      toast.success('Orçamento aprovado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao aprovar orçamento.')
    } finally {
      setApprovingId(null)
    }
  }

  if (loading && pendingBudgets.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingBudgets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Nenhum orçamento aguardando aprovação.
              </TableCell>
            </TableRow>
          ) : (
            pendingBudgets.map((budget) => (
              <TableRow key={budget.id} className="group">
                <TableCell className="font-medium text-gray-900">
                  {budget.numero_orcamento}
                </TableCell>
                <TableCell className="text-gray-600">
                  {budget.cliente?.nome || '-'}
                </TableCell>
                <TableCell className="text-gray-600">
                  {budget.created_at
                    ? format(new Date(budget.created_at), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="font-medium text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(budget.valor_total || 0)}
                </TableCell>
                <TableCell className="text-right">
                  {budget.status === 'aguardando_aprovacao' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                      onClick={() => handleApprove(budget.id, budget.status)}
                      disabled={approvingId === budget.id}
                    >
                      {approvingId === budget.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Aprovar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
