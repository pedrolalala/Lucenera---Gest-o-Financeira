// SPEC-321 — Cancelar venda aprovada: mostra quem está cancelando, os pedidos de compra
// em andamento ligados à venda e o que acontece com as peças (entram no Estoque Geral ao chegar).
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { AlertTriangle, Ban, Loader2, PackageCheck, Undo2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase/client'
import useBudgetStore from '@/stores/useBudgetStore'
import { semPrefixo } from '@/lib/numeros'

interface PreviaItem {
  produto: string
  codigo: string | number | null
  quantidade: number
  recebida: number
}
interface PreviaPedido {
  pedido_id: string
  numero: string
  status: string
  fornecedor: string | null
  previsao: string | null
  itens: PreviaItem[] | null
}
interface Previa {
  numero: string
  venda: string | null
  cliente: string | null
  projeto_codigo: string | null
  venda_efetivada: boolean
  cancelando: { id: string; nome: string; em: string }
  pedidos: PreviaPedido[]
  parcelas_abertas: number
  bloqueios: string[]
  pode_cancelar: boolean
}

const STATUS_PEDIDO: Record<string, string> = {
  aguardando_aprovar: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  parcialmente_recebido: 'Parcialmente recebido',
}

interface Props {
  budgetId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled?: () => void
  /** 'cancelar' (padrão) cancela a venda; 'desfazer' desfaz a aprovação financeira (volta para Aprovação Financeira). */
  modo?: 'cancelar' | 'desfazer'
}

export function CancelarVendaDialog({
  budgetId,
  open,
  onOpenChange,
  onCancelled,
  modo = 'cancelar',
}: Props) {
  const desfazer = modo === 'desfazer'
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    if (!open) return
    let ativo = true
    setPrevia(null)
    setErro(null)
    setMotivo('')
    setCarregando(true)
    ;(supabase as any)
      .rpc('previa_cancelamento_orcamento', { p_orcamento_id: budgetId })
      .then(({ data, error }: any) => {
        if (!ativo) return
        if (error) setErro(error.message || 'Erro ao consultar o orçamento.')
        else setPrevia(data as Previa)
      })
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [open, budgetId])

  const temPedidos = (previa?.pedidos?.length ?? 0) > 0
  // No modo 'desfazer' os impedimentos são conferidos pelo banco ao confirmar (regras próprias).
  const bloqueado = !desfazer && !!previa && !previa.pode_cancelar
  const exigeMotivo = desfazer || !!previa?.venda_efetivada

  const confirmar = async () => {
    if (!previa) return
    if (exigeMotivo && !motivo.trim()) return
    try {
      setCancelando(true)
      const { data, error } = await (supabase as any).rpc(
        desfazer ? 'desfazer_aprovacao_financeira' : 'cancelar_orcamento',
        { p_orcamento_id: budgetId, p_motivo: motivo.trim() || null },
      )
      if (error) throw new Error(error.message)
      await useBudgetStore.getState().fetchBudgets()
      toast.success(desfazer ? 'Aprovação financeira desfeita' : 'Venda cancelada', {
        description: data?.pedidos_avisados
          ? `${data.pedidos_avisados} pedido(s) de compra em andamento foram liberados e a Compras foi avisada.`
          : desfazer
            ? 'Itens de projeto, parcelas e boletos gerados foram removidos.'
            : 'Reservas, parcelas, boletos e financeiro da venda foram cancelados.',
      })
      onOpenChange(false)
      onCancelled?.()
    } catch (e: any) {
      toast.error(desfazer ? 'Falha ao desfazer a aprovação' : 'Falha ao cancelar a venda', { description: e?.message })
    } finally {
      setCancelando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !cancelando && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className={`flex items-center gap-2 ${desfazer ? 'text-orange-700' : 'text-red-700'}`}
          >
            {desfazer ? <Undo2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
            {desfazer ? 'Desfazer aprovação financeira' : 'Cancelar venda'}
          </DialogTitle>
          <DialogDescription>
            {previa ? (
              <>
                Orçamento {semPrefixo(previa.numero)}
                {previa.venda ? ` — venda ${semPrefixo(previa.venda)}` : ''}
                {previa.cliente ? ` — ${previa.cliente}` : ''}
                {previa.projeto_codigo
                  ? ` (projeto ${previa.projeto_codigo})`
                  : ''}
              </>
            ) : (
              'Conferindo o que está ligado a esta venda…'
            )}
          </DialogDescription>
        </DialogHeader>

        {carregando && (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        )}
        {erro && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{erro}</p>
        )}

        {previa && (
          <div className="space-y-4">
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <strong>{previa.cancelando.nome}</strong> está{' '}
              {desfazer ? 'desfazendo a aprovação desta venda' : 'cancelando esta venda'} em{' '}
              {format(new Date(previa.cancelando.em), "dd/MM/yyyy 'às' HH:mm")}.
              Esse registro fica no histórico do orçamento e é enviado à
              Compras.
            </div>

            {bloqueado && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" /> Não é possível cancelar
                  agora
                </div>
                <ul className="list-disc pl-5">
                  {previa.bloqueios.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {temPedidos && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <PackageCheck className="h-4 w-4" />
                  Há pedido de compra em andamento ligado a esta venda
                </div>
                <p className="mb-2">
                  As peças abaixo <strong>entram no Estoque Geral</strong> quando
                  chegarem à empresa. O pedido <strong>não</strong> é cancelado
                  sozinho: a Compras recebe o aviso e decide se mantém, reduz
                  ou cancela com o fornecedor.
                </p>
                <div className="space-y-3">
                  {previa.pedidos.map((p) => (
                    <div
                      key={p.pedido_id}
                      className="rounded border border-blue-200 bg-white p-2"
                    >
                      <div className="font-medium">
                        Pedido {p.numero} —{' '}
                        {STATUS_PEDIDO[p.status] ?? p.status}
                      </div>
                      <div className="text-xs text-gray-600">
                        {p.fornecedor ?? 'Fornecedor não informado'}
                        {p.previsao
                          ? ` • previsão ${format(new Date(p.previsao + 'T12:00:00'), 'dd/MM/yyyy')}`
                          : ''}
                      </div>
                      <ul className="mt-1 text-xs text-gray-800">
                        {(p.itens ?? []).map((i, idx) => (
                          <li key={idx}>
                            {i.quantidade}× {i.produto}
                            {i.codigo ? ` (${i.codigo})` : ''}
                            {i.recebida > 0 ? ` — ${i.recebida} já recebida(s)` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {desfazer && (
              <p className="text-sm text-gray-700">
                O orçamento volta para "Aprovação Financeira"; os itens de projeto, parcelas e
                boletos gerados pela aprovação são apagados e a reserva de estoque é estornada.
                Só é possível se nada disso já foi usado (boleto registrado/pago, nota fiscal,
                separação, transferência ou devolução).
              </p>
            )}

            {!desfazer && previa.venda_efetivada && !bloqueado && (
              <p className="text-sm text-gray-700">
                Também serão cancelados: reservas e entrega futura das peças
                {previa.parcelas_abertas > 0
                  ? `, ${previa.parcelas_abertas} parcela(s) e seus boletos`
                  : ''}{' '}
                e a conta a receber da venda.
              </p>
            )}

            {!bloqueado && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Motivo {exigeMotivo ? '(obrigatório)' : '(opcional)'}
                </label>
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex.: cliente desistiu da compra…"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelando}
          >
            Voltar
          </Button>
          <Button
            onClick={confirmar}
            disabled={
              !previa ||
              bloqueado ||
              cancelando ||
              (exigeMotivo && !motivo.trim())
            }
            className={desfazer ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
          >
            {cancelando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando…
              </>
            ) : desfazer ? (
              'Desfazer aprovação'
            ) : (
              'Cancelar venda'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
