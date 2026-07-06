import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditableOrcamentoData } from '@/services/financialApprovalEditService'

interface EditableBudgetItemsTableProps {
  orcamentos: EditableOrcamentoData[]
  onChange: (orcamentos: EditableOrcamentoData[]) => void
}

const FORMA_PAGAMENTO_OPTIONS = [
  { label: 'PIX', value: 'PIX' },
  { label: 'Transferência', value: 'Transferência' },
  { label: 'Cartão Débito', value: 'Cartão Débito' },
  { label: 'Cartão Crédito', value: 'Cartão Crédito' },
  { label: 'Boleto', value: 'Boleto' },
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Débito Automático', value: 'Débito Automático' },
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v || 0,
  )

export function EditableBudgetItemsTable({
  orcamentos,
  onChange,
}: EditableBudgetItemsTableProps) {
  const updateItem = (
    orcId: string,
    itemId: string,
    field: string,
    value: string | number | boolean,
  ) => {
    onChange(
      orcamentos.map((o) => {
        if (o.id !== orcId) return o
        const itens = o.itens.map((i) =>
          i.id === itemId ? { ...i, [field]: value } : i,
        )
        const valor_total = itens.reduce(
          (s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0),
          0,
        )
        return { ...o, itens, valor_total }
      }),
    )
  }

  const updateOrcamento = (orcId: string, field: string, value: any) => {
    onChange(
      orcamentos.map((o) => (o.id === orcId ? { ...o, [field]: value } : o)),
    )
  }

  const calcSubtotal = (q: number, p: number) => (q || 0) * (p || 0)

  return (
    <div className="space-y-4">
      {orcamentos.map((orc) => (
        <div key={orc.id} className="rounded-lg border p-3 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <span className="font-medium text-sm text-gray-900">
              Orçamento {orc.numero || orc.id.slice(0, 8)}
            </span>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-500 whitespace-nowrap">
                Forma Pagto:
              </Label>
              <Select
                value={orc.forma_pagamento || 'none'}
                onValueChange={(v) =>
                  updateOrcamento(
                    orc.id,
                    'forma_pagamento',
                    v === 'none' ? null : v,
                  )
                }
              >
                <SelectTrigger className="h-8 w-44">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  {FORMA_PAGAMENTO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 pr-2">Item</th>
                  <th className="py-2 px-1 w-20">Qtd</th>
                  <th className="py-2 px-1 w-28">Preço Unit.</th>
                  <th className="py-2 px-1 w-28">Subtotal</th>
                  <th className="py-2 px-1 w-20">Peça Nova</th>
                  <th className="py-2 px-1">Observação</th>
                </tr>
              </thead>
              <tbody>
                {orc.itens.map((item) => {
                  const subtotal = calcSubtotal(
                    item.quantidade,
                    item.preco_unitario,
                  )
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 text-gray-700 max-w-[200px] truncate">
                        {item.descricao || item.custom_id || '—'}
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) =>
                            updateItem(
                              orc.id,
                              item.id,
                              'quantidade',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-16"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.preco_unitario}
                          onChange={(e) =>
                            updateItem(
                              orc.id,
                              item.id,
                              'preco_unitario',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-24"
                        />
                      </td>
                      <td className="py-2 px-1 font-medium text-gray-900">
                        {fmt(subtotal)}
                      </td>
                      <td className="py-2 px-1">
                        <Checkbox
                          checked={item.peca_nova}
                          onCheckedChange={(v) =>
                            updateItem(orc.id, item.id, 'peca_nova', v === true)
                          }
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          value={item.descricao || ''}
                          onChange={(e) =>
                            updateItem(
                              orc.id,
                              item.id,
                              'descricao',
                              e.target.value,
                            )
                          }
                          className="h-8"
                          placeholder="Observação..."
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-green-700">
              Total: {fmt(orc.valor_total)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
