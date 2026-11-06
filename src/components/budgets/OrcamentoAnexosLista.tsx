import { useEffect, useState } from 'react'
import { FileText, Loader2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import {
  listarAnexos,
  urlAssinadaAnexo,
  type OrcamentoAnexo,
} from '@/services/orcamentoAnexosService'

interface Props {
  orcamentoId: string | undefined
  /** Texto quando não há anexo (a revisão financeira avisa que não veio comprovante). */
  vazioTexto?: string
}

// SPEC-254 B: lista os arquivos anexados na aprovação da equipe (comprovante) e abre por URL assinada (bucket privado).
export function OrcamentoAnexosLista({ orcamentoId, vazioTexto }: Props) {
  const [anexos, setAnexos] = useState<OrcamentoAnexo[] | null>(null)
  const [abrindo, setAbrindo] = useState<string | null>(null)

  useEffect(() => {
    if (!orcamentoId) {
      setAnexos([])
      return
    }
    let ativo = true
    setAnexos(null)
    listarAnexos(orcamentoId)
      .then((a) => ativo && setAnexos(a))
      .catch(() => ativo && setAnexos([]))
    return () => {
      ativo = false
    }
  }, [orcamentoId])

  const abrir = async (a: OrcamentoAnexo) => {
    setAbrindo(a.id)
    try {
      const url = await urlAssinadaAnexo(a.caminho)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      toast.error('Erro ao abrir o anexo', { description: err?.message })
    } finally {
      setAbrindo(null)
    }
  }

  if (anexos === null) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Carregando anexos...
      </div>
    )
  }
  if (anexos.length === 0) {
    return vazioTexto ? <p className="text-xs text-gray-500">{vazioTexto}</p> : null
  }
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-sky-900">
        <Paperclip className="h-4 w-4" />
        Anexos do orçamento ({anexos.length})
      </p>
      <ul className="space-y-1">
        {anexos.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => abrir(a)}
              disabled={abrindo === a.id}
              className="flex items-center gap-1.5 text-left text-sm text-sky-800 underline decoration-dotted underline-offset-2 hover:text-sky-950"
            >
              {abrindo === a.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {a.nomeArquivo}
              <span className="text-xs text-sky-700/70 no-underline">
                · {new Date(a.criadoEm).toLocaleDateString('pt-BR')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
