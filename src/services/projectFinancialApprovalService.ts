import { supabase } from '@/lib/supabase/client'
import { isValidUUID } from '@/lib/uuid'

export interface ProjectContact {
  nome: string | null
  email: string | null
  nome_empresa: string | null
  razao_social: string | null
}

export interface ProjectForApproval {
  id: string
  codigo: string | null
  nome: string | null
  status: string | null
  cidade: string | null
  estado: string | null
  data_entrada: string | null
  valor_total: number | null
  nivel_estrategico: string | null
  cliente: ProjectContact | null
  arquiteto: ProjectContact | null
}

export interface OrcamentoItemDetail {
  id: string
  descricao: string | null
  quantidade: number | null
  preco_unitario: number | null
  desconto: number | null
  custom_id: string | null
  ordem: number | null
  peca_nova: boolean | null
}

export interface OrcamentoDetail {
  id: string
  numero: string | null
  valor_total: number | null
  status: string | null
  condicoes_pagamento: string | null
  forma_pagamento: string | null
  orcamento_itens: OrcamentoItemDetail[]
}

export interface ProjectFinancialDetail extends ProjectForApproval {
  orcamentos: OrcamentoDetail[]
}

export interface ValidationResult {
  ready: boolean
  issues: string[]
}

export interface ApprovalResult {
  project_id: string
  status_anterior: string
  status_novo: string
  sucesso: boolean
}

const PROJECT_SELECT = `
  id,
  codigo,
  nome,
  status,
  cidade,
  estado,
  data_entrada,
  valor_total,
  nivel_estrategico,
  cliente:contatos!cliente_id(nome, email, nome_empresa, razao_social),
  arquiteto:contatos!arquiteto_id(nome, email, nome_empresa)
`

export function validateProjectForApproval(
  project: ProjectForApproval,
): ValidationResult {
  const issues: string[] = []
  if (!project.codigo || project.codigo.trim() === '')
    issues.push('Código do projeto não definido')
  if (!project.nome) issues.push('Nome do projeto não definido')
  if (!project.cliente) issues.push('Cliente não vinculado')
  return { ready: issues.length === 0, issues }
}

export function fuzzyMatch(
  query: string,
  target: string | null | undefined,
): boolean {
  if (!target) return false
  const q = query.trim().toLowerCase()
  if (!q) return false
  return target.toLowerCase().includes(q)
}

export function searchProjects<T extends ProjectForApproval>(
  projects: T[],
  query: string,
): T[] {
  const trimmed = query.trim()
  if (!trimmed) return projects
  return projects.filter(
    (p) =>
      fuzzyMatch(trimmed, p.codigo) ||
      fuzzyMatch(trimmed, p.nome) ||
      fuzzyMatch(trimmed, p.cliente?.nome) ||
      fuzzyMatch(trimmed, p.cliente?.email) ||
      fuzzyMatch(trimmed, p.cliente?.nome_empresa) ||
      fuzzyMatch(trimmed, p.cliente?.razao_social) ||
      fuzzyMatch(trimmed, p.arquiteto?.nome) ||
      fuzzyMatch(trimmed, p.arquiteto?.email) ||
      fuzzyMatch(trimmed, p.arquiteto?.nome_empresa),
  )
}

export async function fetchProjectsForFinancialApproval(): Promise<
  ProjectForApproval[]
> {
  const { data, error } = await supabase
    .from('projetos')
    .select(PROJECT_SELECT)
    .eq('status', 'Aprovação Financeira')
    .order('data_entrada', { ascending: false, nullsFirst: false })

  if (error) throw error
  return (data || []) as ProjectForApproval[]
}

export async function fetchProjectFinancialDetails(
  projectId: string,
): Promise<ProjectFinancialDetail> {
  if (!isValidUUID(projectId)) throw new Error('ID do projeto inválido.')

  const { data: project, error: projectError } = await supabase
    .from('projetos')
    .select(PROJECT_SELECT)
    .eq('id', projectId)
    .single()

  if (projectError) throw projectError

  const { data: orcamentos, error: orcError } = await supabase
    .from('orcamentos')
    .select(
      `
      id,
      numero,
      valor_total,
      status,
      condicoes_pagamento,
      forma_pagamento,
      orcamento_itens(id, descricao, quantidade, preco_unitario, desconto, custom_id, ordem, peca_nova)
      `,
    )
    .eq('projeto_id', projectId)
    .order('created_at', { ascending: false })

  if (orcError) throw orcError

  return {
    ...(project as ProjectForApproval),
    orcamentos: (orcamentos || []) as OrcamentoDetail[],
  }
}

export async function approveProjectFinancial(
  projectId: string,
): Promise<ApprovalResult> {
  if (!isValidUUID(projectId)) throw new Error('ID do projeto inválido.')

  const { data, error } = await supabase.rpc('aprovar_projeto_financeiro', {
    p_project_id: projectId,
  })

  if (error)
    throw new Error(error.message || 'Erro ao aprovar projeto financeiramente.')
  if (!data) throw new Error('Resposta vazia do servidor ao aprovar projeto.')

  return data as ApprovalResult
}
