import { useCallback, useState } from 'react'
import {
  FileCode,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  parseConnectXml,
  resolveConnectXmlImport,
  findOrcamentoJaImportado,
  validateXmlFile,
  type ResolvedXmlBudget,
} from '@/lib/xml-budget-import'

export interface ImportConnectXmlModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresas: any[]
  clientes: any[]
  produtos: any[]
  /** Chamado quando o resumo está pronto para ser aplicado ao formulário (empresa e cliente resolvidos, sem conflito de idempotência). */
  onApply: (resolved: ResolvedXmlBudget) => void
  /** Chamado quando o cliente do XML não foi encontrado — quem chama deve abrir o ClientCreateModal e retomar o import depois. */
  onClienteNaoEncontrado: (resolved: ResolvedXmlBudget) => void
}

export function ImportConnectXmlModal({
  open,
  onOpenChange,
  empresas,
  clientes,
  produtos,
  onApply,
  onClienteNaoEncontrado,
}: ImportConnectXmlModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolved, setResolved] = useState<ResolvedXmlBudget | null>(null)
  const [orcamentoExistente, setOrcamentoExistente] = useState<{
    id: string
    numero: string | null
  } | null>(null)

  const reset = useCallback(() => {
    setFileName(null)
    setIsLoading(false)
    setError(null)
    setResolved(null)
    setOrcamentoExistente(null)
  }, [])

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return

      reset()
      setFileName(file.name)
      setIsLoading(true)

      try {
        const vErr = validateXmlFile(file)
        if (vErr) throw new Error(vErr)

        const text = await file.text()
        const parsed = parseConnectXml(text)
        const result = resolveConnectXmlImport(parsed, {
          empresas,
          clientes,
          produtos,
        })
        setResolved(result)

        if (parsed.cod_orcamento != null) {
          const existente = await findOrcamentoJaImportado(parsed.cod_orcamento)
          setOrcamentoExistente(existente)
        }
      } catch (e: any) {
        setError(e.message || 'Erro ao processar o XML.')
      } finally {
        setIsLoading(false)
      }
    },
    [empresas, clientes, produtos, reset],
  )

  const handleApply = useCallback(() => {
    if (!resolved) return

    if (orcamentoExistente) {
      toast.error('Este orçamento Connect já foi importado', {
        description: `Já existe como ${orcamentoExistente.numero || orcamentoExistente.id}.`,
      })
      return
    }

    if (!resolved.empresa_id) {
      toast.error('Empresa não encontrada', {
        description:
          'Nenhuma empresa cadastrada bate com o cnpj_empresa/cod_empresa do XML. Cadastre a empresa antes de importar.',
      })
      return
    }

    if (!resolved.cliente_id) {
      onClienteNaoEncontrado(resolved)
      reset()
      onOpenChange(false)
      return
    }

    onApply(resolved)
    reset()
    onOpenChange(false)
  }, [
    resolved,
    orcamentoExistente,
    onApply,
    onClienteNaoEncontrado,
    reset,
    onOpenChange,
  ])

  const canApply = !isLoading && !error && !!resolved && !orcamentoExistente

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isLoading) {
          if (!v) reset()
          onOpenChange(v)
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar XML (Connect)</DialogTitle>
          <DialogDescription>
            Selecione o arquivo XML exportado pelo sistema Connect para
            preencher automaticamente cliente, empresa e itens do orçamento.
          </DialogDescription>
        </DialogHeader>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => document.getElementById('connect-xml-input')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFileSelect(e.dataTransfer.files)
          }}
        >
          <FileCode className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Clique ou arraste o arquivo .xml aqui
          </p>
          <p className="text-xs text-gray-400 mt-1">Apenas 1 arquivo por vez</p>
          <input
            id="connect-xml-input"
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
            <FileCode className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="shrink-0">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : error ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        )}

        {resolved && !isLoading && (
          <div className="space-y-2 rounded-lg border bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nº orçamento Connect</span>
              <span className="font-medium">
                {resolved.raw.cod_orcamento ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Empresa</span>
              {resolved.empresa_id ? (
                <span className="font-medium text-green-700">
                  {resolved.empresa_nome}
                </span>
              ) : (
                <span className="font-medium text-red-600">Não encontrada</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente</span>
              {resolved.cliente_id ? (
                <span className="font-medium text-green-700">
                  {resolved.cliente_nome}
                </span>
              ) : (
                <span className="font-medium text-amber-600">
                  Não encontrado (será solicitado cadastro)
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Itens</span>
              <span className="font-medium">
                {resolved.itensCasados} casado(s) · {resolved.itensAvulsos}{' '}
                avulso(s)
              </span>
            </div>

            {orcamentoExistente && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Este orçamento Connect já foi importado como{' '}
                  {orcamentoExistente.numero || orcamentoExistente.id}.
                  Reimportação bloqueada.
                </span>
              </div>
            )}

            {!orcamentoExistente && !resolved.empresa_id && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Cadastre a empresa correspondente antes de importar — este
                  campo é obrigatório no orçamento.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply} disabled={!canApply}>
            Aplicar ao formulário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
