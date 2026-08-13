import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { formatCircuitIdInput } from '@/lib/utils'

export interface LEntry {
  custom_id: string
  quantidade: number
}

interface LQuantityRepeaterProps {
  value: LEntry[]
  onChange: (next: LEntry[]) => void
  disabled?: boolean
}

/**
 * SPEC-079: lista repetível de {L, quantidade} — usada dentro do
 * MultiLAddDialog pra permitir que uma mesma peça tenha vários L's, cada
 * um com sua própria quantidade, sem exigir buscar/adicionar o produto
 * várias vezes.
 */
export function LQuantityRepeater({
  value,
  onChange,
  disabled,
}: LQuantityRepeaterProps) {
  const total = value.reduce((acc, e) => acc + (Number(e.quantidade) || 0), 0)

  // Bug real achado em teste ao vivo (2026-08-13): o input mostrava "L01"
  // como placeholder (cinza), parecendo pre-preenchido, mas custom_id
  // começava vazio de verdade — o botão "Confirmar Seleção" ficava
  // desabilitado sem nenhum aviso (validationErrors bloqueia o onClick
  // antes mesmo dele disparar o toast de erro), travando silenciosamente
  // todo fluxo de adicionar item. Fix: gera um código real (L01, L02...)
  // que bate com o que o placeholder já prometia visualmente.
  const handleAdd = () => {
    const nextNum = String(value.length + 1).padStart(2, '0')
    onChange([...value, { custom_id: `L${nextNum}`, quantidade: 1 }])
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, patch: Partial<LEntry>) => {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  return (
    <div className="space-y-2">
      {value.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder="L01"
            value={entry.custom_id}
            disabled={disabled}
            onChange={(e) =>
              handleChange(index, {
                custom_id: formatCircuitIdInput(e.target.value),
              })
            }
            className="w-24"
          />
          <Input
            type="number"
            min={1}
            step={1}
            placeholder="Qtd"
            value={entry.quantidade || ''}
            disabled={disabled}
            onChange={(e) =>
              handleChange(index, {
                quantidade: parseInt(e.target.value, 10) || 0,
              })
            }
            className="w-24"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => handleRemove(index)}
            className="h-9 w-9 text-destructive shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handleAdd}
      >
        <Plus className="w-4 h-4 mr-2" /> Adicionar L
      </Button>

      <p className="text-sm font-medium text-muted-foreground pt-1">
        Quantidade total: {total}
      </p>
    </div>
  )
}
