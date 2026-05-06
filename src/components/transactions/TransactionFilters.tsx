import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TipoTransacao, FormaPagamento } from '@/lib/types'
import useTransactionStore from '@/stores/useTransactionStore'

export interface FilterState {
  search: string
  type: string
  category: string
  paymentMethod: string
  dateRange: DateRange | undefined
}

interface TransactionFiltersProps {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
}

export function TransactionFilters({
  filters,
  setFilters,
}: TransactionFiltersProps) {
  const { categories } = useTransactionStore()

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      paymentMethod: 'all',
      dateRange: undefined,
    })
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.paymentMethod !== 'all' ||
    filters.dateRange !== undefined

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Buscar descrições..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full bg-white"
          />
        </div>

        {/* Date Range */}
        <div className="w-full md:w-[260px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal bg-white',
                  !filters.dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'dd/MM/yyyy')} -{' '}
                      {format(filters.dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(filters.dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) =>
                  setFilters((prev) => ({ ...prev, dateRange: range }))
                }
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />

        {/* Type Filter */}
        <Select
          value={filters.type}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, type: val }))
          }
        >
          <SelectTrigger className="w-[140px] bg-white h-9 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value={TipoTransacao.Receita}>Receita</SelectItem>
            <SelectItem value={TipoTransacao.Despesa}>Despesa</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.category}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, category: val }))
          }
        >
          <SelectTrigger className="w-[160px] bg-white h-9 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Method Filter */}
        <Select
          value={filters.paymentMethod}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, paymentMethod: val }))
          }
        >
          <SelectTrigger className="w-[180px] bg-white h-9 text-xs">
            <SelectValue placeholder="Forma de Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Formas</SelectItem>
            {Object.values(FormaPagamento).map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-3 w-3" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  )
}
