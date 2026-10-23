/**
 * SPEC-219 fase 2 / SPEC-223 (cópia do Showroom): escolher fotos (câmera ou galeria) antes de enviar e mostrar as já registradas.
 */
import { useEffect, useMemo, useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FotoEmprestimo } from '@/services/emprestimosService'

const MAX_FOTOS = 20

interface SeletorProps {
  arquivos: File[]
  onChange: (arquivos: File[]) => void
  rotulo: string
  disabled?: boolean
}

/** Fotos ainda não enviadas, com miniatura e botão de tirar. */
export function SeletorFotos({ arquivos, onChange, rotulo, disabled }: SeletorProps) {
  const input = useRef<HTMLInputElement>(null)
  const urls = useMemo(() => arquivos.map((a) => URL.createObjectURL(a)), [arquivos])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onChange([...arquivos, ...Array.from(e.target.files ?? [])].slice(0, MAX_FOTOS))
          e.target.value = ''
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || arquivos.length >= MAX_FOTOS}
        onClick={() => input.current?.click()}
      >
        <Camera className="mr-1 h-4 w-4" />
        {rotulo}
      </Button>
      {arquivos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {arquivos.map((a, i) => (
            <li key={`${a.name}-${i}`} className="relative">
              <img src={urls[i]} alt={a.name} className="h-20 w-20 rounded border border-border object-cover" />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(arquivos.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow ring-1 ring-border"
                title="Tirar esta foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Fotos já registradas (link temporário); clique abre em tamanho grande numa aba nova. */
export function GaleriaFotos({ fotos, vazio }: { fotos: FotoEmprestimo[]; vazio?: string }) {
  if (fotos.length === 0) return vazio ? <p className="text-xs text-muted-foreground">{vazio}</p> : null
  return (
    <ul className="flex flex-wrap gap-2">
      {fotos.map((f) => (
        <li key={f.id}>
          {f.url ? (
            <a href={f.url} target="_blank" rel="noreferrer" title="Abrir foto">
              <img
                src={f.url}
                alt="Foto do empréstimo"
                className="h-20 w-20 rounded border border-border object-cover hover:opacity-80"
              />
            </a>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground">
              indisponível
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
