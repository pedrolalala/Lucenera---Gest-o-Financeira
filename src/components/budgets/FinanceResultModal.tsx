import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApprovalResult, Budget } from '@/stores/useBudgetStore'
import { redirectWithCode } from '@/lib/cross-system-auth'

// SPEC-153: nota fiscal e boletos pós-aprovação saem da aprovação do
// orçamento e do Financeiro (Admin Bancária) — agora só a tela de Vendas
// orquestra isso. URL confirmada com o usuário (projectId 59346, "Página de
// Vendas") e usada na migration 20260917_153.../002_registro_vendas_no_hub.sql.
const VENDAS_URL = 'https://pagina-de-vendas-9549c.goskip.app'

interface FinanceResultModalProps {
  budget: Budget
  result: ApprovalResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinanceResultModal({
  budget,
  result,
  open,
  onOpenChange,
}: FinanceResultModalProps) {
  const openVendasRoute = async (route: string) => {
    try {
      await redirectWithCode(VENDAS_URL, route, 'vendas', {
        newTab: true,
      })
    } catch {
      window.open(`${VENDAS_URL}${route}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Venda registrada</DialogTitle>
          <DialogDescription>
            O orçamento foi aprovado e virou venda. Nota fiscal e boletos agora
            são orquestrados a partir da tela de Vendas.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">Orçamento:</span>{' '}
            {budget.numero || budget.id.split('-')[0].toUpperCase()}
          </p>
          {result?.numero_venda && (
            <p>
              <span className="font-medium">Venda:</span> {result.numero_venda}
            </p>
          )}
          <p>
            <span className="font-medium">Itens criados:</span>{' '}
            {result?.projeto_itens_criados ?? 0}
          </p>
          <p>
            <span className="font-medium">Parcelas:</span>{' '}
            {result?.parcelas_criadas ?? 0}
          </p>
          <p>
            <span className="font-medium">Boletos:</span>{' '}
            {result?.boletos_criados ?? 0}
          </p>
          {result?.ja_processado && (
            <p className="text-xs text-blue-700">
              Este orçamento já estava processado; nada foi duplicado.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" onClick={() => void openVendasRoute('/vendas')}>
            Ver na tela de Vendas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
