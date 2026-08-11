import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Send, Edit, Loader2, FileEdit, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { searchBudgetsByContactsAndProjects } from '@/lib/budget-search'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import {
  getStatusLabel,
  getStatusBadgeClass,
  buildClientApprovalLink,
  isDraftStatus,
} from '@/lib/budget-status'
import { sendInitialBudgetPdfAndEmail } from '@/lib/envio-inicial-cliente'
import { cn } from '@/lib/utils'

// SPEC-051 (P-2): qualquer usuário autenticado pode enviar um rascunho ao
// cliente — sem restrição extra de papel, diferente das demais ações de
// aprovação/reenvio já existentes no sistema.

export function DraftBudgetsTab() {
  const { budgets, loading, initialized, enviarOrcamentoCliente } =
    useBudgetStore()
  const navigate = useNavigate()
  const [actionId, setActionId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const draftBudgets = useMemo(
    () => budgets.filter((b) => isDraftStatus(b.status)),
    [budgets],
  )

  const filteredBudgets = useMemo(
    () => searchBudgetsByContactsAndProjects(draftBudgets, searchTerm),
    [draftBudgets, searchTerm],
  )

  const handleEdit = (budget: Budget) => navigate(`/budgets/${budget.id}`)

  // SPEC-067 — envio inicial de um rascunho: além do comportamento já
  // existente (RPC + copiar link + toast), baixa o PDF do orçamento e abre
  // um `mailto:` pré-preenchido para o cliente.
  const handleEnviar = async (budget: Budget) => {
    setActionId(budget.id)
    try {
      const result = await enviarOrcamentoCliente(budget.id)
      const link = buildClientApprovalLink(budget.id, result.token)
      await navigator.clipboard.writeText(link)
      toast.success('Orçamento enviado ao cliente! Link copiado.', {
        description: link,
        duration: 8000,
      })
      try {
        await sendInitialBudgetPdfAndEmail(budget, result.token)
      } catch (pdfError: any) {
        toast.error('Falha ao gerar o PDF', {
          description: pdfError?.message,
        })
      }
    } catch (error: any) {
      toast.error('Falha ao enviar orçamento', { description: error?.message })
    } finally {
      setActionId(null)
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)

  if (loading && !initialized) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-100 p-2 flex-shrink-0">
            <FileEdit className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Rascunho
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Orçamentos em desenvolvimento. Continue editando e, quando estiver
              pronto, use "Enviar para o Cliente" para avançar o fluxo de
              aprovação.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar por cliente, email, empresa, projeto ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {filteredBudgets.length > 0 && (
          <span className="text-sm text-gray-500 self-center whitespace-nowrap">
            {filteredBudgets.length}{' '}
            {filteredBudgets.length === 1 ? 'orçamento' : 'orçamentos'}
          </span>
        )}
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileEdit className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            {searchTerm
              ? 'Nenhum orçamento encontrado para a busca.'
              : 'Nenhum orçamento em rascunho'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Orçamentos recém-criados aparecerão aqui até serem enviados ao cliente.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Emissão</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">
                    Código do Projeto
                  </TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Arquiteto</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor Total
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => (
                  <TableRow
                    key={budget.id}
                    onDoubleClick={() => handleEdit(budget)}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-sm text-gray-600">
                      {budget.data_emissao &&
                      !isNaN(new Date(budget.data_emissao).getTime())
                        ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {budget.empresa?.nome || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {budget.projeto?.codigo || budget.numero || '-'}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {budget.cliente?.razao_social ||
                        budget.cliente?.nome ||
                        '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {budget.arquiteto?.nome || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(getStatusBadgeClass(budget.status))}
                      >
                        {getStatusLabel(budget.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {fmt(budget.valor_total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          title="Editar"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleEnviar(budget)}
                          disabled={actionId === budget.id}
                        >
                          {actionId === budget.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Enviar para o Cliente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
