import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Transacao, TipoTransacao } from '@/lib/types'
import { format } from 'date-fns'
import { Edit, Trash2 } from 'lucide-react'
import useTransactionStore from '@/stores/useTransactionStore'

interface TransactionsTableProps {
  data: Transacao[]
  onEdit: (transaction: Transacao) => void
}

export function TransactionsTable({ data, onEdit }: TransactionsTableProps) {
  const { categories, deleteTransaction } = useTransactionStore()

  const getCategoryName = (id: string) => {
    const category = categories.find((c) => c.id === id)
    return category ? category.nome : 'Desconhecido'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500 mb-2">Nenhuma transação encontrada.</p>
        <p className="text-sm text-gray-400">
          Ajuste os filtros ou adicione uma nova transação.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Forma de Pagamento</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium text-gray-600">
                {format(new Date(transaction.data), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="font-semibold text-gray-900">
                {transaction.descricao}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="font-normal text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {getCategoryName(transaction.categoria_id)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    transaction.tipo_id === TipoTransacao.Receita
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {transaction.tipo_id}
                </Badge>
              </TableCell>
              <TableCell
                className={
                  'text-right font-bold ' +
                  (transaction.tipo_id === TipoTransacao.Receita
                    ? 'text-green-600'
                    : 'text-gray-900')
                }
              >
                {transaction.tipo_id === TipoTransacao.Despesa ? '-' : '+'}
                {formatCurrency(transaction.valor)}
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {transaction.forma_pagamento_id}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Tem certeza absoluta?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá
                          permanentemente o registro da transação.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
