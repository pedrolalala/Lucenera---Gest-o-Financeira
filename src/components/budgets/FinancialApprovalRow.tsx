import { format } from 'date-fns'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Edit,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Budget } from '@/stores/useBudgetStore'
import { isValidUUID } from '@/lib/uuid'
import { validateBudget } from '@/services/budgetApprovalService'

interface FinancialApprovalRowProps {
  budget: Budget
  canApproveQuotes: boolean
  onEdit: (budget: Budget) => void
  onApprove: (budget: Budget) => void
}

export function FinancialApprovalRow({
  budget,
  canApproveQuotes,
  onEdit,
  onApprove,
}: FinancialApprovalRowProps) {
  const validation = validateBudget(budget)
  const canApprove =
    canApproveQuotes && validation.ready && isValidUUID(budget.id)
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)

  let disabledReason = ''
  if (!canApproveQuotes)
    disabledReason = 'Você não tem permissão para aprovar orçamentos.'
  else if (!isValidUUID(budget.id))
    disabledReason = 'ID do orçamento inválido (não é um UUID válido).'
  else if (!validation.ready) disabledReason = validation.issues.join('; ')

  return (
    <TableRow>
      <TableCell className="text-sm text-gray-600">
        {budget.data_emissao && !isNaN(new Date(budget.data_emissao).getTime())
          ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
          : '-'}
      </TableCell>
      <TableCell className="font-medium text-gray-900">
        {budget.cliente?.nome || '-'}
      </TableCell>
      <TableCell className="text-gray-700">
        {budget.empresa?.nome || '-'}
      </TableCell>
      <TableCell className="text-right font-bold text-gray-900">
        {fmt(budget.valor_total)}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            budget.requer_revisao_financeira
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }
        >
          {budget.requer_revisao_financeira
            ? 'Revisão Pendente'
            : 'Aguardando Aprovação'}
        </Badge>
      </TableCell>
      <TableCell>
        {validation.ready ? (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <ShieldCheck className="h-4 w-4" /> Pronto
          </span>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-sm text-red-600 cursor-help">
                <AlertTriangle className="h-4 w-4" /> {validation.issues.length}{' '}
                problema(s)
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ul className="list-disc list-inside text-xs space-y-1">
                {validation.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => onEdit(budget)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {canApprove ? (
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onApprove(budget)}
            >
              <ShieldAlert className="h-4 w-4 mr-1" /> Aprovar
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{disabledReason}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
