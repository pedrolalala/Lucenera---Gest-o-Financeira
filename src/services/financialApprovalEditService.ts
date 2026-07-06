import { supabase } from '@/lib/supabase/client'
import { isValidUUID } from '@/lib/uuid'
import {
  fetchProjectFinancialDetails,
  ProjectFinancialDetail,
} from '@/services/projectFinancialApprovalService'

export interface EditableProjectData {
  valor_total: number
  nivel_estrategico: string
  cidade: string
  estado: string
}

export interface EditableItemData {
  id: string
  descricao: string | null
  quantidade: number
  preco_unitario: number
  desconto: number | null
  custom_id: string | null
  ordem: number | null
  peca_nova: boolean
}

export interface EditableOrcamentoData {
  id: string
  numero: string | null
  forma_pagamento: string | null
  valor_total: number
  itens: EditableItemData[]
}

export interface FinalizeResult {
  success: boolean
  project_id: string
  status_anterior: string
  status_novo: string
}

export async function fetchEditableProjectBudget(
  projectId: string,
): Promise<ProjectFinancialDetail> {
  return fetchProjectFinancialDetails(projectId)
}

export async function finalizeValidation(
  projectId: string,
  projectData: EditableProjectData,
  orcamentos: EditableOrcamentoData[],
): Promise<FinalizeResult> {
  if (!isValidUUID(projectId)) {
    throw new Error('ID do projeto inválido.')
  }

  if (!projectData.valor_total || projectData.valor_total <= 0) {
    throw new Error('Valor total do projeto deve ser maior que zero.')
  }

  const { data, error } = await supabase.rpc('finalizar_validacao_financeira', {
    p_project_id: projectId,
    p_project_data: projectData,
    p_orcamentos: orcamentos,
  })

  if (error) {
    throw new Error(error.message || 'Erro ao finalizar validação financeira.')
  }
  if (!data) {
    throw new Error('Resposta vazia do servidor ao finalizar validação.')
  }

  return data as unknown as FinalizeResult
}
