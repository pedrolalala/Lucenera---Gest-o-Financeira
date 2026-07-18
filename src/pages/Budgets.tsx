import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BudgetsTable } from '@/components/budgets/BudgetsTable'
import { ApprovalsTab } from '@/components/budgets/ApprovalsTab'
import { FinancialApprovalTab } from '@/components/budgets/FinancialApprovalTab'
import { TeamApprovalTab } from '@/components/budgets/TeamApprovalTab'
import { ClientApprovalTab } from '@/components/budgets/ClientApprovalTab'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useAuth } from '@/hooks/use-auth'
import AccessDenied from '@/pages/AccessDenied'

const STATUS_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Rascunho', value: 'rascunho' },
  { label: 'Enviado para o Cliente', value: 'enviado_cliente' },
  { label: 'Recusado pelo Cliente', value: 'recusado_cliente' },
  { label: 'Aprovado pelo Cliente', value: 'aprovado' },
  { label: 'Revisão da Equipe (Pós-Visita)', value: 'Aprovação da Equipe' },
  { label: 'Revisão Financeira Pendente', value: 'Aprovação Financeira' },
  { label: 'Orçamento Aprovado', value: 'Orçamento Aprovado' },
  { label: 'Finalizado', value: 'Finalizado' },
  { label: 'Obra Finalizada', value: 'Obra Finalizada' },
  { label: 'Recusado', value: 'recusado' },
  { label: 'Expirado', value: 'expirado' },
]

export default function Budgets() {
  const { budgets, fetchBudgets, loading, initialized } = useBudgetStore()
  const { role, canApproveQuotes } = useAuth()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBudgets({ search: searchTerm })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, fetchBudgets])

  const filteredBudgets = useMemo(() => {
    if (statusFilter === 'all') return budgets
    return budgets.filter((b) => b.status === statusFilter)
  }, [budgets, statusFilter])

  const handleCreate = () => {
    navigate('/budgets/new')
  }

  const handleEdit = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`)
  }

  if (role === 'visitante') {
    return <AccessDenied />
  }

  const showLoading = loading && !initialized

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500">
            Gerencie propostas comerciais e orçamentos.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="aprovacao-cliente">
            Aprovação do cliente
          </TabsTrigger>
          <TabsTrigger value="aprovacao-equipe">
            Aprovação da Equipe
          </TabsTrigger>
          {(role === 'admin' || role === 'gerente') && (
            <TabsTrigger value="aprovacao-financeira">
              Revisão Financeira Pendente
            </TabsTrigger>
          )}
          <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="flex flex-col gap-4 mt-0">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por projeto, código ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <BudgetsTable data={filteredBudgets} onEdit={handleEdit} />
          )}
        </TabsContent>

        <TabsContent value="aprovacao-cliente" className="mt-0">
          <ClientApprovalTab />
        </TabsContent>

        <TabsContent value="aprovacao-equipe" className="mt-0">
          <TeamApprovalTab />
        </TabsContent>

        {(role === 'admin' || role === 'gerente') && (
          <TabsContent value="aprovacao-financeira" className="mt-0">
            <FinancialApprovalTab />
          </TabsContent>
        )}
        <TabsContent value="aprovados" className="mt-0">
          <ApprovalsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
