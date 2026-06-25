import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { BudgetsTable } from '@/components/budgets/BudgetsTable'
import { normalizeStatus, cn } from '@/lib/utils'

export function ApprovalsTab() {
  const { budgets, loading, initialized, approveBudgetAndMigrate } =
    useBudgetStore()
  const navigate = useNavigate()
  const [isSyncing, setIsSyncing] = useState(false)

  const approvedBudgets = useMemo(() => {
    return budgets.filter((b) => normalizeStatus(b.status) === 'aprovado')
  }, [budgets])

  const handleEdit = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  const handleSyncAll = async () => {
    setIsSyncing(true)
    let synced = 0
    let semPrazo = 0
    let comErro = 0
    try {
      for (const b of approvedBudgets) {
        if (!b.projeto_id) continue
        if (!Array.isArray(b.prazo_pagamento_dias) || b.prazo_pagamento_dias.length === 0) {
          semPrazo++
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
      } else if (semPrazo === 0 && comErro === 0) {
        toast.info('Nenhum orçamento precisava de sincronização.')
      }
      if (semPrazo > 0) {
        toast.error(
          `${semPrazo} orçamento(s) sem "Prazo para Início da Cobrança" preenchido. Edite-os antes de sincronizar.`,
          { duration: 8000 },
        )
      }
      if (comErro > 0) {
        toast.error(`${comErro} orçamento(s) falharam na sincronização. Veja o console.`)
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
      <BudgetsTable data={approvedBudgets} onEdit={handleEdit} />
    </div>
  )
}
