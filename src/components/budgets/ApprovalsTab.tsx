import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { BudgetsTable } from '@/components/budgets/BudgetsTable'
import { cn } from '@/lib/utils'

export function ApprovalsTab() {
  const { budgets, loading, initialized, approveBudgetAndMigrate } =
    useBudgetStore()
  const navigate = useNavigate()
  const [isSyncing, setIsSyncing] = useState(false)

  const financialApprovalBudgets = useMemo(() => {
    return budgets.filter((b) => b.status === 'Aprovação Financeira')
  }, [budgets])

  const handleEdit = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  const handleSyncAll = async () => {
    setIsSyncing(true)
    let synced = 0
    let semPrazo = 0
    let semFrete = 0
    let comErro = 0
    try {
      for (const b of financialApprovalBudgets) {
        if (!b.projeto_id) continue
        if (
          !Array.isArray(b.prazo_pagamento_dias) ||
          b.prazo_pagamento_dias.length === 0
        ) {
          semPrazo++
          continue
        }
        if (!b.frete_tipo) {
          semFrete++
          continue
        }
        try {
          const result = await approveBudgetAndMigrate(b)
          if (!result.ja_processado) {
            synced++
          }
        } catch (e: any) {
          comErro++
          console.error(`Erro ao sincronizar orçamento ${b.numero || b.id}:`, e)
        }
      }

      if (synced > 0) {
        toast.success(`${synced} orçamentos sincronizados com sucesso.`)
      } else if (semPrazo === 0 && semFrete === 0 && comErro === 0) {
        toast.info('Nenhum orçamento precisava de sincronização.')
      }
      if (semPrazo > 0) {
        toast.error(
          `${semPrazo} orçamento(s) sem "Prazo para Início da Cobrança" preenchido. Edite-os antes de sincronizar.`,
          { duration: 8000 },
        )
      }
      if (semFrete > 0) {
        toast.error(
          `${semFrete} orçamento(s) sem frete estruturado ("Com Frete"/"Sem Frete"). Edite-os antes de sincronizar.`,
          { duration: 8000 },
        )
      }
      if (comErro > 0) {
        toast.error(
          `${comErro} orçamento(s) falharam na sincronização. Veja o console.`,
        )
      }
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading && !initialized) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800 text-sm uppercase tracking-wide">
              Aprovação Financeira
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Orçamentos aprovados pelo cliente aguardando revisão financeira.
              Sincronize para gerar itens, parcelas e boletos do projeto.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSyncAll}
          disabled={isSyncing}
          variant="outline"
          className="shadow-sm"
        >
          <RefreshCw
            className={cn('w-4 h-4 mr-2', isSyncing && 'animate-spin')}
          />
          Sincronizar Pendências
        </Button>
      </div>
      <BudgetsTable data={financialApprovalBudgets} onEdit={handleEdit} />
    </div>
  )
}
