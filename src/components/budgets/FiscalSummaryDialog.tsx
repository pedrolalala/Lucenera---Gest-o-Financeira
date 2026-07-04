import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { Budget } from '@/stores/useBudgetStore'
import { cn } from '@/lib/utils'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function FiscalSummaryDialog({ budget }: { budget: Budget }) {
  const subtotalItens =
    budget.itens?.reduce((acc, item) => {
      return (
        acc +
        item.quantidade * item.preco_unitario * (1 - (item.desconto || 0) / 100)
      )
    }, 0) || 0
  const valorLiquido = subtotalItens * (1 - (budget.desconto_global || 0) / 100)

  const cfopItems =
    budget.itens?.map((item) => {
      const isST = (item.produto?.porc_st || 0) > 0
      const cfop = isST ? '5405' : '5102'
      const sub =
        item.quantidade * item.preco_unitario * (1 - (item.desconto || 0) / 100)
      return {
        nome: item.produto?.nome || item.descricao || item.custom_id || 'Item',
        cfop,
        subtotal: sub * (1 - (budget.desconto_global || 0) / 100),
      }
    }) || []

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
          title="Resumo Fiscal (NF 4740)"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resumo Fiscal (NF 4740 - Roberta Lucchesi)</DialogTitle>
          <DialogDescription>
            Consolidação de dados para emissão de nota fiscal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Valor Bruto dos Itens
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(subtotalItens)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Valor Líquido (com Desconto Global)
              </p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(valorLiquido)}
              </p>
            </div>
          </div>
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="p-2 font-medium">Item</th>
                  <th className="p-2 font-medium">CFOP</th>
                  <th className="p-2 font-medium text-right">
                    Subtotal Líquido
                  </th>
                </tr>
              </thead>
              <tbody>
                {cfopItems.map((ci, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{ci.nome}</td>
                    <td className="p-2 font-mono">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-semibold',
                          ci.cfop === '5405'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800',
                        )}
                      >
                        {ci.cfop}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(ci.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
