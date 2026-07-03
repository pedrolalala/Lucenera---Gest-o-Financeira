import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react'
import { Budget } from '@/stores/useBudgetStore'

interface FinancialApprovalDialogProps {
  budget: Budget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function FinancialApprovalDialog({
  budget,
  open,
  onOpenChange,
  onConfirm,
}: FinancialApprovalDialogProps) {
  const [verifyText, setVerifyText] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    if (!open) {
      setVerifyText('')
      setIsApproving(false)
    }
  }, [open])

  if (!budget) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)

  const itemCount = budget.itens?.length || 0
  const canConfirm = verifyText.trim().toUpperCase() === 'APROVAR'

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsApproving(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      setIsApproving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5" />
            Confirmação de Aprovação Financeira
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível e irá disparar integrações com o sistema
            financeiro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Resumo do Impacto Financeiro
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Valor Total:</span>
                <p className="font-bold text-gray-900">
                  {formatCurrency(budget.valor_total)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Qtd. de Itens:</span>
                <p className="font-bold text-gray-900">{itemCount}</p>
              </div>
              <div>
                <span className="text-gray-500">Cond. Pagamento:</span>
                <p className="font-bold text-gray-900">
                  {budget.condicoes_pagamento || 'Não informado'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Forma Pagamento:</span>
                <p className="font-bold text-gray-900">
                  {budget.forma_pagamento || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              A confirmação irá gerar boletos, parcelas e registros financeiros
              associados a este orçamento.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Para confirmar, digite{' '}
              <span className="font-bold text-red-600">APROVAR</span> no campo
              abaixo:
            </label>
            <Input
              value={verifyText}
              onChange={(e) => setVerifyText(e.target.value)}
              placeholder="Digite APROVAR"
              className={canConfirm ? 'border-green-500' : ''}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApproving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isApproving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Aprovação Irreversível'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
