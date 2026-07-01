import { useState, useEffect } from 'react'
import { ChevronsUpDown, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function ProductSelectButton({
  value,
  onClick,
  placeholder = 'Buscar produto...',
}: {
  value: string
  onClick: () => void
  placeholder?: string
}) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!value) {
      setLabel('')
      return
    }

    let cancelled = false

    async function fetchLabel() {
      const isRevenda = !value.includes('-')

      if (isRevenda) {
        const { data } = await supabase
          .from('revenda_ubiqua')
          .select('referencia, descricao')
          .eq('id', value)
          .single()

        if (!cancelled && data) {
          setLabel(
            `${data.descricao}${data.referencia ? ` | Ref: ${data.referencia}` : ''} [Ubiqua]`,
          )
        }
      } else {
        const { data } = await supabase
          .from('produtos')
          .select('nome, sku, referencia')
          .eq('id', value)
          .single()

        if (!cancelled && data) {
          setLabel(
            `${data.nome}${data.sku ? ` | SKU: ${data.sku}` : ''}${data.referencia ? ` | Ref: ${data.referencia}` : ''}`,
          )
        }
      }
    }

    fetchLabel()

    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      className="w-full justify-between font-normal text-left"
      onClick={onClick}
    >
      {label ? (
        <span className="truncate">{label}</span>
      ) : (
        <span className="text-muted-foreground flex items-center gap-2">
          <Package className="w-4 h-4 shrink-0" />
          {placeholder}
        </span>
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )
}
