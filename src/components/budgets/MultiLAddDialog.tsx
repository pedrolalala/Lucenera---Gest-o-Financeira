import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LQuantityRepeater, type LEntry } from './LQuantityRepeater'

/**
 * SPEC-079: substitui o antigo fluxo de "1 produto = 1 linha, 1
 * quantidade" — deixa adicionar vários L's (com quantidade própria cada)
 * pra uma mesma peça de uma vez, sem precisar buscar/adicionar o produto
 * várias vezes. Não muda o modelo de dados: ao confirmar, gera N linhas
 * independentes em `itens` (mesmo padrão que já existe hoje), uma por L.
 *
 * Modo "produto": nome/preço vêm do catálogo (somente leitura).
 * Modo "manual": descrição/preço são digitados uma vez, aplicados a
 * todas as linhas geradas (equivalente ao antigo "Adicionar Item não
 * Cadastrado", agora com suporte a múltiplos L's).
 */
interface MultiLAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produtoNome?: string
  produtoPreco?: number
  proximoL: string
  onConfirm: (payload: {
    descricao: string
    preco_unitario: number
    entries: LEntry[]
  }) => void
}

export function MultiLAddDialog({
  open,
  onOpenChange,
  produtoNome,
  produtoPreco,
  proximoL,
  onConfirm,
}: MultiLAddDialogProps) {
  const isManual = !produtoNome
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState(0)
  const [entries, setEntries] = useState<LEntry[]>([])

  useEffect(() => {
    if (open) {
      setDescricao('')
      setPreco(produtoPreco || 0)
      setEntries([{ custom_id: proximoL, quantidade: 1 }])
    }
  }, [open, proximoL, produtoPreco])

  const handleConfirm = () => {
    const validEntries = entries.filter(
      (e) => e.custom_id.trim() && Number(e.quantidade) > 0,
    )
    if (validEntries.length === 0) {
      toast.error('Adicione pelo menos um L com código e quantidade válidos.')
      return
    }
    if (isManual && !descricao.trim()) {
      toast.error('Informe a descrição do item.')
      return
    }
    onConfirm({
      descricao: isManual ? descricao.trim() : '',
      preco_unitario: preco,
      entries: validEntries,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isManual ? 'Adicionar Item não Cadastrado' : produtoNome}
          </DialogTitle>
          <DialogDescription>
            Adicione um ou mais L&apos;s para esta peça, cada um com sua
            própria quantidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isManual && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição do item"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={preco || ''}
                  onChange={(e) => setPreco(Number(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>L&apos;s desta peça</Label>
            <LQuantityRepeater value={entries} onChange={setEntries} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Adicionar ao Orçamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
