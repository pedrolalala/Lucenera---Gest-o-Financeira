import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase/client'

export interface BudgetPriceUpdateItemInput {
  /** Chave estável para aplicar o preço de volta no item certo (ex.: índice
   * do fieldArray do form). Não precisa ser o id no banco. */
  key: string
  produto_id: string | null | undefined
  preco_unitario: number
  desconto: number
  quantidade: number
}

interface BudgetPriceUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Data em que o orçamento venceu (validade, ou emissão + 10 dias). */
  vencimento: Date | null
  itens: BudgetPriceUpdateItemInput[]
  budgetNumero?: string | null
  /** Chamado só quando o usuário confirma "Sim" -- nunca salva nada por
   * conta própria, só devolve os novos preços para o form aplicar. */
  onApply: (
    precosPorChave: Map<string, number>,
    renovarValidade: boolean,
  ) => void
  onSkip: () => void
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// SPEC-174 N3 (decisão do usuário, 01/10): aviso de orçamento vencido
// (validade padrão de 10 dias, SPEC-095) oferecendo atualizar o
// preco_unitario de cada item com cadastro (produto_id) pelo preço de
// venda ATUAL (`produtos.preco_venda`, com fallback para `valor_venda` --
// mesma regra que o resto do orçamento já usa ao adicionar produto, ver
// ProductSearchModal.tsx/EditableBudgetItemsTable.tsx/BudgetFormPage.tsx
// linha ~1855). Mantém o desconto de cada item; item sem cadastro não muda.
// Nunca salva sozinho -- só devolve os valores para o form; quem chama
// decide o que fazer e o usuário salva normalmente pelo formulário.
export function BudgetPriceUpdateDialog({
  open,
  onOpenChange,
  vencimento,
  itens,
  budgetNumero,
  onApply,
  onSkip,
}: BudgetPriceUpdateDialogProps) {
  const [loading, setLoading] = useState(true)
  const [precoAtualPorProduto, setPrecoAtualPorProduto] = useState<
    Map<string, number>
  >(new Map())
  const [renovarValidade, setRenovarValidade] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setRenovarValidade(true)
    const produtoIds = Array.from(
      new Set(
        itens
          .map((i) => i.produto_id)
          .filter((id): id is string => Boolean(id)),
      ),
    )
    if (produtoIds.length === 0) {
      setPrecoAtualPorProduto(new Map())
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('produtos')
      .select('id, preco_venda, valor_venda')
      .in('id', produtoIds)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          toast.error('Erro ao buscar os preços atuais dos produtos', {
            description: error.message,
          })
          setPrecoAtualPorProduto(new Map())
          setLoading(false)
          return
        }
        const map = new Map<string, number>()
        ;(data || []).forEach((p: any) => {
          map.set(p.id, Number(p.preco_venda) || Number(p.valor_venda) || 0)
        })
        setPrecoAtualPorProduto(map)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // itens muda de referência a cada render -- compara só pelos
    // produto_ids relevantes via produtoIds.join, não pelo array em si.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, produtoIds_join(itens)])

  function calcularItem(item: BudgetPriceUpdateItemInput) {
    const d = Math.round(Number(item.desconto) || 0)
    const q = Number(item.quantidade) || 0
    const precoAntigo = Number(item.preco_unitario) || 0
    const precoNovo =
      item.produto_id && precoAtualPorProduto.has(item.produto_id)
        ? precoAtualPorProduto.get(item.produto_id)!
        : null
    return {
      precoAntigo,
      precoNovo,
      totalAntigo: q * precoAntigo * (1 - d / 100),
      totalNovo: q * (precoNovo ?? precoAntigo) * (1 - d / 100),
    }
  }

  const resumo = itens.reduce(
    (acc, item) => {
      const { precoNovo, totalAntigo, totalNovo } = calcularItem(item)
      acc.totalAntes += totalAntigo
      acc.totalDepois += totalNovo
      if (precoNovo !== null) {
        acc.comCadastro += 1
        if (
          Math.round(precoNovo * 100) !==
          Math.round((Number(item.preco_unitario) || 0) * 100)
        ) {
          acc.alterados += 1
        }
      }
      return acc
    },
    { totalAntes: 0, totalDepois: 0, comCadastro: 0, alterados: 0 },
  )

  const handleApply = () => {
    const precos = new Map<string, number>()
    itens.forEach((item) => {
      if (item.produto_id && precoAtualPorProduto.has(item.produto_id)) {
        precos.set(item.key, precoAtualPorProduto.get(item.produto_id)!)
      }
    })
    onApply(precos, renovarValidade)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Orçamento vencido
          </DialogTitle>
          <DialogDescription>
            {budgetNumero ? `Orçamento ${budgetNumero}. ` : ''}
            Orçamento vencido em{' '}
            {vencimento
              ? format(vencimento, 'dd/MM/yyyy', { locale: ptBR })
              : '-'}{' '}
            — deseja atualizar os preços? Custo, margem e impostos podem ter
            mudado desde a emissão.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Buscando preços
            atuais...
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              {resumo.comCadastro} de {itens.length} ite
              {itens.length === 1 ? 'm' : 'ns'} com cadastro de produto;{' '}
              {resumo.alterados} com preço diferente do atual. Os descontos
              por item são mantidos; itens sem cadastro não mudam.
            </p>
            <div className="rounded-lg border bg-gray-50 p-3 flex items-center justify-between">
              <span className="text-gray-500">Total atual</span>
              <span className="font-mono">{BRL.format(resumo.totalAntes)}</span>
            </div>
            <div className="rounded-lg border bg-amber-50 p-3 flex items-center justify-between">
              <span className="text-amber-700 font-medium">
                Total com preços atualizados
              </span>
              <span className="font-mono font-bold text-amber-800">
                {BRL.format(resumo.totalDepois)}
              </span>
            </div>
            <label className="flex items-center gap-2 text-gray-700">
              <Checkbox
                checked={renovarValidade}
                onCheckedChange={(v) => setRenovarValidade(Boolean(v))}
              />
              Renovar a validade (+10 dias a partir de hoje)
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onSkip} disabled={loading}>
            Não, manter preços atuais
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || resumo.comCadastro === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sim, atualizar preços
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function produtoIds_join(itens: BudgetPriceUpdateItemInput[]): string {
  return itens
    .map((i) => i.produto_id || '')
    .filter(Boolean)
    .join(',')
}
