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

const FINANCEIRO_URL = 'https://retorno-bancario-bradesco-5392a.goskip.app'

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
  const openFinanceRoute = async (route: string) => {
    try {
      await redirectWithCode(FINANCEIRO_URL, route, 'financeiro', {
        newTab: true,
      })
    } catch {
      window.open(`${FINANCEIRO_URL}${route}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar para Administração Bancária</DialogTitle>
          <DialogDescription>
            O orçamento foi aprovado com vínculo por orçamento. Abra os boletos
            pendentes ou a nota fiscal para validação financeira.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">Orçamento:</span>{' '}
            {budget.numero || budget.id.split('-')[0].toUpperCase()}
          </p>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => void openFinanceRoute('/notas-fiscais')}
          >
            Abrir Nota Fiscal
          </Button>
          <Button
            type="button"
            onClick={() => void openFinanceRoute('/boletos')}
          >
            Abrir Boletos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
