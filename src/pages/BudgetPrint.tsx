import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Budget } from '@/stores/useBudgetStore'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function BudgetPrint() {
  const { id } = useParams()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendedorNome, setVendedorNome] = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return

      try {
        const { data, error } = await supabase
          .from('orcamentos')
          .select(
            `
            *,
            empresa:empresas(nome, razao_social, logradouro, numero, bairro, cidade, estado, cep, cnpj),
            cliente:contatos!orcamentos_cliente_id_fkey(nome, endereco, bairro, cidade, estado, cep, telefone, celular, cpf_cnpj),
            arquiteto:contatos!orcamentos_arquiteto_id_fkey(nome),
            itens:orcamento_itens(
              id,
              produto_id,
              quantidade,
              preco_unitario,
              desconto,
              custom_id,
              item_pai_id,
              produto:produtos(nome, codigo_produto, codigo_legado, referencia, unidade)
            )
          `,
          )
          .eq('id', id)
          .single()

        if (error) throw error

        const budgetData = data as unknown as Budget

        // Fetch vendedor name if available
        let vNome = ''
        if (budgetData.vendedor_id) {
          const { data: vData } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', budgetData.vendedor_id)
            .single()
          if (vData) vNome = vData.nome
        }
        setVendedorNome(vNome)
        setBudget(budgetData)

        // Wait a bit for rendering, then trigger print
        setTimeout(() => {
          window.print()
        }, 1000)
      } catch (err) {
        console.error('Error loading budget for print', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 print:hidden">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 print:hidden">
        <p className="text-gray-500">Orçamento não encontrado.</p>
      </div>
    )
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)

  // Subtotal (without discounts)
  const subtotal = (budget.itens || []).reduce((acc, item) => {
    return acc + Number(item.quantidade) * Number(item.preco_unitario)
  }, 0)

  // Total discounts
  const totalDiscounts = (budget.itens || []).reduce((acc, item) => {
    const gross = Number(item.quantidade) * Number(item.preco_unitario)
    const discountAmount = gross * (Number(item.desconto || 0) / 100)
    return acc + discountAmount
  }, 0)

  const finalTotal =
    subtotal - totalDiscounts - (Number(budget.desconto_global) || 0)

  // Grouping items visually by custom_id
  const sortedItems = [...(budget.itens || [])].sort((a, b) => {
    const idA = a.custom_id || ''
    const idB = b.custom_id || ''
    if (idA === idB) {
      // Parents first (if no item_pai_id), then accessories
      if (!a.item_pai_id && b.item_pai_id) return -1
      if (a.item_pai_id && !b.item_pai_id) return 1
      return 0
    }
    return idA.localeCompare(idB)
  })

  // Date formatting
  const printDate = format(new Date(), 'dd/MM/yyyy HH:mm')

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0 font-sans text-[12px] text-gray-900">
      <style
        dangerouslySetContent={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .print-container { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
          .hide-on-print { display: none !important; }
          .page-break { page-break-inside: avoid; }
        }
      `,
        }}
      />

      <div className="print-container mx-auto max-w-[210mm] bg-white p-[15mm] shadow-lg">
        {/* HEADER */}
        <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
          <div className="flex gap-4">
            {/* Logo placeholder - simulated SVG similar to Luce Nera */}
            <div className="flex flex-col uppercase font-black text-3xl leading-none tracking-tighter">
              <span className="flex items-center">
                <span className="bg-black text-white px-2 rounded-md mr-1 pb-1">
                  l
                </span>
                uce
              </span>
              <span className="pl-0">nera</span>
            </div>

            <div className="text-[11px] leading-tight mt-1 text-gray-600">
              <p className="font-bold text-gray-900 text-[13px]">Luce Nera</p>
              <p>Manoella Zauith Leite Lopes</p>
              <p>14.025-270 Rua Ayrton Roxo 867</p>
              <p>Alto Da Boa Vista, Ribeirao Preto/sp</p>
              <p>(16) 3442 - 3545</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-[10px] w-64">
            {/* Page number is simulated, ideally rely on print margins, but putting 1 de 1 as fallback */}
            <div className="text-right w-full font-semibold">1 de 1</div>

            <div className="w-full mt-4 border-b border-black text-center pb-1">
              Aprovação do Cliente
            </div>
            <div className="w-full mt-4 border-b border-black text-center pb-1">
              Lucenera
            </div>
            <div className="w-full text-right text-gray-500 italic mt-1">
              Data Impressão {printDate}
            </div>
          </div>
        </div>

        {/* ORÇAMENTO INFO */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[13px] text-gray-600">Orçamento para</div>
            <div className="text-[16px] font-bold uppercase mb-1">
              {budget.cliente?.nome || 'CLIENTE NÃO INFORMADO'}
            </div>
            <div className="text-[11px] text-gray-600">
              CEP: {budget.cliente?.cep || '-'} / TEL:{' '}
              {budget.cliente?.telefone || budget.cliente?.celular || '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[16px] text-gray-600">Orçamento</div>
            <div className="text-[20px] font-bold text-gray-800">
              #{budget.numero || budget.id.split('-')[0].toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex gap-16 mb-8 text-[11px]">
          <div>
            <div className="text-gray-500">Vendedor</div>
            <div className="font-bold">{vendedorNome || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">Arquiteto Externo</div>
            <div className="font-bold">{budget.arquiteto?.nome || '-'}</div>
          </div>
        </div>

        {/* TABLE */}
        <div className="mb-8 w-full border-t border-b border-gray-200 py-2 page-break">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-2 text-gray-800 font-bold w-12">ID</th>
                <th className="py-2 text-gray-800 font-bold w-20">Código</th>
                <th className="py-2 text-gray-800 font-bold">Descrição</th>
                <th className="py-2 text-gray-800 font-bold text-center w-12">
                  Qtd.
                </th>
                <th className="py-2 text-gray-800 font-bold text-center w-12">
                  Un.
                </th>
                <th className="py-2 text-gray-800 font-bold text-right w-24">
                  Vl. Unit.
                </th>
                <th className="py-2 text-gray-800 font-bold text-right w-24">
                  Vl. Total
                </th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {sortedItems.map((item, idx) => {
                const prevItem = sortedItems[idx - 1]
                const isAccessory =
                  prevItem &&
                  prevItem.custom_id === item.custom_id &&
                  item.custom_id

                const gross =
                  Number(item.quantidade) * Number(item.preco_unitario)
                const finalVal = gross * (1 - Number(item.desconto || 0) / 100)

                return (
                  <tr
                    key={item.id || idx}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-3 text-gray-700 align-top">
                      {isAccessory ? '' : item.custom_id || '-'}
                    </td>
                    <td className="py-3 text-gray-700 align-top">
                      {item.produto?.referencia ||
                        item.produto?.codigo_legado ||
                        item.produto?.codigo_produto ||
                        '-'}
                    </td>
                    <td
                      className={`py-3 text-gray-800 align-top pr-4 ${isAccessory ? 'pl-4' : ''}`}
                    >
                      {item.produto?.nome || 'Produto sem nome'}
                      {item.desconto > 0 && (
                        <span className="block text-[9px] text-gray-500 mt-0.5">
                          Desconto aplicado: {item.desconto}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center align-top">
                      {item.quantidade}
                    </td>
                    <td className="py-3 text-center align-top">
                      {item.produto?.unidade || 'UN'}
                    </td>
                    <td className="py-3 text-right align-top">
                      {formatCurrency(item.preco_unitario)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900 align-top">
                      {formatCurrency(finalVal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* SUMMARY */}
        <div className="flex justify-end mb-12 page-break">
          <div className="w-1/2 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between py-1 text-gray-600">
              <span>SubTotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-gray-600">
              <span>Desconto:</span>
              <span>
                {formatCurrency(
                  totalDiscounts + (Number(budget.desconto_global) || 0),
                )}
              </span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold text-gray-900 border-t border-gray-200 mt-2">
              <span>Valor Total:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>

            <div className="mt-4 text-right">
              <span className="text-gray-500 text-[11px] block">
                Forma de Pagamento
              </span>
              <span className="font-bold text-[12px]">
                {budget.condicoes_pagamento || 'Não informada'}
              </span>
            </div>
          </div>
        </div>

        {/* POLICIES */}
        <div className="text-[10px] text-gray-700 leading-relaxed mt-10 page-break">
          <p className="font-bold text-black mb-2 uppercase">
            OBSERVAÇÕES: POLÍTICA DE TROCA / DEVOLUÇÃO:
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              Este orçamento tem{' '}
              <span className="font-bold">
                validade de 10 dias (
                {format(
                  new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                  'dd/MM/yyyy',
                )}
                )
              </span>
              .
            </li>
            <li>
              Considera-se inclusas{' '}
              <span className="font-bold">3 visitas técnicas</span> em obras na
              cidade de ribeirão Preto, visitas extras serão cobradas a parte.
            </li>
            <li>
              <span className="font-bold">Não estão inclusas</span>: visitas em
              obras fora da cidade de Ribeirão Preto e em vendas que o projeto
              não seja realizado pela LuceNera.
            </li>
            <li>
              A LuceNera se reserva ao direto de não aceitar trocas e
              devoluções, de acordo com o Código de Defesa do Consumidor.
            </li>
            <li>
              Quando a obra for na cidade de{' '}
              <span className="font-bold">Ribeirão Preto/SP</span> o frete dos
              produtos será por conta da LuceNera, caso a obra for em{' '}
              <span className="font-bold">outra cidade</span> o frete fica por
              conta do cliente.
            </li>
            <li>
              O prazo de entrega padrão dos materiais é de 30 dias, a partir da
              aprovação das fichas técnicas. Pelos materiais especiais, prazo a
              consultar.
            </li>
          </ol>
        </div>

        {/* FOOTER */}
        <div className="mt-16 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 pb-2">
          Connect Systems Enterprise Technologies, Inc. All rights reserved.
        </div>
      </div>

      {/* Floating print button for non-print mode */}
      <div className="fixed bottom-8 right-8 hide-on-print">
        <button
          onClick={() => window.print()}
          className="bg-black hover:bg-gray-800 text-white rounded-full p-4 shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span className="font-semibold pr-2">Imprimir Orçamento</span>
        </button>
      </div>
    </div>
  )
}
