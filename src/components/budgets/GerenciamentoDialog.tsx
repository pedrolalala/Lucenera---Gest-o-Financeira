import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface GerenciamentoItem {
  uid?: string
  produto_id?: string
  descricao?: string
  quantidade: number
  preco_unitario: number
}

interface GerenciamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itens: GerenciamentoItem[]
  produtoNomes: Record<string, string>
  descontoAtual: number
  descontoTipo: 'percentual' | 'valor'
  onAplicarDesconto: (percentual: number) => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v || 0,
  )

// O painel so entende desconto em %: quando o orcamento tem desconto do
// tipo "valor" (R$ fixo, ex.: SPEC-068), converte pro percentual
// equivalente sobre o subtotal bruto antes de simular - sem isso o painel
// tratava um "R$ 1.000" como "1000%" (ou, na pratica, ignorava o desconto
// e mostrava lucro inflado, porque o form so aplica esse numero como
// percentual em algum outro lugar). Achado em producao, 2026-08-18.
function calcDescontoInicialPct(
  itens: GerenciamentoItem[],
  descontoAtual: number,
  descontoTipo: 'percentual' | 'valor',
): number {
  if (descontoTipo === 'percentual') return descontoAtual || 0
  const subtotalBruto = itens.reduce(
    (s, i) => s + i.preco_unitario * i.quantidade,
    0,
  )
  if (subtotalBruto <= 0) return 0
  return Math.min(Math.max((descontoAtual / subtotalBruto) * 100, 0), 100)
}

// Painel de análise só pra admin/gerente (SPEC-083): mostra custo/lucro por
// peça e permite simular um desconto global sem alterar o orçamento até a
// pessoa decidir aplicar. Peças sem produto cadastrado ("Adicionar Item não
// Cadastrado") não têm custo salvo em lugar nenhum — o custo é digitado só
// pra essa simulação, nunca persistido.
export function GerenciamentoDialog({
  open,
  onOpenChange,
  itens,
  produtoNomes,
  descontoAtual,
  descontoTipo,
  onAplicarDesconto,
}: GerenciamentoDialogProps) {
  const [custosProdutos, setCustosProdutos] = useState<Record<string, number>>(
    {},
  )
  const [custosManuais, setCustosManuais] = useState<Record<string, number>>(
    {},
  )
  const [descontoSimulado, setDescontoSimulado] = useState(
    calcDescontoInicialPct(itens, descontoAtual, descontoTipo),
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setDescontoSimulado(calcDescontoInicialPct(itens, descontoAtual, descontoTipo))
    const ids = Array.from(
      new Set(
        itens.map((i) => i.produto_id).filter((id): id is string => !!id),
      ),
    )
    if (ids.length === 0) {
      setCustosProdutos({})
      return
    }
    setLoading(true)
    supabase
      .from('produtos')
      .select('id, preco_custo')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, number> = {}
        ;(data || []).forEach((p: any) => {
          map[p.id] = p.preco_custo || 0
        })
        setCustosProdutos(map)
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const linhas = itens.map((item, idx) => {
    const key = item.uid || String(idx)
    const isAvulso = !item.produto_id
    const vendaUnitComDesconto =
      item.preco_unitario * (1 - descontoSimulado / 100)
    // SPEC-106: item avulso sem custo digitado ainda começa em 50% da venda
    // (não 0) — custo 0 fazia lucroPct nascer em 100%, mascarando a leitura
    // do orçamento antes de alguém preencher o custo real.
    const custoUnitario = isAvulso
      ? custosManuais[key] ?? vendaUnitComDesconto * 0.5
      : custosProdutos[item.produto_id as string] ?? 0
    const vendaTotal = vendaUnitComDesconto * item.quantidade
    const custoTotal = custoUnitario * item.quantidade
    const lucroTotal = vendaTotal - custoTotal
    const lucroPct = vendaTotal > 0 ? (lucroTotal / vendaTotal) * 100 : 0
    return {
      key,
      isAvulso,
      nome: item.produto_id
        ? produtoNomes[item.produto_id] || 'Produto'
        : item.descricao || 'Item avulso',
      quantidade: item.quantidade,
      vendaUnit: vendaUnitComDesconto,
      vendaTotal,
      custoUnitario,
      custoTotal,
      lucroTotal,
      lucroPct,
    }
  })

  const totalVenda = linhas.reduce((s, l) => s + l.vendaTotal, 0)
  const totalCusto = linhas.reduce((s, l) => s + l.custoTotal, 0)
  const totalLucro = totalVenda - totalCusto
  const totalLucroPct = totalVenda > 0 ? (totalLucro / totalVenda) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciamento do Orçamento</DialogTitle>
          <DialogDescription>
            Custo e lucro por peça — visível só para administradores/gerentes.
            Peças sem produto cadastrado não têm custo salvo; informe
            manualmente na tabela se quiser incluí-las no cálculo (não é
            salvo em lugar nenhum, vale só pra essa simulação).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Desconto simulado (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="w-28"
            value={descontoSimulado}
            onChange={(e) =>
              setDescontoSimulado(parseFloat(e.target.value) || 0)
            }
          />
          {descontoTipo === 'valor' && descontoAtual > 0 && (
            <span className="text-xs text-muted-foreground">
              equivalente ao desconto de {fmt(descontoAtual)} já aplicado ao
              orçamento
            </span>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onAplicarDesconto(descontoSimulado)
              toast.success('Desconto aplicado ao orçamento.')
            }}
          >
            Aplicar ao orçamento
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peça</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Venda (unit.)</TableHead>
              <TableHead className="text-right">Custo (unit.)</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">Lucro %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={l.key}>
                <TableCell className="max-w-[220px] truncate">
                  {l.nome}
                </TableCell>
                <TableCell className="text-right">{l.quantidade}</TableCell>
                <TableCell className="text-right">
                  {fmt(l.vendaUnit)}
                </TableCell>
                <TableCell className="text-right">
                  {l.isAvulso ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 ml-auto text-right"
                      placeholder="0,00"
                      value={custosManuais[l.key] ?? ''}
                      onChange={(e) =>
                        setCustosManuais((c) => ({
                          ...c,
                          [l.key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  ) : (
                    fmt(l.custoUnitario)
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right',
                    l.lucroTotal < 0 && 'text-red-600',
                  )}
                >
                  {fmt(l.lucroTotal)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right',
                    l.lucroTotal < 0 && 'text-red-600',
                  )}
                >
                  {l.lucroPct.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  {loading ? 'Carregando...' : 'Nenhum item no orçamento.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="border-t pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Subtotal venda:</span>{' '}
            <strong>{fmt(totalVenda)}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Subtotal custo:</span>{' '}
            <strong>{fmt(totalCusto)}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Lucro total:</span>{' '}
            <strong className={cn(totalLucro < 0 && 'text-red-600')}>
              {fmt(totalLucro)}
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground">Lucro %:</span>{' '}
            <strong className={cn(totalLucro < 0 && 'text-red-600')}>
              {totalLucroPct.toFixed(1)}%
            </strong>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
