import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  Undo2,
  UserCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
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
import {
  TEAM_APPROVAL_STATUS,
  getStatusBadgeClass,
  getStatusLabel,
  getDisplayValorTotal,
} from '@/lib/budget-status'
import { cn } from '@/lib/utils'
// SPEC-174 N2a: pop-up obrigatório de Previsão de Entrega antes de avançar
// para o financeiro.
import { TeamApprovalDeliveryDialog } from '@/components/budgets/TeamApprovalDeliveryDialog'
// SPEC-174 N3: aviso de orçamento vencido antes de aprovar (decisão do
// usuário, 01/10).
import { BudgetExpiredRedirectDialog } from '@/components/budgets/BudgetExpiredRedirectDialog'
import {
  getBudgetVencimento,
  isBudgetVencido,
  markPriceUpdatePromptAsked,
  wasPriceUpdatePromptAsked,
} from '@/lib/budget-expiration'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

function matchesBudgetSearch(budget: Budget, query: string) {
  const term = query.trim().toLowerCase()
  if (!term) return true

  return [
    budget.numero,
    budget.empresa?.nome,
    budget.projeto?.codigo,
    budget.projeto?.nome,
    budget.cliente?.nome,
    budget.cliente?.razao_social,
    budget.cliente?.email,
    budget.cliente?.nome_empresa,
    budget.arquiteto?.nome,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term))
}

export function TeamApprovalTab() {
  const navigate = useNavigate()
  const { role, user } = useAuth()
  const { budgets, fetchBudgets, equipeAprovarOrcamento, equipeDevolverOrcamentoCliente } =
    useBudgetStore()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [canManageTeamApproval, setCanManageTeamApproval] = useState(false)
  const [returnBudget, setReturnBudget] = useState<Budget | null>(null)
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // SPEC-174 N2a: orçamento aguardando confirmação da previsão de entrega
  // antes de avançar para "Aprovação Financeira".
  const [deliveryBudget, setDeliveryBudget] = useState<Budget | null>(null)
  // SPEC-174 N3: orçamento vencido aguardando a decisão "atualizar preços
  // antes de aprovar?" -- aparece antes do pop-up de Previsão de Entrega.
  const [expiredPriceBudget, setExpiredPriceBudget] =
    useState<Budget | null>(null)

  const canManage = role === 'admin' || role === 'gerente'

  const loadBudgets = useCallback(async () => {
    setLoading(true)
    try {
      await fetchBudgets()
    } catch (error: any) {
      toast.error('Erro ao carregar orçamentos', {
        description: error?.message,
      })
    } finally {
      setLoading(false)
    }
  }, [fetchBudgets])

  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  // Além de admin/gerente, qualquer usuário com a permissão granular do Hub
  // (módulo "aprovacao_equipe" do sistema "orcamentos", SPEC-031) pode agir
  // nesta aba — checagem feita via hub_pode_executar, mesma função que a RPC
  // usa no banco, para o botão de ação já nascer coerente com quem realmente
  // consegue chamar a RPC.
  useEffect(() => {
    if (canManage) {
      setCanManageTeamApproval(true)
      return
    }
    if (!user?.id) {
      setCanManageTeamApproval(false)
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
        if (mounted) setCanManageTeamApproval(Boolean(data))
      })
    return () => {
      mounted = false
    }
  }, [canManage, user?.id])

  const pendingBudgets = useMemo(
    () => budgets.filter((budget) => budget.status === TEAM_APPROVAL_STATUS),
    [budgets],
  )

  const filteredBudgets = useMemo(
    () =>
      pendingBudgets.filter((budget) =>
        matchesBudgetSearch(budget, searchTerm),
      ),
    [pendingBudgets, searchTerm],
  )

  const handleOpenBudget = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  // SPEC-174 N2a: abre o pop-up obrigatório de Previsão de Entrega em vez de
  // aprovar direto -- a confirmação da data é pré-requisito para avançar.
  // SPEC-174 N3: antes disso, se o orçamento estiver vencido e ainda não
  // tiver sido perguntado nesta sessão, mostra o aviso de atualização de
  // preço (decisão do usuário, 01/10).
  const handleApprove = (budget: Budget) => {
    if (isBudgetVencido(budget) && !wasPriceUpdatePromptAsked(budget.id)) {
      setExpiredPriceBudget(budget)
      return
    }
    setDeliveryBudget(budget)
  }

  // SPEC-174 N3: "Não, manter preços atuais" -- não pergunta de novo nesta
  // sessão para este orçamento e segue com a aprovação normal.
  const handleKeepPricesAndApprove = () => {
    if (!expiredPriceBudget) return
    markPriceUpdatePromptAsked(expiredPriceBudget.id)
    setDeliveryBudget(expiredPriceBudget)
    setExpiredPriceBudget(null)
  }

  const handleConfirmDelivery = async (date: Date) => {
    if (!deliveryBudget) return
    const dataFormatada = format(date, 'yyyy-MM-dd')

    // Grava no mesmo campo da SPEC-167 (sem coluna nova). Não é uma
    // transição de status, então vai direto na tabela como o resto do
    // formulário de orçamento já faz (useBudgetStore.updateBudget).
    // `previsao_entrega` ainda não está no types.ts gerado (stale desde a
    // SPEC-167) -- passar por uma variável Partial<Budget>, como o store já
    // faz, evita o erro de "excess property" que um objeto literal geraria.
    const previsaoEntregaPayload: Partial<Budget> = {
      previsao_entrega: dataFormatada,
    }
    const { error: updateError } = await supabase
      .from('orcamentos')
      .update(previsaoEntregaPayload)
      .eq('id', deliveryBudget.id)

    if (updateError) {
      throw new Error(
        updateError.message || 'Erro ao gravar a previsão de entrega.',
      )
    }

    // Observação registrada em historico_status_orcamentos (via RPC
    // equipe_aprovar_orcamento, p_observacao) para auditoria da data
    // confirmada nesta etapa.
    await equipeAprovarOrcamento(
      deliveryBudget,
      `Previsão de entrega confirmada pela equipe: ${format(date, 'dd/MM/yyyy', { locale: ptBR })}.`,
    )
    toast.success('Orçamento aprovado pela equipe', {
      description: 'Encaminhado para revisão financeira.',
    })
    setDeliveryBudget(null)
  }

  const handleOpenReturn = (budget: Budget) => {
    setReturnBudget(budget)
    setMotivo('')
  }

  const handleConfirmReturn = async () => {
    if (!returnBudget || !motivo.trim()) return
    setSubmitting(true)
    try {
      await equipeDevolverOrcamentoCliente(returnBudget, motivo.trim())
      toast.success('Orçamento devolvido ao cliente', {
        description: 'Um novo link de aprovação foi gerado.',
      })
      setReturnBudget(null)
      setMotivo('')
    } catch (error: any) {
      toast.error('Erro ao devolver orçamento ao cliente', {
        description: error?.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-purple-100 p-2 flex-shrink-0">
            <UserCheck className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wide">
              Aprovação da Equipe (Pós-Visita)
            </h3>
            <p className="text-sm text-purple-800 mt-1">
              O cliente já aprovou. Depois da visita à obra, confirme o
              orçamento para seguir ao financeiro ou devolva ao cliente se
              alguma peça/cor precisar mudar.
            </p>
            {!canManageTeamApproval && (
              <p className="text-xs text-purple-700 mt-2 font-medium">
                Você não tem permissão para agir nesta etapa. Fale com um
                administrador para receber acesso ao módulo "Aprovação da
                Equipe" no Hub.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar por orçamento, projeto, cliente ou arquiteto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {filteredBudgets.length > 0 && (
          <span className="text-sm text-gray-500 self-center whitespace-nowrap">
            {filteredBudgets.length}{' '}
            {filteredBudgets.length === 1 ? 'orçamento' : 'orçamentos'}
          </span>
        )}
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            {searchTerm
              ? 'Nenhum orçamento encontrado.'
              : 'Nenhum orçamento aguardando a equipe'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Orçamentos aprovados pelo cliente aparecerão aqui até a equipe decidir.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Emissão</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Orçamento</TableHead>
                  <TableHead className="font-semibold">Projeto</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Arquiteto</TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => (
                  <TableRow
                    key={budget.id}
                    onDoubleClick={() => handleOpenBudget(budget)}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(budget.data_emissao)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {budget.empresa?.nome || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-bold text-gray-900">
                        {budget.numero || budget.id.slice(0, 8)}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(getStatusBadgeClass(budget.status))}
                      >
                        {getStatusLabel(budget.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div className="font-mono text-sm">
                        {budget.projeto?.codigo || '-'}
                      </div>
                      {budget.projeto?.nome && (
                        <div className="max-w-[220px] truncate text-xs text-gray-500">
                          {budget.projeto.nome}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {budget.cliente?.razao_social ||
                        budget.cliente?.nome ||
                        budget.cliente?.nome_empresa ||
                        '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {budget.arquiteto?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {BRL.format(getDisplayValorTotal(budget.valor_total, budget.natureza_operacao))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleOpenBudget(budget)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Ver/Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canManageTeamApproval}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => handleOpenReturn(budget)}
                        >
                          <Undo2 className="h-4 w-4 mr-1" />
                          Devolver ao Cliente
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canManageTeamApproval}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleApprove(budget)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aprovar e Enviar ao Financeiro
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog
        open={!!returnBudget}
        onOpenChange={(open) => {
          if (!open) {
            setReturnBudget(null)
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
                setReturnBudget(null)
                setMotivo('')
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReturn}
              disabled={!motivo.trim() || submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitting ? (
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
        open={!!expiredPriceBudget}
        onOpenChange={(open) => {
          if (!open) setExpiredPriceBudget(null)
        }}
        budgetId={expiredPriceBudget?.id || ''}
        vencimento={
          expiredPriceBudget ? getBudgetVencimento(expiredPriceBudget) : null
        }
        budgetNumero={expiredPriceBudget?.numero}
        onKeepPrices={handleKeepPricesAndApprove}
      />

      <TeamApprovalDeliveryDialog
        open={!!deliveryBudget}
        onOpenChange={(open) => {
          if (!open) setDeliveryBudget(null)
        }}
        initialDate={
          deliveryBudget?.previsao_entrega
            ? new Date(`${deliveryBudget.previsao_entrega}T00:00:00`)
            : null
        }
        budgetNumero={deliveryBudget?.numero}
        onConfirm={handleConfirmDelivery}
      />
    </div>
  )
}
