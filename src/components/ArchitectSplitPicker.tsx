import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'

export interface ArquitetoSplit {
  arquiteto_id: string
  nome: string
  percentual: number
}

interface ArchitectSplitPickerProps {
  value: ArquitetoSplit[]
  onChange: (next: ArquitetoSplit[]) => void
  options: { id: string; nome: string }[]
  disabled?: boolean
}

/** Redistribui os percentuais igualmente entre todas as linhas (soma=100%). */
export function redistribuirPercentuais(
  lista: ArquitetoSplit[],
): ArquitetoSplit[] {
  if (lista.length === 0) return lista
  const base = Math.floor((100 / lista.length) * 100) / 100
  const resto = Math.round((100 - base * lista.length) * 100) / 100
  return lista.map((item, idx) => ({
    ...item,
    percentual:
      idx === lista.length - 1 ? Math.round((base + resto) * 100) / 100 : base,
  }))
}

/**
 * Seletor múltiplo de arquitetos com percentual de divisão de lucro.
 * Espelha o componente equivalente do CRM, mas construído sobre o
 * SearchableSelect já existente neste sistema (options fixas, sem busca
 * ao vivo no banco) em vez do Popover+Command com fetch debounced do CRM.
 */
export function ArchitectSplitPicker({
  value,
  onChange,
  options,
  disabled,
}: ArchitectSplitPickerProps) {
  const [pendingSelection, setPendingSelection] = useState('')

  const availableOptions = useMemo(
    () =>
      options
        .filter((o) => !value.some((v) => v.arquiteto_id === o.id))
        .map((o) => ({ value: o.id, label: o.nome })),
    [options, value],
  )

  const soma = value.reduce((acc, a) => acc + (Number(a.percentual) || 0), 0)
  const somaOk = value.length === 0 || Math.abs(soma - 100) < 0.01

  const handleAdd = (arquitetoId: string) => {
    const arquiteto = options.find((o) => o.id === arquitetoId)
    if (!arquiteto) return
    onChange(
      redistribuirPercentuais([
        ...value,
        { arquiteto_id: arquiteto.id, nome: arquiteto.nome, percentual: 0 },
      ]),
    )
    setPendingSelection('')
  }

  const handleRemove = (arquitetoId: string) => {
    onChange(
      redistribuirPercentuais(
        value.filter((v) => v.arquiteto_id !== arquitetoId),
      ),
    )
  }

  const handlePercentualChange = (
    arquitetoId: string,
    novoPercentual: number,
  ) => {
    onChange(
      value.map((v) =>
        v.arquiteto_id === arquitetoId
          ? { ...v, percentual: novoPercentual }
          : v,
      ),
    )
  }

  // SPEC-177: o arquiteto já vinculado vem primeiro e em destaque (card com
  // nome em negrito); o campo de busca vem depois, discreto. Antes o campo
  // vazio "Adicionar arquiteto..." aparecia em cima e o vínculo existente
  // ficava em texto pequeno embaixo — passava despercebido.
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item) => (
            <div
              key={item.arquiteto_id}
              className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5"
            >
              <span className="flex-1 truncate text-sm font-semibold text-slate-900">
                {item.nome}
              </span>
              {/* Com 1 único arquiteto o percentual é sempre 100% — não vale
                  poluir a UI com input/soma, só mostra o nome. */}
              {value.length > 1 && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.01}
                    value={item.percentual}
                    disabled={disabled}
                    onChange={(e) =>
                      handlePercentualChange(
                        item.arquiteto_id,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="h-8 w-24 text-right bg-white"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => handleRemove(item.arquiteto_id)}
                className="h-8 w-8 text-destructive"
                title="Remover arquiteto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {value.length > 1 && (
            <p
              className={cn(
                'text-xs font-medium',
                somaOk ? 'text-emerald-600' : 'text-destructive',
              )}
            >
              Soma dos percentuais: {soma.toFixed(2)}%
              {!somaOk && ' — precisa ser exatamente 100%'}
            </p>
          )}
        </div>
      )}

      <SearchableSelect
        options={availableOptions}
        value={pendingSelection}
        onChange={handleAdd}
        placeholder={
          value.length > 0
            ? 'Adicionar outro arquiteto...'
            : 'Adicionar arquiteto...'
        }
        searchPlaceholder="Buscar arquiteto..."
        emptyText="Nenhum arquiteto encontrado."
        disabled={disabled}
        className={value.length > 0 ? 'h-8 border-dashed text-xs' : undefined}
      />
    </div>
  )
}
