import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { isValidUUID } from '@/lib/uuid'
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
  codigo_produto?: number | null
  source: 'produtos' | 'revenda_ubiqua'
}

const PAGE_SIZE = 50

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedLabel, setSelectedLabel] = useState<string>('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

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
      const isRevenda = value && !isValidUUID(value)
      if (isRevenda) {
        const { data } = await supabase
          .from('revenda_ubiqua')
          .select('id, referencia, descricao, valor_revenda, cod_produto')
          .eq('id', value)
          .single()
        if (data) {
          setSelectedLabel(
            `${data.cod_produto ? `[${data.cod_produto}] ` : ''}${data.descricao}${data.referencia ? ` | Ref: ${data.referencia}` : ''} [Ubiqua]`,
          )
        }
      } else {
        const { data } = await supabase
          .from('produtos')
          .select('id, nome, sku, referencia, codigo_produto')
          .eq('id', value)
          .single()
        if (data) {
          setSelectedLabel(
            `${data.codigo_produto ? `[${data.codigo_produto}] ` : ''}${data.nome}${data.sku ? ` | SKU: ${data.sku}` : ''}${data.referencia ? ` | Ref: ${data.referencia}` : ''}`,
          )
        }
      }
    }
    fetchSelected()
  }, [value, options])

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        const from = pageNum * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        let prods: ProductOption[] = []
        let revs: ProductOption[] = []

        const cleanTerm = debouncedSearchTerm.trim().replace(/,/g, '')

        let prodQuery = supabase
          .from('produtos')
          .select('id, nome, preco_venda, sku, referencia, codigo_produto')

        let revQuery = supabase
          .from('revenda_ubiqua')
          .select('id, referencia, descricao, valor_revenda, cod_produto')

        if (cleanTerm) {
          const numericTerm = parseInt(cleanTerm, 10)
          const isNumeric = !isNaN(numericTerm) && /^\d+$/.test(cleanTerm)
          if (isNumeric) {
            prodQuery = prodQuery.or(
              `nome.ilike.%${cleanTerm}%,sku.ilike.%${cleanTerm}%,referencia.ilike.%${cleanTerm}%,codigo_produto.eq.${numericTerm}`,
            )
            revQuery = revQuery.or(
              `descricao.ilike.%${cleanTerm}%,referencia.ilike.%${cleanTerm}%,cod_produto.eq.${numericTerm}`,
            )
          } else {
            prodQuery = prodQuery.or(
              `nome.ilike.%${cleanTerm}%,sku.ilike.%${cleanTerm}%,referencia.ilike.%${cleanTerm}%`,
            )
            revQuery = revQuery.or(
              `descricao.ilike.%${cleanTerm}%,referencia.ilike.%${cleanTerm}%`,
            )
          }
        }

        const [pRes, rRes] = await Promise.all([
          prodQuery.range(from, to),
          revQuery.range(from, to),
        ])

        if (pRes.data)
          prods = pRes.data.map((p) => ({
            id: p.id,
            nome: `${p.codigo_produto ? `[${p.codigo_produto}] ` : ''}${p.nome}${p.sku ? ` | SKU: ${p.sku}` : ''}${p.referencia ? ` | Ref: ${p.referencia}` : ''}`,
            preco_venda: p.preco_venda,
            sku: p.sku,
            referencia: p.referencia,
            codigo_produto: p.codigo_produto,
            source: 'produtos' as const,
          }))
        if (rRes.data)
          revs = rRes.data.map((r) => ({
            id: String(r.id),
            nome: `${r.cod_produto ? `[${r.cod_produto}] ` : ''}${r.descricao}${r.referencia ? ` | Ref: ${r.referencia}` : ''} [Ubiqua]`,
            preco_venda: r.valor_revenda,
            sku: r.referencia,
            referencia: r.referencia,
            codigo_produto: r.cod_produto,
            source: 'revenda_ubiqua' as const,
          }))

        const combined = [...prods, ...revs]
        const totalFetched = from + combined.length

        setHasMore(
          combined.length === PAGE_SIZE * 2 ||
            (pageNum === 0 && combined.length >= PAGE_SIZE),
        )

        if (append) {
          setOptions((prev) => {
            const existingIds = new Set(prev.map((o) => o.id))
            return [...prev, ...combined.filter((c) => !existingIds.has(c.id))]
          })
        } else {
          setOptions(combined)
          if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = 0
          }
        }
      } catch (err) {
        console.error(err)
        if (!append) setOptions([])
        setHasMore(false)
      } finally {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    },
    [debouncedSearchTerm],
  )

  useEffect(() => {
    if (!open) return
    setPage(0)
    setHasMore(true)
    fetchPage(0, false)
  }, [debouncedSearchTerm, open, fetchPage])

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(nextPage, true)
  }, [page, loadingMore, loading, hasMore, fetchPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

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
        <ScrollArea className="h-64" viewportRef={scrollViewportRef}>
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
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && !loadingMore && !hasMore && options.length > 0 && (
              <div className="text-center py-3 text-xs text-muted-foreground">
                Fim da lista — {options.length} produto(s)
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
