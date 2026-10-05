import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Search, Link2 } from 'lucide-react'
import { buscarVendasEfetivadas, type VendaEfetivada } from '@/services/devolucoesService'

const FMT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// SPEC-181: ao escolher Devolução/Troca, o orçamento precisa ser vinculado a
// UMA venda efetivada. Esta janela abre sozinha ao escolher o tipo e define
// empresa, projeto e cliente da devolução.
export function VendaOrigemDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (venda: VendaEfetivada) => void
}) {
  const [vendas, setVendas] = useState<VendaEfetivada[]>([])
  const [loading, setLoading] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!open) {
      setBusca('')
      return
    }
    setLoading(true)
    buscarVendasEfetivadas()
      .then(setVendas)
      .catch(() => setVendas([]))
      .finally(() => setLoading(false))
  }, [open])

  const filtradas = useMemo(() => {
    const termos = busca.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (termos.length === 0) return vendas
    return vendas.filter((v) => {
      const texto = [v.numero_venda, v.numero, v.cliente_nome, v.projeto_codigo, v.projeto_nome, v.empresa_nome]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return termos.every((t) => texto.includes(t))
    })
  }, [vendas, busca])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Vincular venda de origem
          </DialogTitle>
          <DialogDescription>
            A devolução/troca precisa estar vinculada a uma venda efetivada. Empresa,
            projeto e cliente vêm da venda escolhida.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar por número da venda, cliente, projeto ou empresa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Nenhuma venda efetivada encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-semibold">
                      {v.numero_venda}
                      <div className="text-xs font-normal text-muted-foreground">
                        {v.numero}
                        {v.data_emissao
                          ? ` · ${new Date(v.data_emissao).toLocaleDateString('pt-BR')}`
                          : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{v.cliente_nome || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {v.projeto_codigo || '-'}
                      {v.projeto_nome && (
                        <div className="text-xs text-muted-foreground">{v.projeto_nome}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{v.empresa_nome || '-'}</TableCell>
                    <TableCell className="text-right text-sm">{FMT.format(v.valor_total)}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => onSelect(v)}>
                        Vincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
