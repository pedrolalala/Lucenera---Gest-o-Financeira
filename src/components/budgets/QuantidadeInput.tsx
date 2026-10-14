import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatarQtd, lerQtd } from '@/lib/numeros'

interface QuantidadeInputProps {
  value: number | string | null | undefined
  onChange: (value: number | '') => void
  porMetro?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

/**
 * SPEC-199: campo de quantidade que aceita vírgula (até 3 casas — peça por metro: "4,5").
 * Guarda o texto digitado enquanto o campo está em foco (senão "4," viraria "4" no meio da
 * digitação). Peça por metro fica em âmbar com o selo "m".
 */
export function QuantidadeInput({
  value,
  onChange,
  porMetro,
  disabled,
  placeholder,
  className,
}: QuantidadeInputProps) {
  const vazio = value === '' || value === null || value === undefined
  const [texto, setTexto] = useState(vazio ? '' : formatarQtd(value))
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    if (!editando) setTexto(vazio ? '' : formatarQtd(value))
  }, [value, vazio, editando])

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        disabled={disabled}
        value={texto}
        title={porMetro ? 'Peça vendida por metro' : undefined}
        onFocus={() => setEditando(true)}
        onBlur={() => setEditando(false)}
        onChange={(e) => {
          const t = e.target.value
          // só dígitos e uma vírgula/ponto, até 4 dígitos inteiros e 3 casas
          if (!/^\d{0,4}([.,]\d{0,3})?$/.test(t)) return
          setTexto(t)
          const n = lerQtd(t)
          onChange(n === null ? '' : n)
        }}
        className={cn(
          className,
          porMetro &&
            'border-amber-400 bg-amber-50 pr-5 font-semibold text-amber-900',
        )}
      />
      {porMetro && (
        <span
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700"
          aria-hidden
        >
          m
        </span>
      )}
    </div>
  )
}
