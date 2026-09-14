import { useEffect, useMemo, useState } from 'react'
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
import {
  calcularResumoFinanceiro,
  FORMA_PAGAMENTO_LABELS,
} from '@/lib/budget-financial-summary'

interface FinancialApprovalDialogProps {
  budget: Budget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // SPEC-133: quando o usuário edita o valor de alguma parcela aqui dentro,
  // passa o array completo (mesma ordem das parcelas) — a RPC substitui a
  // divisão igualitária padrão por esses valores. Sem edição, passa
  // undefined e o comportamento é idêntico ao de antes desta SPEC.
  onConfirm: (valoresParcelas?: number[]) => Promise<void>
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

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
  // SPEC-133: valores de parcela editáveis — strings pra deixar o campo
  // digitável livremente, convertidos pra number só na validação/confirmação.
  const [parcelaValores, setParcelaValores] = useState<string[]>([])

  const resumo = useMemo(
    () => (budget ? calcularResumoFinanceiro(budget) : null),
    [budget],
  )

  useEffect(() => {
    if (open && resumo) {
      setParcelaValores(resumo.parcelas.map((p) => p.valor.toFixed(2)))
    }
  }, [open, resumo])

  useEffect(() => {
    if (!open) {
      setVerifyText('')
      setIsApproving(false)
      setItemsReviewed(false)
      setApprovalError(null)
    }
  }, [open])

  if (!budget || !resumo) return null

  const itemCount = budget.itens?.length || 0
  // SPEC-135: item sem produto_id (peça sem cadastro/código interno) não
  // pode ser faturado — vira venda sem controle de estoque. A RPC também
  // bloqueia isso, mas avisar aqui evita o usuário chegar a tentar.
  const itensSemCadastro = (budget.itens || []).filter((i) => !i.produto_id)

  const parcelaValoresNumeros = parcelaValores.map((v) => Number(v.replace(',', '.')))
  const parcelasValidas =
    parcelaValoresNumeros.length === resumo.parcelas.length &&
    parcelaValoresNumeros.every((v) => Number.isFinite(v) && v > 0)

  // SPEC-133: só manda p_valores_parcelas quando algo realmente mudou em
  // relação ao cálculo padrão (divisão igualitária) — sem edição, a chamada
  // segue idêntica à de antes desta SPEC (p_valores_parcelas = null).
  const parcelasForamEditadas = resumo.parcelas.some(
    (p, i) => p.valor.toFixed(2) !== parcelaValores[i],
  )

  const canConfirm =
    verifyText.trim().toUpperCase() === 'APROVAR' &&
    itemsReviewed &&
    itensSemCadastro.length === 0 &&
    parcelasValidas

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsApproving(true)
    setApprovalError(null)
    try {
      await onConfirm(parcelasForamEditadas ? parcelaValoresNumeros : undefined)
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

  const formaPagamentoLabel = budget.forma_pagamento
    ? FORMA_PAGAMENTO_LABELS[budget.forma_pagamento] || budget.forma_pagamento
    : 'Não informado'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                <span className="text-gray-500">Valor Bruto:</span>
                <p className="font-bold text-gray-900">
                  {formatCurrency(resumo.valorBruto)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Qtd. de Itens:</span>
                <p className="font-bold text-gray-900">{itemCount}</p>
              </div>
              {resumo.valorSinal > 0 && (
                <div>
                  <span className="text-gray-500">Sinal:</span>
                  <p className="font-bold text-gray-900">
                    -{formatCurrency(resumo.valorSinal)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Desconto:</span>
                <p className="font-bold text-gray-900">
                  -{formatCurrency(resumo.descontoValor)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Valor Líquido:</span>
                <p className="font-bold text-gray-900">
                  {formatCurrency(resumo.valorLiquido)}
                </p>
              </div>
              {resumo.freteValor > 0 && (
                <div>
                  <span className="text-gray-500">Frete:</span>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(resumo.freteValor)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Valor Total:</span>
                <p className="font-bold text-gray-900">
                  {formatCurrency(resumo.valorTotal)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Forma Pagamento:</span>
                <p className="font-bold text-gray-900">{formaPagamentoLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              {resumo.parcelas.length}{' '}
              {resumo.parcelas.length === 1 ? 'parcela' : 'parcelas'}
              <span className="font-normal text-gray-500">
                {' '}
                — valor editável (ex.: entrada maior que o padrão)
              </span>
            </p>
            <div className="space-y-1.5">
              {resumo.parcelas.map((p, i) => (
                <div key={p.numero} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-gray-500 shrink-0">{p.numero}ª</span>
                  <span className="flex-1 text-gray-600">
                    vence {formatDate(p.dataVencimento)}
                  </span>
                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      R$
                    </span>
                    <Input
                      value={parcelaValores[i] ?? ''}
                      onChange={(e) =>
                        setParcelaValores((vals) => {
                          const next = [...vals]
                          next[i] = e.target.value
                          return next
                        })
                      }
                      className="h-8 pl-8 text-right text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            {!parcelasValidas && (
              <p className="text-xs text-red-600 mt-2">
                Todos os valores de parcela precisam ser números maiores que zero.
              </p>
            )}
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
