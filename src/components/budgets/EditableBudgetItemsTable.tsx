import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase/client'
import { EditableOrcamentoData } from '@/services/financialApprovalEditService'
import { formatCircuitId, formatCircuitIdInput } from '@/lib/utils'

interface EditableBudgetItemsTableProps {
  orcamentos: EditableOrcamentoData[]
  onChange: (orcamentos: EditableOrcamentoData[]) => void
}

interface ProdutoMeta {
  codigo_produto: number | null
  referencia: string | null
  nome: string | null
  sku: string | null
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
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0)

export function EditableBudgetItemsTable({
  orcamentos,
  onChange,
}: EditableBudgetItemsTableProps) {
  const [produtoMetaMap, setProdutoMetaMap] = useState<
    Map<string, ProdutoMeta>
  >(new Map())

  const allItemIds = orcamentos.flatMap((o) => o.itens.map((i) => i.id))
  const itemIdsKey = allItemIds.join(',')

  useEffect(() => {
    if (allItemIds.length === 0) return
    let cancelled = false
    supabase
      .from('orcamento_itens')
      .select(
        'id, produto_id, produto:produtos(codigo_produto, referencia, nome, sku)',
      )
      .in('id', allItemIds)
      .then(({ data }) => {
        if (cancelled || !data) return
        const map = new Map<string, ProdutoMeta>()
        data.forEach((item: any) => {
          if (item.produto) {
            map.set(item.id, {
              codigo_produto: item.produto.codigo_produto ?? null,
              referencia: item.produto.referencia ?? null,
              nome: item.produto.nome ?? null,
              sku: item.produto.sku ?? null,
            })
          }
        })
        setProdutoMetaMap(map)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey])

  const updateItem = (
    orcId: string,
    itemId: string,
    field: string,
    value: any,
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

  return (
    <div className="space-y-4 w-full">
      {orcamentos.map((orc) => (
        <div key={orc.id} className="w-full rounded-lg border p-3 space-y-3">
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 pr-2 w-16">Circuito</th>
                  <th className="py-2 px-1 w-20">Código</th>
                  <th className="py-2 px-1 w-24">SKU</th>
                  <th className="py-2 px-1 w-24">Referência</th>
                  <th className="py-2 px-1 min-w-[200px]">Descrição</th>
                  <th className="py-2 px-1 w-20">Qtd</th>
                  <th className="py-2 px-1 w-28">Preço Unit.</th>
                  <th className="py-2 px-1 w-28">Subtotal</th>
                  <th className="py-2 px-1 w-20">Peça Nova</th>
                </tr>
              </thead>
              <tbody>
                {orc.itens.map((item) => {
                  const subtotal =
                    (item.quantidade || 0) * (item.preco_unitario || 0)
                  const meta = produtoMetaMap.get(item.id)
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        <Input
                          type="text"
                          maxLength={4}
                          value={item.custom_id || ''}
                          onChange={(e) =>
                            updateItem(
                              orc.id,
                              item.id,
                              'custom_id',
                              formatCircuitIdInput(e.target.value),
                            )
                          }
                          onBlur={(e) => {
                            if (e.target.value) {
                              updateItem(
                                orc.id,
                                item.id,
                                'custom_id',
                                formatCircuitId(e.target.value),
                              )
                            }
                          }}
                          className="h-8 w-14 text-center font-mono text-sm"
                          placeholder="L01"
                        />
                      </td>
                      <td className="py-2 px-1">
                        {meta?.codigo_produto != null ? (
                          <span className="font-mono font-bold text-primary text-sm bg-primary/5 px-1.5 py-0.5 rounded">
                            {meta.codigo_produto}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-1">
                        {meta?.sku ? (
                          <span className="font-mono text-sm text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                            {meta.sku}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-1">
                        {meta?.referencia ? (
                          <span className="text-sm text-gray-600">
                            {meta.referencia}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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
                          className="h-8 min-w-[180px]"
                          placeholder="Descrição..."
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          max="1000"
                          value={item.quantidade}
                          onChange={(e) =>
                            updateItem(
                              orc.id,
                              item.id,
                              'quantidade',
                              Math.min(1000, parseInt(e.target.value) || 0),
                            )
                          }
                          className="h-8 w-16 text-center"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.preco_unitario}
                          onChange={(e) =>
                            updateItem(
                              orc.id,
                              item.id,
                              'preco_unitario',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-24 text-right"
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
