import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  ShieldAlert,
  Loader2,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchProjectFinancialDetails,
  approveProjectFinancial,
  validateProjectForApproval,
  ProjectFinancialDetail,
  ProjectForApproval,
} from '@/services/projectFinancialApprovalService'
import { ProjectOrcamentoList } from '@/components/budgets/ProjectOrcamentoList'

interface ProjectFinancialReviewDialogProps {
  project: ProjectForApproval | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  onApproved: () => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0)

export function ProjectFinancialReviewDialog({
  project,
  open,
  onOpenChange,
  canManage,
  onApproved,
}: ProjectFinancialReviewDialogProps) {
  const [detail, setDetail] = useState<ProjectFinancialDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [verifyText, setVerifyText] = useState('')
  const [itemsReviewed, setItemsReviewed] = useState(false)

  useEffect(() => {
    if (!open || !project) {
      setDetail(null)
      setShowConfirm(false)
      setVerifyText('')
      setItemsReviewed(false)
      return
    }
    setLoading(true)
    fetchProjectFinancialDetails(project.id)
      .then((data) => setDetail(data))
      .catch((error: any) => {
        toast.error('Erro ao carregar detalhes', {
          description: error?.message,
        })
      })
      .finally(() => setLoading(false))
  }, [open, project])

  if (!project) return null

  const totalOrcamentos = (detail?.orcamentos || []).reduce(
    (sum, o) => sum + (o.valor_total || 0),
    0,
  )
  const totalItens = (detail?.orcamentos || []).reduce(
    (sum, o) => sum + (o.orcamento_itens?.length || 0),
    0,
  )
  const validation = validateProjectForApproval(project)
  const canConfirm =
    verifyText.trim().toUpperCase() === 'APROVAR' &&
    itemsReviewed &&
    validation.ready

  const handleConfirm = async () => {
    if (!project || !canConfirm) return
    setIsApproving(true)
    try {
      const result = await approveProjectFinancial(project.id)
      toast.success('Projeto aprovado financeiramente!', {
        description: `Status alterado para: ${result.status_novo}`,
      })
      onApproved()
    } catch (error: any) {
      toast.error('Falha ao aprovar projeto', { description: error?.message })
      setIsApproving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="h-5 w-5 text-blue-600" />
            Revisão Financeira do Projeto
          </DialogTitle>
          <DialogDescription>
            Código:{' '}
            <span className="font-mono font-bold">{project.codigo || '—'}</span>{' '}
            · {project.nome || '—'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-gray-50 p-4 text-sm">
              <div>
                <span className="text-gray-500">Cliente:</span>
                <p className="font-medium text-gray-900">
                  {detail.cliente?.razao_social ||
                    detail.cliente?.nome ||
                    detail.cliente?.nome_empresa ||
                    '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Arquiteto:</span>
                <p className="font-medium text-gray-900">
                  {detail.arquiteto?.nome || '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Local:</span>
                <p className="font-medium text-gray-900">
                  {detail.cidade && detail.estado
                    ? `${detail.cidade}/${detail.estado}`
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Entrada:</span>
                <p className="font-medium text-gray-900">
                  {detail.data_entrada
                    ? format(new Date(detail.data_entrada), 'dd/MM/yyyy')
                    : '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-gray-500">Orçamentos</p>
                <p className="text-lg font-bold text-gray-900">
                  {detail.orcamentos.length}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-gray-500">Total Itens</p>
                <p className="text-lg font-bold text-gray-900">{totalItens}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="text-lg font-bold text-green-700">
                  {fmt(totalOrcamentos)}
                </p>
              </div>
            </div>

            <ProjectOrcamentoList orcamentos={detail.orcamentos} />

            {canManage && !showConfirm && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={itemsReviewed}
                    onChange={(e) => setItemsReviewed(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Confirmo que revisei todos os itens e dados financeiros.
                </label>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={!itemsReviewed || !validation.ready}
                  onClick={() => setShowConfirm(true)}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Iniciar Aprovação Financeira
                </Button>
                {!validation.ready && (
                  <p className="text-xs text-red-600">
                    {validation.issues.join('; ')}
                  </p>
                )}
              </div>
            )}

            {showConfirm && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Esta ação é irreversível. O status será alterado para{' '}
                    <strong>&quot;Orçamento Aprovado&quot;</strong>.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Digite{' '}
                    <span className="font-bold text-red-600">APROVAR</span> para
                    confirmar:
                  </label>
                  <Input
                    value={verifyText}
                    onChange={(e) => setVerifyText(e.target.value)}
                    placeholder="Digite APROVAR"
                    className={canConfirm ? 'border-green-500' : ''}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowConfirm(false)
                      setVerifyText('')
                    }}
                    disabled={isApproving}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!canConfirm || isApproving}
                    onClick={handleConfirm}
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar Aprovação
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">
            Não foi possível carregar os detalhes.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
