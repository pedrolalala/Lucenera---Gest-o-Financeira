import { useState, useEffect, useMemo } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle, Save, Pencil } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  fetchEditableProjectBudget,
  finalizeValidation,
  EditableProjectData,
  EditableOrcamentoData,
} from '@/services/financialApprovalEditService'
import { ProjectForApproval } from '@/services/projectFinancialApprovalService'
import { EditableBudgetItemsTable } from '@/components/budgets/EditableBudgetItemsTable'

interface FinancialApprovalEditDialogProps {
  project: ProjectForApproval | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFinalized: () => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v || 0,
  )

export function FinancialApprovalEditDialog({
  project,
  open,
  onOpenChange,
  onFinalized,
}: FinancialApprovalEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [projectData, setProjectData] = useState<EditableProjectData>({
    valor_total: 0,
    nivel_estrategico: '',
    cidade: '',
    estado: '',
  })
  const [orcamentos, setOrcamentos] = useState<EditableOrcamentoData[]>([])

  useEffect(() => {
    if (!open || !project) {
      setOrcamentos([])
      return
    }
    setLoading(true)
    fetchEditableProjectBudget(project.id)
      .then((data) => {
        setProjectData({
          valor_total: data.valor_total || 0,
          nivel_estrategico: data.nivel_estrategico || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
        })
        setOrcamentos(
          (data.orcamentos || []).map((o) => ({
            id: o.id,
            numero: o.numero,
            forma_pagamento: o.forma_pagamento,
            valor_total: o.valor_total || 0,
            itens: (o.orcamento_itens || []).map((i: any) => ({
              id: i.id,
              produto_id: i.produto_id || null,
              descricao: i.descricao,
              quantidade: i.quantidade || 0,
              preco_unitario: i.preco_unitario || 0,
              desconto: i.desconto,
              custom_id: i.custom_id,
              ordem: i.ordem,
              peca_nova: i.peca_nova || false,
              produto_info: i.produto
                ? {
                    codigo_produto: i.produto.codigo_produto ?? null,
                    referencia: i.produto.referencia ?? null,
                    nome: i.produto.nome ?? null,
                    sku: i.produto.sku ?? null,
                  }
                : null,
            })),
          })),
        )
      })
      .catch((error: any) => {
        toast.error('Erro ao carregar dados para edição', {
          description: error?.message,
        })
      })
      .finally(() => setLoading(false))
  }, [open, project])

  const calculatedTotal = useMemo(
    () =>
      orcamentos.reduce(
        (s, o) =>
          s +
          o.itens.reduce(
            (is, i) => is + (i.quantidade || 0) * (i.preco_unitario || 0),
            0,
          ),
        0,
      ),
    [orcamentos],
  )

  if (!project) return null

  const handleFinalize = async () => {
    if (!project) return
    if (!projectData.valor_total || projectData.valor_total <= 0) {
      toast.error('Valor total do projeto deve ser maior que zero.')
      return
    }
    setFinalizing(true)
    try {
      const result = await finalizeValidation(
        project.id,
        projectData,
        orcamentos,
      )
      toast.success('Validação financeira finalizada!', {
        description: `Status alterado para: ${result.status_novo}`,
      })
      onOpenChange(false)
      onFinalized()
    } catch (error: any) {
      toast.error('Falha ao finalizar validação', {
        description: error?.message,
      })
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-full sm:w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Pencil className="h-5 w-5 text-amber-600" />
            Editar Validação Financeira
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
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Informações do Projeto
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Valor Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={projectData.valor_total}
                    onChange={(e) =>
                      setProjectData((prev) => ({
                        ...prev,
                        valor_total: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Calculado: {fmt(calculatedTotal)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Nível Estratégico
                  </Label>
                  <Select
                    value={projectData.nivel_estrategico || 'none'}
                    onValueChange={(v) =>
                      setProjectData((prev) => ({
                        ...prev,
                        nivel_estrategico: v === 'none' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      <SelectItem value="1">Nível 1</SelectItem>
                      <SelectItem value="2">Nível 2</SelectItem>
                      <SelectItem value="3">Nível 3</SelectItem>
                      <SelectItem value="4">Nível 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Cidade</Label>
                  <Input
                    value={projectData.cidade}
                    onChange={(e) =>
                      setProjectData((prev) => ({
                        ...prev,
                        cidade: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Estado</Label>
                  <Input
                    value={projectData.estado}
                    onChange={(e) =>
                      setProjectData((prev) => ({
                        ...prev,
                        estado: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <Card className="w-full !max-w-none">
              <CardHeader>
                <CardTitle>Itens do Orçamento</CardTitle>
                <CardDescription>
                  Produtos e quantidades que compõem o orçamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EditableBudgetItemsTable
                  orcamentos={orcamentos}
                  onChange={setOrcamentos}
                />
              </CardContent>
            </Card>

            {projectData.valor_total <= 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  O valor total deve ser maior que zero para finalizar a
                  validação.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={finalizing || loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={finalizing || loading || projectData.valor_total <= 0}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {finalizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Finalizar Validação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
