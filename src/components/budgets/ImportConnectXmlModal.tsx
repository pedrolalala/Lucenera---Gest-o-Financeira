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
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  parseConnectXml,
  resolveConnectXmlImport,
  findOrcamentoJaImportado,
  STATUS_PERMITE_REIMPORTAR_XML,
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
  onApply: (
    resolved: ResolvedXmlBudget,
    opts?: { substituirItens?: boolean },
  ) => void
  /** Chamado quando o cliente do XML não foi encontrado — SPEC-203: quem chama aplica o import sem cliente e deixa escolher/cadastrar depois. */
  onClienteNaoEncontrado: (resolved: ResolvedXmlBudget) => void
  /** SPEC-201 C: id do orçamento aberto no formulário (edição), se houver. */
  orcamentoAtualId?: string | null
  /** SPEC-201 C: o XML é de outro orçamento já importado — abrir ele e atualizar. */
  onAtualizarExistente?: (orcamentoId: string, resolved: ResolvedXmlBudget) => void
  /** Pré-cadastro: o cliente do XML não existia e foi criado aqui (quem chama põe na lista local do formulário). */
  onClienteCriado?: (cliente: any) => void
}

export function ImportConnectXmlModal({
  open,
  onOpenChange,
  empresas,
  clientes,
  produtos,
  onApply,
  onClienteNaoEncontrado,
  orcamentoAtualId,
  onAtualizarExistente,
  onClienteCriado,
}: ImportConnectXmlModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolved, setResolved] = useState<ResolvedXmlBudget | null>(null)
  const [orcamentoExistente, setOrcamentoExistente] = useState<{
    id: string
    numero: string | null
    status: string
  } | null>(null)
  // Pré-cadastro: o XML da Connect só traz o CÓDIGO do cliente (sem nome). Se ele não existe aqui, a pessoa informa a razão social e o cliente
  // nasce como pré-cadastro (código da Connect + razão social + aviso para completar), para nenhum cliente se perder.
  const [razaoSocial, setRazaoSocial] = useState('')
  const [criandoPreCadastro, setCriandoPreCadastro] = useState(false)

  const reset = useCallback(() => {
    setRazaoSocial('')
    setCriandoPreCadastro(false)
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

  const podeAtualizar =
    !!orcamentoExistente &&
    STATUS_PERMITE_REIMPORTAR_XML.includes(orcamentoExistente.status) &&
    (orcamentoExistente.id === orcamentoAtualId || !!onAtualizarExistente)

  const criarPreCadastroEImportar = async () => {
    if (!resolved) return
    const nome = razaoSocial.trim()
    const codCliente = resolved.raw.cod_cliente
    if (nome.length < 3) {
      toast.error('Informe a razão social do cliente', {
        description:
          'O XML da Connect só traz o código do cliente. A razão social cria o pré-cadastro para o cliente não se perder; o resto (CPF/CNPJ, contato, endereço) se completa depois.',
      })
      return
    }
    setCriandoPreCadastro(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      // se já existe cliente com esse código da Connect (outro usuário acabou de criar), reaproveita
      let cliente: any = null
      if (codCliente != null) {
        const { data: ja } = await supabase
          .from('contatos')
          .select('*')
          .eq('codigo_legado', codCliente)
          .eq('tipo', 'cliente')
          .maybeSingle()
        cliente = ja
      }
      if (!cliente) {
        const { data, error } = await supabase
          .from('contatos')
          .insert({
            tipo: 'cliente',
            nome,
            razao_social: nome,
            codigo_legado: codCliente,
            created_by: auth?.user?.id ?? null,
            observacoes: `PRÉ-CADASTRO criado ao importar o XML da Connect (orçamento nº ${resolved.raw.cod_orcamento ?? '-'}, cliente Connect nº ${codCliente ?? '-'}). Completar CPF/CNPJ, telefone, e-mail e endereço.`,
          } as any)
          .select('*')
          .single()
        if (error) throw error
        cliente = data
        toast.success('Pré-cadastro do cliente criado', {
          description: `${nome} (código Connect ${codCliente ?? '-'}). Complete os dados dele no cadastro de clientes.`,
        })
      }
      onClienteCriado?.(cliente)
      onApply({ ...resolved, cliente_id: cliente.id, cliente_nome: cliente.nome ?? nome })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error('Não foi possível criar o pré-cadastro', { description: e?.message })
    } finally {
      setCriandoPreCadastro(false)
    }
  }

  const handleApply = useCallback(() => {
    if (!resolved) return

    if (orcamentoExistente) {
      if (!podeAtualizar) {
        toast.error('Este orçamento Connect já foi importado', {
          description: `Já existe como ${orcamentoExistente.numero || orcamentoExistente.id}, que está em "${orcamentoExistente.status}". Só dá para atualizar pelo XML até a Aprovação da Equipe.`,
        })
        return
      }
      if (orcamentoExistente.id === orcamentoAtualId) {
        onApply(resolved, { substituirItens: true })
      } else {
        onAtualizarExistente?.(orcamentoExistente.id, resolved)
      }
      reset()
      onOpenChange(false)
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
      // cliente não cadastrado: com razão social informada cria o pré-cadastro e segue; sem ela, a pessoa escolhe "Importar e escolher o cliente"
      void criarPreCadastroEImportar()
      return
    }

    onApply(resolved)
    reset()
    onOpenChange(false)
  }, [
    resolved,
    orcamentoExistente,
    podeAtualizar,
    orcamentoAtualId,
    onAtualizarExistente,
    onApply,
    onClienteNaoEncontrado,
    reset,
    onOpenChange,
    razaoSocial,
  ])

  const canApply =
    !isLoading && !error && !!resolved && (!orcamentoExistente || podeAtualizar)

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
                  Não cadastrado (código Connect {resolved.raw.cod_cliente ?? '-'})
                </span>
              )}
            </div>
            {!resolved.cliente_id && !orcamentoExistente && (
              <div className="mt-2 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="text-sm">
                  O XML só traz o <b>código</b> do cliente. Informe a <b>razão social</b> para criar o{' '}
                  <b>pré-cadastro</b> agora e não perder o cliente; os demais dados se completam depois no cadastro.
                </p>
                <Input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão social / nome do cliente"
                  disabled={criandoPreCadastro}
                />
                <button
                  type="button"
                  className="text-xs underline text-amber-800"
                  disabled={criandoPreCadastro}
                  onClick={() => {
                    if (!resolved) return
                    onClienteNaoEncontrado(resolved)
                    reset()
                    onOpenChange(false)
                  }}
                >
                  Já está cadastrado? Importar e escolher o cliente depois
                </button>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Itens</span>
              <span className="font-medium">
                {resolved.itensCasados} casado(s) · {resolved.itensAvulsos}{' '}
                avulso(s)
              </span>
            </div>

            {orcamentoExistente && podeAtualizar && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Este orçamento Connect já existe como{' '}
                  {orcamentoExistente.numero || orcamentoExistente.id}. Ao
                  aplicar, os itens dele serão trocados pelos deste XML — revise
                  e salve para gravar.
                </span>
              </div>
            )}

            {orcamentoExistente && !podeAtualizar && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Este orçamento Connect já foi importado como{' '}
                  {orcamentoExistente.numero || orcamentoExistente.id}, que está
                  em "{orcamentoExistente.status}". Só dá para atualizar pelo
                  XML até a Aprovação da Equipe.
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
            {orcamentoExistente && podeAtualizar
              ? `Atualizar ${orcamentoExistente.numero || 'orçamento'}`
              : 'Aplicar ao formulário'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
