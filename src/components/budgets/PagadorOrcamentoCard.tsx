// SPEC-326: bloco "Pagador" do orçamento. A equipe escolhe outra empresa/pessoa para pagar (o cliente e o projeto
// do orçamento não mudam); o financeiro é avisado na Revisão Financeira e precisa confirmar antes de faturar.
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, CheckCircle2, Loader2, Search, UserRoundCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BuscaPessoaDialog, type PessoaEscolhida } from '@/components/budgets/BuscaPessoaDialog'
import {
  carregarPagador,
  confirmarPagador,
  definirPagador,
  type PagadorOrcamento,
} from '@/services/pagadorOrcamentoService'

interface Props {
  /** nulo = orçamento ainda não salvo (o pagador depende do id gravado no banco) */
  orcamentoId: string | null
  /** quem faz a revisão financeira (admin, gerente ou acesso `financeiro`) pode confirmar */
  podeConfirmar: boolean
  /** avisa o formulário/lista para atualizar os campos pagador_* do orçamento em memória */
  onChanged?: (campos: {
    pagador_id: string | null
    pagador_motivo: string | null
    pagador_confirmado_em: string | null
  }) => void
}

const MOTIVO_MIN = 5

export function PagadorOrcamentoCard({ orcamentoId, podeConfirmar, onChanged }: Props) {
  const [info, setInfo] = useState<PagadorOrcamento | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [dialogAberto, setDialogAberto] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [escolhido, setEscolhido] = useState<PessoaEscolhida | null>(null)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const recarregar = useCallback(async () => {
    if (!orcamentoId) {
      setInfo(null)
      setCarregando(false)
      return null
    }
    try {
      setErro('')
      const novo = await carregarPagador(orcamentoId)
      setInfo(novo)
      return novo
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar o pagador.')
      return null
    } finally {
      setCarregando(false)
    }
  }, [orcamentoId])

  useEffect(() => {
    setCarregando(true)
    void recarregar()
  }, [recarregar])

  const avisarMudanca = (novo: PagadorOrcamento | null) =>
    onChanged?.({
      pagador_id: novo?.pagadorId ?? null,
      pagador_motivo: novo?.motivo ?? null,
      pagador_confirmado_em: novo?.confirmadoEm ?? null,
    })

  const cabecalho = (
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <UserRoundCheck className="h-4 w-4" /> Pagador (Contas a Receber)
      </CardTitle>
    </CardHeader>
  )
  // o bloco sempre aparece; quando não dá para usar, explica por quê
  if (!orcamentoId) {
    return (
      <Card className="mt-4">
        {cabecalho}
        <CardContent className="text-sm text-muted-foreground">
          Para indicar outra empresa ou pessoa como pagadora, <strong>salve o orçamento primeiro</strong>; depois este
          bloco passa a permitir escolher o pagador.
        </CardContent>
      </Card>
    )
  }

  if (carregando) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando pagador...
        </CardContent>
      </Card>
    )
  }
  if (!info) {
    return (
      <Card className="mt-4">
        {cabecalho}
        <CardContent className="text-sm text-destructive">
          {erro || 'Não foi possível carregar o pagador deste orçamento.'}
        </CardContent>
      </Card>
    )
  }
  // só venda tem cobrança ao cliente; devolução, outros e SAC não usam pagador
  if (info.natureza !== 'venda') {
    return (
      <Card className="mt-4">
        {cabecalho}
        <CardContent className="text-sm text-muted-foreground">
          O pagador só vale para orçamento de <strong>venda</strong> (devolução, outros e SAC não geram cobrança ao cliente).
        </CardContent>
      </Card>
    )
  }

  const aprovado = info.status === 'Orçamento Aprovado'
  const temPagador = !!info.pagadorId
  const confirmado = temPagador && !!info.confirmadoEm
  const naRevisao = info.status === 'Aprovação Financeira'

  const abrirDialogo = () => {
    setEscolhido(info.pagadorId ? { valor: info.pagadorId, nome: info.pagadorNome || '' } : null)
    setMotivo(info.motivo || '')
    setDialogAberto(true)
  }

  const salvar = async () => {
    if (!escolhido) return toast.error('Escolha quem vai pagar.')
    if (motivo.trim().length < MOTIVO_MIN)
      return toast.error(`Escreva o motivo (mínimo ${MOTIVO_MIN} caracteres).`)
    setSalvando(true)
    try {
      await definirPagador(orcamentoId, escolhido.valor, motivo.trim())
      const novo = await recarregar()
      avisarMudanca(novo)
      setDialogAberto(false)
      toast.success(
        novo?.confirmadoEm
          ? 'Pagador definido e confirmado.'
          : 'Pagador definido. O financeiro será avisado na Revisão Financeira e precisa confirmar antes de faturar.',
      )
    } catch (e: any) {
      toast.error('Não foi possível definir o pagador', { description: e?.message })
    } finally {
      setSalvando(false)
    }
  }

  const remover = async () => {
    setSalvando(true)
    try {
      await definirPagador(orcamentoId, null, null)
      const novo = await recarregar()
      avisarMudanca(novo)
      toast.success('Pagador removido: o faturamento volta para o cliente do orçamento.')
    } catch (e: any) {
      toast.error('Não foi possível remover o pagador', { description: e?.message })
    } finally {
      setSalvando(false)
    }
  }

  const confirmar = async () => {
    setSalvando(true)
    try {
      await confirmarPagador(orcamentoId)
      const novo = await recarregar()
      avisarMudanca(novo)
      toast.success('Pagador confirmado. O orçamento já pode ser aprovado financeiramente.')
    } catch (e: any) {
      toast.error('Não foi possível confirmar o pagador', { description: e?.message })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRoundCheck className="h-4 w-4" /> Pagador (Contas a Receber)
        </CardTitle>
        <CardDescription>
          O cliente e o projeto deste orçamento não mudam. Se outra empresa ou pessoa vai pagar, informe aqui para o
          financeiro faturar no nome dela.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {erro && <p className="text-destructive">{erro}</p>}

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Cliente do orçamento / projeto</div>
            <div className="font-medium">{info.clienteNome}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quem paga (faturado em nome de)</div>
            <div className="font-medium">
              {temPagador ? info.pagadorNome || '—' : `${info.clienteNome} (o próprio cliente)`}
            </div>
          </div>
        </div>

        {temPagador && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              {confirmado ? (
                <Badge className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  <CheckCircle2 className="h-3 w-3" /> Confirmado pelo financeiro
                </Badge>
              ) : (
                <Badge className="gap-1 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-50">
                  <AlertTriangle className="h-3 w-3" /> Aguardando confirmação do financeiro
                </Badge>
              )}
              {info.definidoPorNome && (
                <span className="text-xs text-muted-foreground">
                  definido por {info.definidoPorNome}
                  {info.definidoEm ? ` em ${format(new Date(info.definidoEm), 'dd/MM/yyyy HH:mm')}` : ''}
                </span>
              )}
            </div>
            {info.motivo && (
              <p>
                <span className="text-muted-foreground">Motivo: </span>
                {info.motivo}
              </p>
            )}
            {!confirmado && !naRevisao && (
              <p className="text-xs text-amber-800">
                O financeiro vê o aviso quando o orçamento chegar na Revisão Financeira e só aprova depois de confirmar.
              </p>
            )}
          </div>
        )}

        {aprovado ? (
          <p className="text-xs text-muted-foreground">
            Orçamento já aprovado financeiramente: para trocar o pagador é preciso cancelar o financeiro antes.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={temPagador ? 'outline' : 'default'} onClick={abrirDialogo} disabled={salvando}>
              {temPagador ? 'Trocar pagador' : 'Faturar em nome de outro pagador'}
            </Button>
            {temPagador && (
              <Button type="button" size="sm" variant="outline" onClick={remover} disabled={salvando}>
                Remover pagador
              </Button>
            )}
            {temPagador && !confirmado && podeConfirmar && naRevisao && (
              <Button type="button" size="sm" onClick={confirmar} disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700">
                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar pagador
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogAberto} onOpenChange={(o) => !salvando && setDialogAberto(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Faturar em nome de outro pagador</DialogTitle>
            <DialogDescription>
              Cliente do orçamento: <strong>{info.clienteNome}</strong>. O Contas a Receber e o boleto sairão no nome de
              quem você escolher; o financeiro precisa confirmar antes de faturar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Quem vai pagar</Label>
              <div className="flex items-center gap-2">
                <div className="min-h-9 flex-1 rounded-md border px-3 py-2 text-sm">
                  {escolhido?.nome || <span className="text-muted-foreground">Nenhum pagador escolhido</span>}
                </div>
                <Button type="button" variant="outline" onClick={() => setBuscaAberta(true)}>
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pagador-motivo">Motivo (obrigatório)</Label>
              <Textarea
                id="pagador-motivo"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: a empresa da obra paga a venda; o cliente do projeto é o proprietário do imóvel."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar pagador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BuscaPessoaDialog
        modo="cliente"
        open={buscaAberta}
        onClose={() => setBuscaAberta(false)}
        onSelect={(p) => {
          setEscolhido(p)
          setBuscaAberta(false)
        }}
      />
    </Card>
  )
}
