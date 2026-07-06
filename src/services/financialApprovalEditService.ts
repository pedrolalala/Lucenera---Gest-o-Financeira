import { supabase } from '@/lib/supabase/client'
import { ProjectFinancialDetail } from '@/services/projectFinancialApprovalService'
import { formatCircuitId } from '@/lib/utils'

export interface ProdutoInfo {
  codigo_produto: number | null
  referencia: string | null
  nome: string | null
}

export interface EditableProjectData {
  valor_total: number
  nivel_estrategico: string
  cidade: string
  estado: string
}

export interface EditableItemData {
  id: string
  produto_id?: string | null
  descricao: string | null
  quantidade: number
  preco_unitario: number
  desconto: number | null
  custom_id: string | null
  ordem: number | null
  peca_nova: boolean
  produto_info?: ProdutoInfo | null
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
  const { data, error } = await supabase
    .from('projetos')
    .select(
      `
      id, codigo, nome, status, cidade, estado, data_entrada, valor_total, nivel_estrategico,
      cliente:contatos!projetos_cliente_id_fkey(nome, email, nome_empresa, razao_social),
      arquiteto:contatos!projetos_arquiteto_id_fkey(nome, email, nome_empresa, razao_social),
      orcamentos(
        id, numero, valor_total, status, condicoes_pagamento, forma_pagamento,
        orcamento_itens(
          id, produto_id, descricao, quantidade, preco_unitario, desconto,
          custom_id, ordem, peca_nova,
          produto:produtos(codigo_produto, referencia, nome)
        )
      )
    `,
    )
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data as unknown as ProjectFinancialDetail
}

export async function finalizeValidation(
  projectId: string,
  projectData: EditableProjectData,
  orcamentos: EditableOrcamentoData[],
): Promise<FinalizeResult> {
  const { data: project } = await supabase
    .from('projetos')
    .select('status')
    .eq('id', projectId)
    .single()

  const statusAnterior = project?.status || ''

  const { error: projUpdateError } = await supabase
    .from('projetos')
    .update({
      valor_total: projectData.valor_total,
      nivel_estrategico: projectData.nivel_estrategico,
      cidade: projectData.cidade,
      estado: projectData.estado,
    })
    .eq('id', projectId)

  if (projUpdateError) throw projUpdateError

  for (const orc of orcamentos) {
    const valorTotal = orc.itens.reduce(
      (s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0),
      0,
    )

    await supabase
      .from('orcamentos')
      .update({
        forma_pagamento: orc.forma_pagamento,
        valor_total: valorTotal,
      })
      .eq('id', orc.id)

    for (const item of orc.itens) {
      await supabase
        .from('orcamento_itens')
        .update({
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto,
          custom_id: item.custom_id ? formatCircuitId(item.custom_id) : null,
          descricao: item.descricao,
          peca_nova: item.peca_nova,
        })
        .eq('id', item.id)
    }
  }

  return {
    success: true,
    project_id: projectId,
    status_anterior: statusAnterior,
    status_novo: 'Orçamento Aprovado',
  }
}
