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
    <div key={fieldId}>
      {isNewGroup && currentCircuit && (
        <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0 animate-fade-in">
          <div className="h-px bg-primary/20 flex-1" />
          <span className="text-xs font-bold uppercase text-primary px-3 py-0.5 rounded-full bg-primary/10">
            {currentCircuit}
          </span>
          <div className="h-px bg-primary/20 flex-1" />
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border shadow-sm relative group transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
          <div className="w-full sm:w-16 shrink-0">
            <FormField
              control={control}
              name={`itens.${index}.custom_id`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-medium">
                    Circuito
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="L01"
                      maxLength={4}
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
                      className="text-center text-sm font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            {hasProduct ? (
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {productInfo?.codigo_produto != null && (
                    <span className="font-mono font-bold text-primary text-sm shrink-0">
                      Código: {productInfo.codigo_produto}
                    </span>
                  )}
                  {productInfo?.referencia && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      Ref: {productInfo.referencia}
                    </span>
                  )}
                  {productInfo?.sku &&
                    productInfo.sku !== productInfo.referencia && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        SKU: {productInfo.sku}
                      </span>
                    )}
                </div>
                <FormField
                  control={control}
                  name={`itens.${index}.produto_id`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500 font-medium">
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
              </div>
            ) : (
              <FormField
                control={control}
                name={`itens.${index}.descricao`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-500 font-medium">
                      Descrição do Produto
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Descrição do item não cadastrado..."
                          {...f}
                          value={f.value || ''}
                          className="flex-1"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onSearchProduct(index)}
                        title="Buscar produto cadastrado"
                        className="shrink-0"
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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 sm:mt-7"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:pl-[76px]">
          <div className="w-full sm:w-20 shrink-0">
            <FormField
              control={control}
              name={`itens.${index}.quantidade`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-medium">
                    Qtd
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="1000"
                      {...f}
                      onChange={(e) => {
                        const val = e.target.value
                        f.onChange(
                          val ? Math.min(1000, Math.floor(Number(val))) : '',
                        )
                      }}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="w-full sm:w-32 shrink-0">
            <FormField
              control={control}
              name={`itens.${index}.preco_unitario`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-medium">
                    Preço Unit. (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...f}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="w-full sm:w-20 shrink-0">
            <FormField
              control={control}
              name={`itens.${index}.desconto`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-medium">
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
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex-1 text-left sm:text-right pb-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Subtotal
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {BRL.format(itemSubtotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
