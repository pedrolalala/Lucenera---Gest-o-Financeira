import { useEffect, useState } from 'react'
import { format, isValid, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// SPEC-182 (O1): campo de data que aceita digitar (dd/mm/aaaa) e também
// escolher no calendário. A data digitada só vale quando completa e válida;
// incompleta/ inválida volta ao valor anterior ao sair do campo.
const mascara = (texto: string) => {
  const d = texto.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

const paraTexto = (d: Date | null | undefined) =>
  d && isValid(d) ? format(d, 'dd/MM/yyyy') : ''

export function DataDigitavel({
  value,
  onChange,
  desabilitarDia,
  placeholder = 'dd/mm/aaaa',
  className,
  id,
}: {
  value: Date | null | undefined
  onChange: (d: Date | undefined) => void
  // Mesma regra do `disabled` do calendário: dia recusado também na digitação.
  desabilitarDia?: (d: Date) => boolean
  placeholder?: string
  className?: string
  id?: string
}) {
  const [texto, setTexto] = useState(paraTexto(value))
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    setTexto(paraTexto(value))
  }, [value])

  const confirmar = (t: string) => {
    if (t.length !== 10) return false
    const d = parse(t, 'dd/MM/yyyy', new Date())
    if (!isValid(d) || d.getFullYear() < 1900) return false
    if (desabilitarDia?.(d)) return false
    onChange(d)
    return true
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        inputMode="numeric"
        placeholder={placeholder}
        value={texto}
        className="pr-10"
        onChange={(e) => {
          const t = mascara(e.target.value)
          setTexto(t)
          confirmar(t)
        }}
        onBlur={() => {
          if (!confirmar(texto)) setTexto(paraTexto(value))
        }}
      />
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-10 text-muted-foreground"
            title="Abrir calendário"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value || undefined}
            defaultMonth={value || undefined}
            onSelect={(d) => {
              onChange(d)
              setAberto(false)
            }}
            disabled={desabilitarDia}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
