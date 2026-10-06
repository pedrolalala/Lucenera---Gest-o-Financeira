import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Loader2, Search, Check, Undo2, Lock } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { semPrefixo } from '@/lib/numeros'
import {
  getVendasOrigemParaDevolucao,
  SETOR_DEVOLUCAO_LABEL,
  type SetorDevolucao,
  type VendaOrigemItem,
} from '@/services/devolucoesService'

// SPEC-178: cor do setor — físico (reserva/entregue) volta ao estoque;
// entrega futura é devolução virtual (só reduz a necessidade de compra);
// em separação aparece, mas bloqueada (SPEC-182).
const SETOR_CLASSE: Record<SetorDevolucao, string> = {
  reserva: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  em_separacao: 'border-sky-300 bg-sky-50 text-sky-800',
  entregue: 'border-slate-300 bg-slate-100 text-slate-800',
  entrega_futura: 'border-amber-300 bg-amber-50 text-amber-800',
}

const FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export interface DevolucaoSelection {
  venda: VendaOrigemItem
  quantidade: number
}

// SPEC-071: modal de busca de "venda de origem" para orçamentos com
// natureza_operacao = 'devolucao'. SPEC-182: busca dentro de todas as vendas
// efetivadas do PROJETO feitas pela EMPRESA da devolução; "Em separação"
// aparece bloqueada (cancelar a separação antes).
export function DevolucaoItemSearchModal({
  open,
  onOpenChange,
  projetoId,
  empresaId,
  empresaNome,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  projetoId: string | null | undefined
  empresaId: string | null | undefined
  empresaNome: string | null | undefined
  onConfirm: (itens: DevolucaoSelection[]) => void
}) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [vendas, setVendas] = useState<VendaOrigemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Map<string, DevolucaoSelection>>(
    new Map(),
  )
  const pronto = !!projetoId && !!empresaId

  useEffect(() => {
    if (!open) {
      setSearch('')
      setVendas([])
      setSelected(new Map())
      return
    }
    if (!pronto) {
      setVendas([])
      return
    }
    setLoading(true)
    getVendasOrigemParaDevolucao(projetoId, empresaId, debounced)
      .then(setVendas)
      .catch(() => setVendas([]))
      .finally(() => setLoading(false))
  }, [open, pronto, projetoId, empresaId, debounced])

  // SPEC-178: a seleção é a própria quantidade "A Devolver" (última coluna):
  // maior que zero seleciona a linha, zero/vazio tira. Nunca passa do saldo
  // disponível para devolução.
  const setQuantidade = (venda: VendaOrigemItem, quantidade: number) => {
    if (!venda.devolvivel) return
    setSelected((s) => {
      const n = new Map(s)
      const q = Math.min(
        venda.quantidade_disponivel,
        Math.max(0, quantidade || 0),
      )
      if (q > 0) n.set(venda.chave, { venda, quantidade: q })
      else n.delete(venda.chave)
      return n
    })
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selected.values()))
    setSelected(new Map())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="w-5 h-5" />
            Buscar Itens do Projeto para Devolução
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pelo código da peça ou nome do produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={!pronto}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Mostra as peças de todas as vendas efetivadas deste projeto feitas
            pela {empresaNome || 'empresa da devolução'}. O valor já vem com o
            desconto dado na venda. Informe a quantidade em "A Devolver" — uma
            linha por setor (Reserva e Entregue voltam ao estoque na aprovação;
            Entrega futura só reduz a necessidade de compra). Peça "Em
            separação" não pode ser devolvida: cancele a separação antes.
          </p>
        </div>

        <div className="flex-1 overflow-auto">
          {!pronto ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Escolha o projeto e a empresa da devolução (aba 1) antes de buscar
              os itens.
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                {/* SPEC-178: ordem pedida — L / Código / Referência /
                    Descrição / Número da Venda / Quantidade da Venda / A
                    Devolver (quantidade digitada, sempre por último). */}
                <TableRow>
                  <TableHead className="w-16">L</TableHead>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead className="w-40">Referência</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-32">Nº da Venda</TableHead>
                  <TableHead className="w-44 text-center">
                    Qtd. da Venda
                  </TableHead>
                  {/* SPEC-178 (R3): uma linha por setor da venda. */}
                  <TableHead className="w-36 text-center">Setor</TableHead>
                  <TableHead className="w-32 text-center">A Devolver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhuma peça com saldo para devolução nas vendas
                      efetivadas deste projeto nesta empresa.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.map((v) => {
                    const isSelected = selected.has(v.chave)
                    return (
                      <TableRow
                        key={v.chave}
                        data-state={isSelected ? 'selected' : undefined}
                        className={
                          isSelected
                            ? 'bg-primary/10'
                            : !v.devolvivel
                              ? 'bg-muted/40 text-muted-foreground'
                              : undefined
                        }
                      >
                        <TableCell className="font-mono text-sm">
                          {v.l_fixo || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary">
                          {v.produto_codigo ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.referencia || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{v.produto || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {FMT.format(v.preco_liquido)} un.
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {semPrefixo(v.venda_numero)}
                          {v.empresa_nome && (
                            <div className="text-xs font-normal text-muted-foreground">
                              {v.empresa_nome}
                            </div>
                          )}
                        </TableCell>
                        {/* R1/R2: o saldo é do que foi VENDIDO (vendido −
                            já devolvido), não do estoque do produto. */}
                        <TableCell className="text-sm text-center">
                          <span className="font-semibold">
                            {v.quantidade_venda}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            já devolvido: {v.quantidade_devolvida} · saldo do
                            item: {v.saldo_item}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${SETOR_CLASSE[v.setor]}`}
                          >
                            {SETOR_DEVOLUCAO_LABEL[v.setor]}
                          </span>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            saldo no setor: {v.quantidade_disponivel}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {!v.devolvivel ? (
                            <div
                              className="mx-auto flex max-w-[11rem] items-center justify-center gap-1 text-xs font-medium text-sky-800"
                              title="Cancele a separação antes de devolver"
                            >
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              Cancele a separação antes
                            </div>
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              max={v.quantidade_disponivel}
                              step="1"
                              placeholder="0"
                              value={selected.get(v.chave)?.quantidade ?? ''}
                              onChange={(e) =>
                                setQuantidade(
                                  v,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-24 h-8 mx-auto text-center"
                              title={`Até ${v.quantidade_disponivel} (saldo de ${SETOR_DEVOLUCAO_LABEL[v.setor]} nesta venda)`}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selected.size} linha(s) selecionada(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={selected.size === 0}>
              <Check className="w-4 h-4 mr-2" />
              Confirmar Seleção ({selected.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
