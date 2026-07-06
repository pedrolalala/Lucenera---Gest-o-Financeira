import { Badge } from '@/components/ui/badge'
import { OrcamentoDetail } from '@/services/projectFinancialApprovalService'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0)

interface ProjectOrcamentoListProps {
  orcamentos: OrcamentoDetail[]
}

export function ProjectOrcamentoList({
  orcamentos,
}: ProjectOrcamentoListProps) {
  if (orcamentos.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Nenhum orçamento vinculado a este projeto.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orcamentos.map((orc) => (
        <div key={orc.id} className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                Orçamento {orc.numero || orc.id.slice(0, 8).toUpperCase()}
              </span>
              <Badge variant="outline">{orc.status || '—'}</Badge>
            </div>
            <span className="font-bold text-gray-900">
              {fmt(orc.valor_total || 0)}
            </span>
          </div>
          {(orc.condicoes_pagamento || orc.forma_pagamento) && (
            <div className="px-4 py-1.5 text-xs text-gray-500 flex gap-4 border-b">
              {orc.condicoes_pagamento && (
                <span>Cond.: {orc.condicoes_pagamento}</span>
              )}
              {orc.forma_pagamento && <span>Forma: {orc.forma_pagamento}</span>}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500">
                    Item
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">
                    Qtd
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">
                    Preço Unit.
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">
                    Desc.
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {(orc.orcamento_itens || []).map((item) => {
                  const subtotal =
                    (item.quantidade || 0) *
                    (item.preco_unitario || 0) *
                    (1 - (item.desconto || 0) / 100)
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-1.5 text-gray-700">
                        {item.descricao ||
                          item.custom_id ||
                          'Item sem descrição'}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-600">
                        {item.quantidade || 0}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-600">
                        {fmt(item.preco_unitario || 0)}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-600">
                        {item.desconto ? `${item.desconto}%` : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-gray-900">
                        {fmt(subtotal)}
                      </td>
                    </tr>
                  )
                })}
                {(!orc.orcamento_itens || orc.orcamento_itens.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-3 text-center text-gray-400"
                    >
                      Nenhum item neste orçamento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
