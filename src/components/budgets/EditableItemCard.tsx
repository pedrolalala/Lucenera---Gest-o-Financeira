import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ProductSelectButton } from '@/components/ProductSelectButton'
import { PackageSearch, PackagePlus, Trash2 } from 'lucide-react'
import { formatCircuitId, formatCircuitIdInput } from '@/lib/utils'
import { isValidUUID } from '@/lib/uuid'
import type { EditableItemData } from '@/services/financialApprovalEditService'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

interface EditableItemCardProps {
  item: EditableItemData
  orcId: string
  prevCustomId?: string | null
  onUpdate: (orcId: string, itemId: string, field: string, value: any) => void
  onSearchProduct: (orcId: string, itemId: string) => void
  onCreateProduct?: (orcId: string, itemId: string) => void
  onRemove?: (orcId: string, itemId: string) => void
}

export function EditableItemCard({
  item,
  orcId,
  prevCustomId,
  onUpdate,
  onSearchProduct,
  onCreateProduct,
  onRemove,
}: EditableItemCardProps) {
  const q = Number(item.quantidade) || 0
  const p = Number(item.preco_unitario) || 0
  const d = Math.round(Number(item.desconto) || 0)
  const subtotal = q * p * (1 - d / 100)

  const hasProduct =
    Boolean(item.produto_id) && isValidUUID(item.produto_id || '')
  const info = item.produto_info

  const currentCircuit = formatCircuitId(item.custom_id || '')
  const prevCircuit = formatCircuitId(prevCustomId || '')
  const isNewGroup = !prevCustomId || currentCircuit !== prevCircuit

  return (
    <div className="w-full">
      {isNewGroup && currentCircuit && (
        <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0 animate-fade-in">
          <div className="h-px bg-primary/20 flex-1" />
          <span
            title="Luminária"
            className="text-xs font-bold uppercase text-primary px-3 py-0.5 rounded-full bg-primary/10"
          >
            {currentCircuit}
          </span>
          <div className="h-px bg-primary/20 flex-1" />
        </div>
      )}

      <div className="w-full bg-white p-3 rounded-xl border shadow-sm transition-all hover:shadow-md">
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-end gap-2">
          <div className="shrink-0 lg:w-[60px]">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              Luminária
            </Label>
            <Input
              placeholder="L01"
              maxLength={4}
              title="Identificador da Luminária (ex: L01)"
              value={item.custom_id || ''}
              onChange={(e) =>
                onUpdate(
                  orcId,
                  item.id,
                  'custom_id',
                  formatCircuitIdInput(e.target.value),
                )
              }
              onBlur={() => {
                if (item.custom_id)
                  onUpdate(
                    orcId,
                    item.id,
                    'custom_id',
                    formatCircuitId(item.custom_id),
                  )
              }}
              onFocus={() => {
                if (!item.custom_id) onUpdate(orcId, item.id, 'custom_id', 'L')
              }}
              className="text-center text-sm font-mono h-9"
            />
          </div>

          <div className="shrink-0 lg:w-[110px]">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              Código Produto
            </Label>
            <Input
              readOnly
              value={
                info?.codigo_produto != null ? String(info.codigo_produto) : ''
              }
              placeholder="-"
              className="bg-muted/40 font-mono text-sm font-bold text-primary h-9 cursor-default"
            />
          </div>

          <div className="shrink-0 lg:w-[130px]">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              Código de Referência
            </Label>
            <Input
              readOnly
              value={info?.sku || ''}
              placeholder="-"
              className="bg-muted/40 font-mono text-xs text-gray-600 h-9 cursor-default truncate"
            />
          </div>

          <div className="flex-1 min-w-0">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              {hasProduct ? 'Produto' : 'Descrição do Produto'}
            </Label>
            {hasProduct ? (
              <ProductSelectButton
                value={item.produto_id || ''}
                onClick={() => onSearchProduct(orcId, item.id)}
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Descrição do item não cadastrado..."
                  value={item.descricao || ''}
                  onChange={(e) =>
                    onUpdate(orcId, item.id, 'descricao', e.target.value)
                  }
                  className="flex-1 h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onSearchProduct(orcId, item.id)}
                  title="Buscar produto cadastrado"
                  className="shrink-0 h-9 w-9"
                >
                  <PackageSearch className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onCreateProduct?.(orcId, item.id)}
                  title="Criar novo produto"
                  className="shrink-0 h-9 w-9"
                >
                  <PackagePlus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="shrink-0 lg:w-[80px]">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              Qtd
            </Label>
            <Input
              type="number"
              step="1"
              min="1"
              max="9999"
              value={item.quantidade}
              onChange={(e) => {
                const val = e.target.value
                if (val.length > 4) return
                onUpdate(
                  orcId,
                  item.id,
                  'quantidade',
                  val ? Math.min(9999, Math.floor(Number(val))) : 0,
                )
              }}
              className="text-sm h-9 text-center"
            />
          </div>

          <div className="shrink-0 lg:w-[120px]">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              Preço Unit.
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={item.preco_unitario}
              onChange={(e) =>
                onUpdate(
                  orcId,
                  item.id,
                  'preco_unitario',
                  parseFloat(e.target.value) || 0,
                )
              }
              className="text-sm h-9 text-right"
            />
          </div>

          <div className="shrink-0 lg:w-20">
            <Label className="text-[10px] text-gray-500 font-medium uppercase">
              Desc %
            </Label>
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={item.desconto || 0}
              onChange={(e) =>
                onUpdate(
                  orcId,
                  item.id,
                  'desconto',
                  Math.round(Number(e.target.value) || 0),
                )
              }
              className="text-sm h-9 text-center"
            />
          </div>

          <div className="shrink-0 lg:w-28 flex flex-col gap-0.5 justify-end pb-1">
            <span className="text-[9px] uppercase font-bold text-gray-400">
              Subtotal
            </span>
            <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-1.5 rounded-md text-right">
              {BRL.format(subtotal)}
            </span>
          </div>

          <div className="shrink-0 flex flex-col gap-0.5 justify-end pb-1">
            <span className="text-[9px] uppercase font-bold text-gray-400">
              Peça Nova
            </span>
            <div className="flex items-center h-9">
              <Checkbox
                checked={item.peca_nova}
                onCheckedChange={(v) =>
                  onUpdate(orcId, item.id, 'peca_nova', v === true)
                }
              />
            </div>
          </div>

          {onRemove && (
            <div className="shrink-0 flex items-end pb-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => onRemove(orcId, item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
