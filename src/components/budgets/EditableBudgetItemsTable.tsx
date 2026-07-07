import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditableOrcamentoData } from '@/services/financialApprovalEditService'
import { EditableItemCard } from '@/components/budgets/EditableItemCard'
import {
  ProductSearchModal,
  type ProductSearchItem,
} from '@/components/budgets/ProductSearchModal'
import { ProductCreateModal } from '@/components/budgets/ProductCreateModal'
import { isValidUUID } from '@/lib/uuid'
import { sortItemsByCircuitId } from '@/lib/utils'
import type { ProductCatalogItem } from '@/services/productCatalogService'
import { toast } from 'sonner'

interface EditableBudgetItemsTableProps {
  orcamentos: EditableOrcamentoData[]
  onChange: (orcamentos: EditableOrcamentoData[]) => void
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
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v || 0,
  )

export function EditableBudgetItemsTable({
  orcamentos,
  onChange,
}: EditableBudgetItemsTableProps) {
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
  const [searchTarget, setSearchTarget] = useState<{
    orcId: string
    itemId: string
  } | null>(null)
  const [addTargetOrc, setAddTargetOrc] = useState<string | null>(null)
  const [isProductCreateOpen, setIsProductCreateOpen] = useState(false)
  const [createTarget, setCreateTarget] = useState<{
    orcId: string
    itemId: string
  } | null>(null)

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

  const handleSearchProduct = (orcId: string, itemId: string) => {
    setSearchTarget({ orcId, itemId })
    setAddTargetOrc(null)
    setIsProductSearchOpen(true)
  }

  const handleCreateProduct = (orcId: string, itemId: string) => {
    setCreateTarget({ orcId, itemId })
    setIsProductCreateOpen(true)
  }

  const handleAddItem = (orcId: string) => {
    setAddTargetOrc(orcId)
    setSearchTarget(null)
    setIsProductSearchOpen(true)
  }

  const handleRemoveItem = (orcId: string, itemId: string) => {
    onChange(
      orcamentos.map((o) => {
        if (o.id !== orcId) return o
        const itens = o.itens.filter((i) => i.id !== itemId)
        const valor_total = itens.reduce(
          (s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0),
          0,
        )
        return { ...o, itens, valor_total }
      }),
    )
  }

  const handleProductCreateConfirm = (newProduct: ProductCatalogItem) => {
    if (createTarget) {
      const { orcId, itemId } = createTarget
      onChange(
        orcamentos.map((o) => {
          if (o.id !== orcId) return o
          const itens = o.itens.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  produto_id: newProduct.id,
                  produto_info: {
                    codigo_produto: newProduct.codigo_produto,
                    referencia: newProduct.referencia,
                    nome: newProduct.nome,
                    sku: newProduct.sku,
                  },
                  preco_unitario:
                    newProduct.valor_venda ||
                    newProduct.preco_venda ||
                    i.preco_unitario,
                  descricao: '',
                }
              : i,
          )
          const valor_total = itens.reduce(
            (s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0),
            0,
          )
          return { ...o, itens, valor_total }
        }),
      )
      toast.success('Produto criado e adicionado ao orçamento.')
    }

    setIsProductCreateOpen(false)
    setCreateTarget(null)
  }

  const handleProductConfirm = (products: ProductSearchItem[]) => {
    if (products.length === 0 || (!searchTarget && !addTargetOrc)) {
      setIsProductSearchOpen(false)
      setSearchTarget(null)
      setAddTargetOrc(null)
      return
    }

    const p = products[0]
    const isProduto = p.source === 'produtos' && isValidUUID(p.id)
    const preco = p.preco_venda || p.valor_venda || 0
    const produtoInfo = isProduto
      ? {
          codigo_produto: p.codigo_produto,
          referencia: p.referencia,
          nome: p.nome,
          sku: p.sku,
        }
      : null

    if (searchTarget) {
      const { orcId, itemId } = searchTarget
      onChange(
        orcamentos.map((o) => {
          if (o.id !== orcId) return o
          const itens = o.itens.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  produto_id: isProduto ? p.id : null,
                  produto_info: produtoInfo,
                  preco_unitario: preco || i.preco_unitario,
                  descricao: isProduto ? '' : p.nome,
                }
              : i,
          )
          const valor_total = itens.reduce(
            (s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0),
            0,
          )
          return { ...o, itens, valor_total }
        }),
      )
    } else if (addTargetOrc) {
      const newItem = {
        id: crypto.randomUUID(),
        produto_id: isProduto ? p.id : null,
        descricao: isProduto ? '' : p.nome,
        quantidade: 1,
        preco_unitario: preco,
        desconto: 0,
        custom_id: '',
        ordem: null,
        peca_nova: false,
        produto_info: produtoInfo,
      }
      onChange(
        orcamentos.map((o) => {
          if (o.id !== addTargetOrc) return o
          const itens = [...o.itens, newItem]
          const valor_total = itens.reduce(
            (s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0),
            0,
          )
          return { ...o, itens, valor_total }
        }),
      )
    }

    if (products.length > 1) {
      toast.info(
        `${products.length - 1} produto(s) adicional(is) não foram adicionados.`,
      )
    }

    setIsProductSearchOpen(false)
    setSearchTarget(null)
    setAddTargetOrc(null)
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
          <div className="space-y-2">
            {sortItemsByCircuitId(orc.itens).map((item, idx, arr) => (
              <EditableItemCard
                key={item.id}
                item={item}
                orcId={orc.id}
                prevCustomId={idx > 0 ? arr[idx - 1].custom_id : null}
                onUpdate={updateItem}
                onSearchProduct={handleSearchProduct}
                onCreateProduct={handleCreateProduct}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddItem(orc.id)}
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Item
            </Button>
            <span className="text-sm font-bold text-green-700">
              Total: {fmt(orc.valor_total)}
            </span>
          </div>
        </div>
      ))}

      <ProductSearchModal
        open={isProductSearchOpen}
        onOpenChange={(v) => {
          setIsProductSearchOpen(v)
          if (!v) {
            setSearchTarget(null)
            setAddTargetOrc(null)
          }
        }}
        onConfirm={handleProductConfirm}
      />

      <ProductCreateModal
        open={isProductCreateOpen}
        onOpenChange={(v) => {
          setIsProductCreateOpen(v)
          if (!v) setCreateTarget(null)
        }}
        onSuccess={handleProductCreateConfirm}
        initialName={
          createTarget
            ? orcamentos
                .find((orc) => orc.id === createTarget.orcId)
                ?.itens.find((item) => item.id === createTarget.itemId)
                ?.descricao || ''
            : ''
        }
      />
    </div>
  )
}
