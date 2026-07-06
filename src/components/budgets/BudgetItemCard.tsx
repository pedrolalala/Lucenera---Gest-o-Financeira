import { useFormContext, useWatch } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductSelectButton } from '@/components/ProductSelectButton'
import { Trash2, PackageSearch } from 'lucide-react'
import { formatCircuitId, formatCircuitIdInput } from '@/lib/utils'
import { isValidUUID } from '@/lib/uuid'

export interface ProductMeta {
  codigo_produto: number | null
  referencia: string | null
  nome: string | null
  sku: string | null
}

interface BudgetItemCardProps {
  index: number
  fieldId: string
  onRemove: (index: number) => void
  onSearchProduct: (index: number) => void
  getProductInfo: (produtoId: string | null | undefined) => ProductMeta | null
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function BudgetItemCard({
  index,
  fieldId,
  onRemove,
  onSearchProduct,
  getProductInfo,
}: BudgetItemCardProps) {
  const { control } = useFormContext()

  const customId = useWatch({ control, name: `itens.${index}.custom_id` }) || ''
  const produtoId =
    useWatch({ control, name: `itens.${index}.produto_id` }) || ''
  const quantidade = useWatch({ control, name: `itens.${index}.quantidade` })
  const precoUnitario = useWatch({
    control,
    name: `itens.${index}.preco_unitario`,
  })
  const desconto = useWatch({ control, name: `itens.${index}.desconto` })
  const prevCustomId =
    useWatch({
      control,
      name: `itens.${Math.max(0, index - 1)}.custom_id`,
    }) || ''

  const q = Number(quantidade) || 0
  const p = Number(precoUnitario) || 0
  const d = Math.round(Number(desconto) || 0)
  const itemSubtotal = q * p * (1 - d / 100)

  const currentCircuit = formatCircuitId(customId)
  const prevCircuit = formatCircuitId(prevCustomId)
  const isNewGroup = index === 0 || currentCircuit !== prevCircuit

  const hasProduct = Boolean(produtoId) && isValidUUID(produtoId)
  const productInfo = getProductInfo(produtoId)

  return (
    <div key={fieldId} className="w-full">
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

      <div className="w-full bg-white p-3 rounded-xl border shadow-sm relative group transition-all hover:shadow-md">
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-end gap-2">
          {/* Circuito - Fixed 60px, max 4 chars */}
          <div className="shrink-0 lg:w-[60px]">
            <FormField
              control={control}
              name={`itens.${index}.custom_id`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                    Luminária
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="L01"
                      maxLength={4}
                      title="Identificador da Luminária (ex: L01)"
                      value={f.value || ''}
                      onChange={(e) =>
                        f.onChange(formatCircuitIdInput(e.target.value))
                      }
                      onBlur={() => {
                        const current = f.value || ''
                        if (current) f.onChange(formatCircuitId(current))
                      }}
                      onFocus={() => {
                        if (!f.value) f.onChange('L')
                      }}
                      className="text-center text-sm font-mono h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Código Produto - Read-only, from codigo_produto column */}
          <div className="shrink-0 lg:w-[110px]">
            <FormItem>
              <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                Código Produto
              </FormLabel>
              <Input
                readOnly
                value={
                  productInfo?.codigo_produto != null
                    ? String(productInfo.codigo_produto)
                    : ''
                }
                placeholder="-"
                className="bg-muted/40 font-mono text-sm font-bold text-primary h-9 cursor-default"
              />
            </FormItem>
          </div>

          {/* Código de Referência - Read-only, from sku column */}
          <div className="shrink-0 lg:w-[130px]">
            <FormItem>
              <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                Código de Referência
              </FormLabel>
              <Input
                readOnly
                value={productInfo?.sku || ''}
                placeholder="-"
                className="bg-muted/40 font-mono text-xs text-gray-600 h-9 cursor-default truncate"
              />
            </FormItem>
          </div>

          {/* Descrição - Flexible (flex: 1) */}
          <div className="flex-1 min-w-0">
            {hasProduct ? (
              <FormField
                control={control}
                name={`itens.${index}.produto_id`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                      Produto
                    </FormLabel>
                    <FormControl>
                      <ProductSelectButton
                        value={f.value}
                        onClick={() => onSearchProduct(index)}
                        placeholder="Buscar produto..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={control}
                name={`itens.${index}.descricao`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                      Descrição do Produto
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Descrição do item não cadastrado..."
                          {...f}
                          value={f.value || ''}
                          className="flex-1 h-9"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onSearchProduct(index)}
                        title="Buscar produto cadastrado"
                        className="shrink-0 h-9 w-9"
                      >
                        <PackageSearch className="w-4 h-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Quantidade - Fixed 80px, max 4 digits */}
          <div className="shrink-0 lg:w-[80px]">
            <FormField
              control={control}
              name={`itens.${index}.quantidade`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                    Qtd
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="9999"
                      {...f}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.length > 4) return
                        f.onChange(
                          val ? Math.min(9999, Math.floor(Number(val))) : '',
                        )
                      }}
                      className="text-sm h-9 text-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Preço Unitário - Fixed 120px */}
          <div className="shrink-0 lg:w-[120px]">
            <FormField
              control={control}
              name={`itens.${index}.preco_unitario`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                    Preço Unit.
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...f}
                      className="text-sm h-9 text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Desconto */}
          <div className="shrink-0 lg:w-20">
            <FormField
              control={control}
              name={`itens.${index}.desconto`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-gray-500 font-medium uppercase">
                    Desc %
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      {...f}
                      onChange={(e) =>
                        f.onChange(Math.round(Number(e.target.value) || 0))
                      }
                      className="text-sm h-9 text-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Subtotal - Read-only display */}
          <div className="shrink-0 lg:w-28 flex flex-col gap-0.5 justify-end pb-1">
            <span className="text-[9px] uppercase font-bold text-gray-400">
              Subtotal
            </span>
            <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-1.5 rounded-md text-right">
              {BRL.format(itemSubtotal)}
            </span>
          </div>

          {/* Remove button */}
          <div className="shrink-0 flex items-end pb-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
