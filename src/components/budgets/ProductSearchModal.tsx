import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Loader2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MapPin,
  Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { Badge } from '@/components/ui/badge'

export interface ProductSearchItem {
  id: string
  nome: string
  sku: string | null
  referencia: string | null
  codigo_produto: number | null
  preco_venda: number | null
  valor_venda: number | null
  estoque_total: number
  estoque_disponivel: number
  marca_nome: string | null
  categoria_nome: string | null
  source: 'produtos' | 'revenda_ubiqua'
}

type SortKey =
  | 'codigo_produto'
  | 'sku'
  | 'nome'
  | 'marca_nome'
  | 'categoria_nome'
  | 'preco_venda'
  | 'estoque_total'
  | 'estoque_disponivel'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

const FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const COLS: { key: SortKey; label: string }[] = [
  { key: 'codigo_produto', label: 'Código' },
  { key: 'sku', label: 'SKU / Referência' },
  { key: 'nome', label: 'Nome' },
  { key: 'marca_nome', label: 'Marca' },
  { key: 'categoria_nome', label: 'Categoria' },
  { key: 'preco_venda', label: 'Preço' },
  { key: 'estoque_total', label: 'Estoque Total' },
  { key: 'estoque_disponivel', label: 'Disponível' },
]

function sortData(
  data: ProductSearchItem[],
  key: SortKey,
  dir: SortDir,
): ProductSearchItem[] {
  return [...data].sort((a, b) => {
    const va = a[key] ?? 0
    const vb = b[key] ?? 0
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
    return dir === 'asc' ? cmp : -cmp
  })
}

function StockPopover({ productId }: { productId: string }) {
  const [locs, setLocs] = useState<any[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        productId,
      )
    if (!isUuid) {
      setLocs([])
      return
    }
    supabase
      .from('estoque_itens')
      .select('local, quantidade, quantidade_reservada')
      .eq('produto_id', productId)
      .then(({ data }) => {
        if (!cancelled) setLocs(data || [])
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  if (!locs)
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  if (!locs.length)
    return (
      <p className="text-sm text-muted-foreground">Sem detalhes por local.</p>
    )

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Distribuição por Local
      </p>
      {locs.map((l, i) => (
        <div key={i} className="flex justify-between gap-4 text-sm">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {l.local}
          </span>
          <span>
            Total: <strong>{l.quantidade ?? 0}</strong> | Disp:{' '}
            <strong>
              {(l.quantidade ?? 0) - (l.quantidade_reservada ?? 0)}
            </strong>
          </span>
        </div>
      ))}
    </div>
  )
}

export function ProductSearchModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (p: ProductSearchItem[]) => void
}) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [brandFilter, setBrandFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [brands, setBrands] = useState<{ id: string; nome: string }[]>([])
  const [cats, setCats] = useState<{ id: string; nome: string }[]>([])
  const [products, setProducts] = useState<ProductSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('sku')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setSearch('')
      setBrandFilter('all')
      setCatFilter('all')
      setProducts([])
      setPage(0)
      setHasMore(true)
      return
    }
    supabase
      .from('marcas')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => data && setBrands(data))
    supabase
      .from('categorias_produto')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => data && setCats(data))
  }, [open])

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let prodQuery = supabase
        .from('produtos')
        .select(
          `
          id, nome, sku, referencia, codigo_produto, preco_venda, valor_venda,
          marca:marcas(nome), categoria:categorias_produto(nome)
        `,
        )
        .eq('ativo', true)

      let revQuery = supabase
        .from('revenda_ubiqua')
        .select(
          'id, referencia, descricao, valor_revenda, cod_produto, estoque, disponivel',
        )

      if (debounced) {
        const t = debounced.trim().replace(/,/g, '')
        const numericTerm = parseInt(t, 10)
        const isNumeric = !isNaN(numericTerm) && /^\d+$/.test(t)
        if (isNumeric) {
          prodQuery = prodQuery.or(
            `nome.ilike.%${t}%,sku.ilike.%${t}%,referencia.ilike.%${t}%,codigo_produto.eq.${numericTerm}`,
          )
          revQuery = revQuery.or(
            `descricao.ilike.%${t}%,referencia.ilike.%${t}%,cod_produto.eq.${numericTerm}`,
          )
        } else {
          prodQuery = prodQuery.or(
            `nome.ilike.%${t}%,sku.ilike.%${t}%,referencia.ilike.%${t}%`,
          )
          revQuery = revQuery.or(
            `descricao.ilike.%${t}%,referencia.ilike.%${t}%`,
          )
        }
      }
      if (brandFilter !== 'all')
        prodQuery = prodQuery.eq('marca_id', brandFilter)
      if (catFilter !== 'all')
        prodQuery = prodQuery.eq('categoria_id', catFilter)

      prodQuery = prodQuery.range(from, to)
      revQuery = revQuery.range(from, to)

      const [prodRes, revRes] = await Promise.all([prodQuery, revQuery])

      if (prodRes.error) console.error(prodRes.error)
      if (revRes.error) console.error(revRes.error)

      const prodMapped: ProductSearchItem[] = (prodRes.data || []).map(
        (p: any) => ({
          id: p.id,
          nome: p.nome,
          sku: p.sku,
          referencia: p.referencia,
          codigo_produto: p.codigo_produto,
          preco_venda: p.preco_venda,
          valor_venda: p.valor_venda,
          estoque_total: 0,
          estoque_disponivel: 0,
          marca_nome: p.marca?.nome || null,
          categoria_nome: p.categoria?.nome || null,
          source: 'produtos' as const,
        }),
      )

      const revMapped: ProductSearchItem[] = (revRes.data || []).map(
        (r: any) => ({
          id: String(r.id),
          nome: r.descricao || r.referencia || '-',
          sku: r.referencia,
          referencia: r.referencia,
          codigo_produto: r.cod_produto,
          preco_venda: r.valor_revenda,
          valor_venda: r.valor_revenda,
          estoque_total: r.estoque ?? 0,
          estoque_disponivel: r.disponivel ?? 0,
          marca_nome: null,
          categoria_nome: null,
          source: 'revenda_ubiqua' as const,
        }),
      )

      const mapped = [...prodMapped, ...revMapped]

      if (mapped.length === 0) {
        setHasMore(false)
        if (append) {
          setLoadingMore(false)
        } else {
          setProducts([])
          setLoading(false)
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
          }
        }
        return
      }

      if (prodMapped.length > 0) {
        const { data: stockData } = await supabase
          .from('vw_detalhe_produto_estoque')
          .select('produto_id, estoque_total, estoque_disponivel')
          .in(
            'produto_id',
            prodMapped.map((p) => p.id),
          )

        const stockMap = new Map<
          string,
          { estoque_total: number; estoque_disponivel: number }
        >(
          (stockData || []).map((s: any) => [
            s.produto_id,
            {
              estoque_total: s.estoque_total ?? 0,
              estoque_disponivel: s.estoque_disponivel ?? 0,
            },
          ]),
        )

        prodMapped.forEach((p) => {
          const stock = stockMap.get(p.id)
          if (stock) {
            p.estoque_total = stock.estoque_total
            p.estoque_disponivel = stock.estoque_disponivel
          }
        })
      }

      setHasMore(
        (prodRes.data || []).length === PAGE_SIZE ||
          (revRes.data || []).length === PAGE_SIZE,
      )

      if (append) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const filtered = mapped.filter((p) => !existingIds.has(p.id))
          return [...prev, ...filtered]
        })
        setLoadingMore(false)
      } else {
        setProducts(mapped)
        setLoading(false)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
      }
    },
    [debounced, brandFilter, catFilter],
  )

  useEffect(() => {
    if (!open) return
    setPage(0)
    setHasMore(true)
    fetchPage(0, false)
  }, [open, debounced, brandFilter, catFilter, fetchPage])

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(nextPage, true)
  }, [page, loadingMore, loading, hasMore, fetchPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        root: container,
        rootMargin: '100px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const sorted = sortData(products, sortKey, sortDir)
  const allSelected =
    sorted.length > 0 && sorted.every((p) => selected.has(p.id))

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    setSelected((s) => {
      const n = new Set(s)
      if (allSelected) {
        sorted.forEach((p) => n.delete(p.id))
      } else {
        sorted.forEach((p) => n.add(p.id))
      }
      return n
    })
  }

  const handleConfirm = () => {
    const chosen = sorted.filter((p) => selected.has(p.id))
    if (import.meta.env.DEV) {
      console.log(`Array de envio: [${chosen.map((c) => c.nome).join(', ')}]`)
      console.log(`Quantidade de itens selecionados: ${chosen.length}`)
    }
    onConfirm(chosen)
    setSelected(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Buscar Produtos</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou referência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {cats.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  {COLS.map((col) => (
                    <TableHead key={col.key}>
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {col.label}
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLS.length + 1}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((p) => (
                    <TableRow
                      key={p.id}
                      data-state={selected.has(p.id) ? 'selected' : undefined}
                      className={cn(
                        selected.has(p.id) &&
                          'bg-primary/10 border-l-4 border-l-primary',
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-sm text-primary">
                          {p.codigo_produto ?? '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-base text-gray-900">
                          {p.sku || p.referencia || '-'}
                        </div>
                        {p.referencia && p.sku && p.referencia !== p.sku && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {p.referencia}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div className="line-clamp-2 max-w-[200px] text-sm text-gray-600">
                            {p.nome}
                          </div>
                          {selected.has(p.id) && (
                            <Badge
                              variant="default"
                              className="shrink-0 text-[10px] px-1.5 py-0"
                            >
                              Selecionado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {p.marca_nome || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {p.categoria_nome || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {FMT.format(p.preco_venda || p.valor_venda || 0)}
                      </TableCell>
                      <TableCell>
                        <HoverCard openDelay={300} closeDelay={200}>
                          <HoverCardTrigger asChild>
                            <span className="cursor-help font-semibold underline decoration-dotted">
                              {p.estoque_total}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <StockPopover productId={p.id} />
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        <HoverCard openDelay={300} closeDelay={200}>
                          <HoverCardTrigger asChild>
                            <span
                              className={cn(
                                'cursor-help font-semibold underline decoration-dotted',
                                p.estoque_disponivel <= 0 && 'text-red-600',
                              )}
                            >
                              {p.estoque_disponivel}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <StockPopover productId={p.id} />
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && !loadingMore && !hasMore && sorted.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Fim da lista — {sorted.length} produto(s) carregado(s)
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selected.size} produto(s) selecionado(s)
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
