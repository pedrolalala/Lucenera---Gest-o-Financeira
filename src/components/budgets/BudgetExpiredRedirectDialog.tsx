import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { semPrefixo } from '@/lib/numeros'

interface BudgetExpiredRedirectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  vencimento: Date | null
  budgetNumero?: string | null
  /** "Não" -- segue com os preços antigos, sem perguntar de novo nesta
   * sessão para este orçamento (quem chama já marca o dismiss). */
  onKeepPrices: () => void
}

// SPEC-174 N3 (decisão do usuário, 01/10): mesmo aviso de orçamento vencido
// da edição (BudgetPriceUpdateDialog.tsx), só que disparado a partir de uma
// ação de aprovação (aprovação da equipe/financeira) em vez da tela de
// edição -- aqui não há formulário aberto para aplicar o novo preço e
// deixar o usuário salvar, então "Sim" manda para a edição do orçamento
// (onde o aviso reaparece já com a prévia de preços) em vez de atualizar
// qualquer coisa sozinho. "Não" segue direto com a aprovação de origem.
export function BudgetExpiredRedirectDialog({
  open,
  onOpenChange,
  budgetId,
  vencimento,
  budgetNumero,
  onKeepPrices,
}: BudgetExpiredRedirectDialogProps) {
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Orçamento vencido
          </DialogTitle>
          <DialogDescription>
            {budgetNumero ? `Orçamento ${semPrefixo(budgetNumero)}. ` : ''}
            Orçamento vencido em{' '}
            {vencimento
              ? format(vencimento, 'dd/MM/yyyy', { locale: ptBR })
              : '-'}{' '}
            — deseja atualizar os preços antes de aprovar? Custo, margem e
            impostos podem ter mudado desde a emissão.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onKeepPrices()
            }}
          >
            Não, manter preços atuais
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              navigate(`/budgets/${budgetId}`)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sim, revisar preços
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
