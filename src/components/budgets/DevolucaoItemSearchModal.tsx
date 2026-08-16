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
import { Loader2, Search, Check, Undo2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import {
  getVendasOrigemParaDevolucao,
  type VendaOrigemItem,
} from '@/services/devolucoesService'

const FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export interface DevolucaoSelection {
  venda: VendaOrigemItem
  quantidade: number
}

// SPEC-071: modal de busca de "venda de origem" para orçamentos com
// natureza_operacao = 'devolucao'. Substitui o ProductSearchModal comum
// quando o usuário está lançando itens de devolução — a origem de cada
// linha precisa ser um projeto_itens já aprovado, nunca um produto solto.
export function DevolucaoItemSearchModal({
  open,
  onOpenChange,
  clienteId,
  projetoId,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  clienteId: string | null | undefined
  // SPEC-105: casa por projeto atual também, não só por cliente — ver
  // comentário em devolucoesService.ts.
  projetoId: string | null | undefined
  onConfirm: (itens: DevolucaoSelection[]) => void
}) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [vendas, setVendas] = useState<VendaOrigemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Map<string, DevolucaoSelection>>(
    new Map(),
  )

  useEffect(() => {
    if (!open) {
      setSearch('')
      setVendas([])
      setSelected(new Map())
      return
    }
    if (!clienteId && !projetoId) {
      setVendas([])
      return
    }
    setLoading(true)
    getVendasOrigemParaDevolucao(clienteId, projetoId, debounced)
      .then(setVendas)
      .catch(() => setVendas([]))
      .finally(() => setLoading(false))
  }, [open, clienteId, projetoId, debounced])

  const toggleSelect = (venda: VendaOrigemItem) => {
    setSelected((s) => {
      const n = new Map(s)
      if (n.has(venda.projeto_item_id)) n.delete(venda.projeto_item_id)
      else
        n.set(venda.projeto_item_id, {
          venda,
          quantidade: Math.min(1, venda.quantidade_disponivel),
        })
      return n
    })
  }

  const updateQuantidade = (projetoItemId: string, quantidade: number) => {
    setSelected((s) => {
      const n = new Map(s)
      const entry = n.get(projetoItemId)
      if (entry) {
        n.set(projetoItemId, {
          ...entry,
          quantidade: Math.max(
            0.01,
            Math.min(entry.venda.quantidade_disponivel, quantidade),
          ),
        })
      }
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
            Buscar Venda de Origem para Devolução
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código do produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={!clienteId && !projetoId}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            A busca cruza todos os projetos deste cliente e também as vendas
            já feitas neste projeto — mostra qualquer venda anterior com
            saldo ainda disponível para devolução (reserva + entrega futura +
            entregue).
          </p>
        </div>

        <div className="flex-1 overflow-auto">
          {!clienteId && !projetoId ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Selecione um projeto no orçamento antes de buscar a venda de
              origem.
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-24">Devolver</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Disponível p/ Devolução</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhuma venda com saldo disponível para devolução
                      encontrada para este cliente.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.map((v) => {
                    const isSelected = selected.has(v.projeto_item_id)
                    return (
                      <TableRow
                        key={v.projeto_item_id}
                        data-state={isSelected ? 'selected' : undefined}
                        className={isSelected ? 'bg-primary/10' : undefined}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => toggleSelect(v)}
                            >
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                'Selecionar'
                              )}
                            </Button>
                          </div>
                          {isSelected && (
                            <Input
                              type="number"
                              min="0.01"
                              max={v.quantidade_disponivel}
                              step="0.01"
                              value={
                                selected.get(v.projeto_item_id)?.quantidade ?? 1
                              }
                              onChange={(e) =>
                                updateQuantidade(
                                  v.projeto_item_id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-20 h-7 text-xs text-center px-1 mt-1"
                              title="Quantidade a devolver desta venda"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.produto || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary">
                          {v.produto_codigo ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.projeto_codigo || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.orcamento_numero || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {FMT.format(v.preco_unitario)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {v.quantidade_disponivel}
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
