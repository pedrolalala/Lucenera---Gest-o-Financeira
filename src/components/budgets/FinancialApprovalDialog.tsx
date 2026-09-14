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
import { toast } from 'sonner'
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
  const [itemsReviewed, setItemsReviewed] = useState(false)
  // Achado 2026-09-14 (teste ao vivo): quando a RPC recusa a aprovação (ex.:
  // item sem cadastro que o banner acima não pegou por causa de um estado
  // desatualizado do orçamento em tela), o erro só aparecia como toast —
  // fácil de perder. Agora fica fixo aqui dentro do diálogo até a pessoa
  // fechar ou tentar de novo.
  const [approvalError, setApprovalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setVerifyText('')
      setIsApproving(false)
      setItemsReviewed(false)
      setApprovalError(null)
    }
  }, [open])

  if (!budget) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)

  const itemCount = budget.itens?.length || 0
  // SPEC-135: item sem produto_id (peça sem cadastro/código interno) não
  // pode ser faturado — vira venda sem controle de estoque. A RPC também
  // bloqueia isso, mas avisar aqui evita o usuário chegar a tentar.
  const itensSemCadastro = (budget.itens || []).filter((i) => !i.produto_id)
  const canConfirm =
    verifyText.trim().toUpperCase() === 'APROVAR' &&
    itemsReviewed &&
    itensSemCadastro.length === 0

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsApproving(true)
    setApprovalError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido.'
      setApprovalError(message)
      toast.error('Falha ao aprovar orçamento financeiramente', {
        description: message,
      })
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

          {approvalError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-300 p-3">
              <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Não foi possível aprovar:</p>
                <p>{approvalError}</p>
              </div>
            </div>
          )}

          {itensSemCadastro.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-300 p-3">
              <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Não é possível aprovar:</strong> {itensSemCadastro.length}{' '}
                item(ns) deste orçamento não têm produto cadastrado (peça sem
                código interno). Cadastre o produto e vincule o item antes de
                aprovar financeiramente — sem isso, viraria uma venda sem
                controle de estoque.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={itemsReviewed}
                onChange={(e) => setItemsReviewed(e.target.checked)}
                className="rounded border-gray-300"
                disabled={itensSemCadastro.length > 0}
              />
              Confirmo que revisei todos os itens e dados financeiros do
              orçamento.
            </label>
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
              disabled={itensSemCadastro.length > 0}
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
