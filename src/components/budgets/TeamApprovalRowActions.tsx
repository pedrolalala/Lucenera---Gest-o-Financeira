import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Undo2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import useBudgetStore, { type Budget } from '@/stores/useBudgetStore'
import { TeamApprovalDeliveryDialog } from '@/components/budgets/TeamApprovalDeliveryDialog'
import { BudgetExpiredRedirectDialog } from '@/components/budgets/BudgetExpiredRedirectDialog'
import {
  getBudgetVencimento,
  isBudgetVencido,
  markPriceUpdatePromptAsked,
  wasPriceUpdatePromptAsked,
} from '@/lib/budget-expiration'

// Pedido do usuário (14/10): a lista de orçamentos ficou só com o dropdown de
// status (sem as abas). As ações que só existiam na aba "Aprovação da Equipe"
// (TeamApprovalTab) vieram para a linha da tabela -- mesma lógica: aviso de
// orçamento vencido (SPEC-174 N3), previsão de entrega obrigatória (SPEC-174
// N2a) e motivo obrigatório para devolver ao cliente.
export function TeamApprovalRowActions({ budget }: { budget: Budget }) {
  const { role, user } = useAuth()
  const { equipeAprovarOrcamento, equipeDevolverOrcamentoCliente } =
    useBudgetStore()
  const [podeAgir, setPodeAgir] = useState(false)
  const [devolverAberto, setDevolverAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [previsaoAberta, setPrevisaoAberta] = useState(false)
  const [vencidoAberto, setVencidoAberto] = useState(false)

  const canManage = role === 'admin' || role === 'gerente'

  // Mesma checagem da aba: admin/gerente ou o módulo "aprovacao_equipe" do
  // Hub (o mesmo que a RPC confere no banco).
  useEffect(() => {
    if (canManage) {
      setPodeAgir(true)
      return
    }
    if (!user?.id) {
      setPodeAgir(false)
      return
    }
    let mounted = true
    ;(supabase as any)
      .rpc('hub_pode_executar', {
        p_usuario_id: user.id,
        p_system_slug: 'orcamentos',
        p_modulo_chave: 'aprovacao_equipe',
        p_acao: 'editar',
      })
      .then(({ data }: { data: boolean | null }) => {
        if (mounted) setPodeAgir(Boolean(data))
      })
    return () => {
      mounted = false
    }
  }, [canManage, user?.id])

  const handleAprovar = () => {
    if (isBudgetVencido(budget) && !wasPriceUpdatePromptAsked(budget.id)) {
      setVencidoAberto(true)
      return
    }
    setPrevisaoAberta(true)
  }

  const handleManterPrecos = () => {
    markPriceUpdatePromptAsked(budget.id)
    setVencidoAberto(false)
    setPrevisaoAberta(true)
  }

  const handleConfirmarPrevisao = async (date: Date) => {
    const previsaoEntregaPayload: Partial<Budget> = {
      previsao_entrega: format(date, 'yyyy-MM-dd'),
    }
    const { error: updateError } = await supabase
      .from('orcamentos')
      .update(previsaoEntregaPayload)
      .eq('id', budget.id)

    if (updateError) {
      throw new Error(
        updateError.message || 'Erro ao gravar a previsão de entrega.',
      )
    }

    await equipeAprovarOrcamento(
      budget,
      `Previsão de entrega confirmada pela equipe: ${format(date, 'dd/MM/yyyy', { locale: ptBR })}.`,
    )
    toast.success('Orçamento aprovado pela equipe', {
      description: 'Encaminhado para revisão financeira.',
    })
    setPrevisaoAberta(false)
  }

  const handleConfirmarDevolucao = async () => {
    if (!motivo.trim()) return
    setEnviando(true)
    try {
      await equipeDevolverOrcamentoCliente(budget, motivo.trim())
      toast.success('Orçamento devolvido ao cliente', {
        description: 'Um novo link de aprovação foi gerado.',
      })
      setDevolverAberto(false)
      setMotivo('')
    } catch (error: any) {
      toast.error('Erro ao devolver orçamento ao cliente', {
        description: error?.message,
      })
    } finally {
      setEnviando(false)
    }
  }

  if (!podeAgir) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
        title="Devolver ao Cliente"
        onClick={() => {
          setMotivo('')
          setDevolverAberto(true)
        }}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        title="Aprovar e Enviar ao Financeiro"
        onClick={handleAprovar}
      >
        <UserCheck className="h-4 w-4" />
      </Button>

      <Dialog
        open={devolverAberto}
        onOpenChange={(open) => {
          if (!open) {
            setDevolverAberto(false)
            setMotivo('')
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <Undo2 className="h-5 w-5" />
              Devolver Orçamento ao Cliente
            </DialogTitle>
            <DialogDescription>
              O orçamento volta para "Enviado para o Cliente" com um novo link
              de aprovação. Descreva o que mudou (peça, cor, etc.) — o cliente
              vai ver esse motivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Motivo da alteração (obrigatório)
            </label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: cliente trocou o luminária X pela Y na visita à obra."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDevolverAberto(false)
                setMotivo('')
              }}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarDevolucao}
              disabled={!motivo.trim() || enviando}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Devolução'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BudgetExpiredRedirectDialog
        open={vencidoAberto}
        onOpenChange={(open) => {
          if (!open) setVencidoAberto(false)
        }}
        budgetId={budget.id}
        vencimento={getBudgetVencimento(budget)}
        budgetNumero={budget.numero}
        onKeepPrices={handleManterPrecos}
      />

      <TeamApprovalDeliveryDialog
        open={previsaoAberta}
        onOpenChange={(open) => {
          if (!open) setPrevisaoAberta(false)
        }}
        initialDate={
          budget.previsao_entrega
            ? new Date(`${budget.previsao_entrega}T00:00:00`)
            : null
        }
        budgetNumero={budget.numero}
        onConfirm={handleConfirmarPrevisao}
      />
    </>
  )
}
