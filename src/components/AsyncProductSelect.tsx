import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ProductOption {
  id: string
  nome: string
  preco_venda: number
  sku?: string
  referencia?: string
  source: 'produtos' | 'revenda_ubiqua'
}

export function AsyncProductSelect({
  value,
  onChange,
  onProductSelect,
  placeholder = 'Buscar produto...',
}: {
  value: string
  onChange: (value: string) => void
  onProductSelect?: (product: ProductOption) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [options, setOptions] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>('')

  useEffect(() => {
    if (!value) {
      setSelectedLabel('')
      return
    }
    const existing = options.find((o) => o.id === value)
    if (existing) {
      setSelectedLabel(existing.nome)
      return
    }
    async function fetchSelected() {
      const isRevenda = value && !value.includes('-')
      if (isRevenda) {
        const { data } = await supabase
          .from('revenda_ubiqua')
          .select('id, referencia, descricao, valor_revenda')
          .eq('id', value)
          .single()
        if (data) {
          setSelectedLabel(
            `${data.descricao}${data.referencia ? ` | Ref: ${data.referencia}` : ''} [Ubiqua]`,
          )
        }
      } else {
        const { data } = await supabase
          .from('produtos')
          .select('id, nome, sku, referencia')
          .eq('id', value)
          .single()
        if (data) {
          setSelectedLabel(
            `${data.nome}${data.sku ? ` | SKU: ${data.sku}` : ''}${data.referencia ? ` | Ref: ${data.referencia}` : ''}`,
          )
        }
      }
    }
    fetchSelected()
  }, [value, options])

  useEffect(() => {
    if (!open) return

    async function search() {
      setLoading(true)
      try {
        let prods: ProductOption[] = []
        let revs: ProductOption[] = []

        if (!debouncedSearchTerm) {
          const [pRes, rRes] = await Promise.all([
            supabase
              .from('produtos')
              .select('id, nome, preco_venda, sku, referencia')
              .limit(50),
            supabase
              .from('revenda_ubiqua')
              .select('id, referencia, descricao, valor_revenda')
              .limit(50),
          ])

          if (pRes.data)
            prods = pRes.data.map((p) => ({
              id: p.id,
              nome: `${p.nome}${p.sku ? ` | SKU: ${p.sku}` : ''}${p.referencia ? ` | Ref: ${p.referencia}` : ''}`,
              preco_venda: p.preco_venda,
              sku: p.sku,
              referencia: p.referencia,
              source: 'produtos',
            }))
          if (rRes.data)
            revs = rRes.data.map((r) => ({
              id: String(r.id),
              nome: `${r.descricao}${r.referencia ? ` | Ref: ${r.referencia}` : ''} [Ubiqua]`,
              preco_venda: r.valor_revenda,
              sku: r.referencia,
              referencia: r.referencia,
              source: 'revenda_ubiqua',
            }))
        } else {
          const cleanTerm = debouncedSearchTerm.trim()
          const [pRes, rRes] = await Promise.all([
            supabase
              .from('produtos')
              .select('id, nome, preco_venda, sku, referencia')
              .or(
                `nome.ilike.%${cleanTerm}%,sku.ilike.%${cleanTerm}%,referencia.ilike.%${cleanTerm}%`,
              ),
            supabase
              .from('revenda_ubiqua')
              .select('id, referencia, descricao, valor_revenda')
              .or(
                `descricao.ilike.%${cleanTerm}%,referencia.ilike.%${cleanTerm}%`,
              ),
          ])

          if (pRes.data)
            prods = pRes.data.map((p) => ({
              id: p.id,
              nome: `${p.nome}${p.sku ? ` | SKU: ${p.sku}` : ''}${p.referencia ? ` | Ref: ${p.referencia}` : ''}`,
              preco_venda: p.preco_venda,
              sku: p.sku,
              referencia: p.referencia,
              source: 'produtos',
            }))
          if (rRes.data)
            revs = rRes.data.map((r) => ({
              id: String(r.id),
              nome: `${r.descricao}${r.referencia ? ` | Ref: ${r.referencia}` : ''} [Ubiqua]`,
              preco_venda: r.valor_revenda,
              sku: r.referencia,
              referencia: r.referencia,
              source: 'revenda_ubiqua',
            }))
        }

        setOptions([...prods, ...revs])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedSearchTerm, open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left"
        >
          {selectedLabel ? (
            <span className="truncate">{selectedLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Buscar por nome, sku, ref (ex: STL21836/30)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
          )}
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {options.length === 0 && !loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado.
              </div>
            )}
            {options.map((option) => (
              <div
                key={option.id}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  value === option.id && 'bg-accent text-accent-foreground',
                )}
                onClick={() => {
                  onChange(option.id)
                  setSelectedLabel(option.nome)
                  setOpen(false)
                  if (onProductSelect) onProductSelect(option)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4 shrink-0',
                    value === option.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate">{option.nome}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
