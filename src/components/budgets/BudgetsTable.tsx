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
    // Pedido do usuário (14/10): a lista mostra todos os campos de negócio do
    // orçamento -- com mais colunas, a tabela rola na horizontal.
    <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            <TableHead className="w-[120px]">Emissão</TableHead>
            <TableHead className="w-[110px]">Validade</TableHead>
            <TableHead className="w-[130px]">Previsão Entrega</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="whitespace-nowrap">Nº Orçamento</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Arquiteto</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Equipe</TableHead>
            <TableHead className="whitespace-nowrap">Digitado por</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="whitespace-nowrap">Prazo Entrega</TableHead>
            <TableHead>Frete</TableHead>
            <TableHead className="text-right">Desconto</TableHead>
            <TableHead className="text-right">Sinal</TableHead>
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
