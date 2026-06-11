import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Budget } from '@/stores/useBudgetStore'
import { BudgetTableRow } from './BudgetTableRow'

interface BudgetsTableProps {
  data: Budget[]
  onEdit: (budget: Budget) => void
}

export function BudgetsTable({ data, onEdit }: BudgetsTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500 mb-2">Nenhum orçamento encontrado.</p>
        <p className="text-sm text-gray-400">
          Ajuste os filtros ou crie um novo orçamento.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            <TableHead className="w-[120px]">Emissão</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Arquiteto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((budget) => (
            <BudgetTableRow
              key={budget.id}
              budgetId={budget.id}
              status={budget.status}
              budget={budget}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
