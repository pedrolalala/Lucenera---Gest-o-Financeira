import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, X, ShieldAlert, ShieldCheck, Eye, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import {
  fetchProjectsForFinancialApproval,
  searchProjects,
  validateProjectForApproval,
  ProjectForApproval,
} from '@/services/projectFinancialApprovalService'
import { ProjectFinancialReviewDialog } from '@/components/budgets/ProjectFinancialReviewDialog'

export function FinancialApprovalTab() {
  const { role } = useAuth()
  const [projects, setProjects] = useState<ProjectForApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] =
    useState<ProjectForApproval | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const canManage = role === 'admin' || role === 'gerente'

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchProjectsForFinancialApproval()
      setProjects(data)
    } catch (error: any) {
      toast.error('Erro ao carregar projetos', { description: error?.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = useMemo(
    () => searchProjects(projects, searchTerm),
    [projects, searchTerm],
  )

  const handleReview = (project: ProjectForApproval) => {
    setSelectedProject(project)
    setDialogOpen(true)
  }

  const handleApproved = () => {
    setDialogOpen(false)
    setSelectedProject(null)
    loadProjects()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-amber-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">
              Aprovação Financeira de Projetos
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Revise os detalhes financeiros e itens vinculados antes de
              aprovar. Esta ação é irreversível.
            </p>
            {!canManage && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚠ Apenas administradores e gerentes podem aprovar projetos
                financeiramente.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar por código, nome, cliente, arquiteto ou email..."
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
        {filteredProjects.length > 0 && (
          <span className="text-sm text-gray-500 self-center whitespace-nowrap">
            {filteredProjects.length}{' '}
            {filteredProjects.length === 1 ? 'projeto' : 'projetos'}
          </span>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            {searchTerm
              ? 'Nenhum projeto encontrado.'
              : 'Nenhum projeto aguardando aprovação financeira'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Projetos em "Aprovação Financeira" aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Projeto</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Arquiteto</TableHead>
                  <TableHead className="font-semibold">Local</TableHead>
                  <TableHead className="font-semibold">Entrada</TableHead>
                  <TableHead className="font-semibold">Validação</TableHead>
                  <TableHead className="font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const validation = validateProjectForApproval(project)
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-mono text-sm font-bold text-gray-900">
                        {project.codigo || '—'}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {project.nome || '—'}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {project.cliente?.razao_social ||
                          project.cliente?.nome ||
                          project.cliente?.nome_empresa ||
                          '—'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {project.arquiteto?.nome || '—'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {project.cidade && project.estado
                          ? `${project.cidade}/${project.estado}`
                          : project.cidade || project.estado || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {project.data_entrada
                          ? new Date(project.data_entrada).toLocaleDateString(
                              'pt-BR',
                            )
                          : '—'}
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
                                <Lock className="h-4 w-4" />{' '}
                                {validation.issues.length} pendência(s)
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleReview(project)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ProjectFinancialReviewDialog
        project={selectedProject}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        canManage={canManage}
        onApproved={handleApproved}
      />
    </div>
  )
}
