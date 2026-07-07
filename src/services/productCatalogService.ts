import { supabase } from '@/lib/supabase/client'

export interface ProductOption {
  id: string
  nome: string
}

export interface SupplierOption {
  id: string
  nome: string
  razao_social: string | null
}

export interface ProductCatalogPayload {
  codigo_produto: number
  sku?: string | null
  nome: string
  marca_id: string
  categoria_id: string
  fornecedor_principal_id?: string | null
  unidade: string
  referencia?: string | null
  descricao_tecnica?: string | null
  preco_custo: number
  preco_venda: number
  valor_venda: number
  ncm?: string | null
  tipo_fiscal?: string | null
  cst?: string | null
  cest?: string | null
  status_comercial?: string | null
  porc_frete?: number
  porc_despesas?: number
  porc_bdi?: number
  porc_st?: number
  margem_lucro?: number
  custo_total?: number
  icms_entrada?: number
  ipi_entrada?: number
  mascara_produto?: string | null
}

export interface ProductCatalogItem extends ProductCatalogPayload {
  id: string
  ativo: boolean
  source?: 'produtos'
}

export async function getProductCatalogOptions() {
  const [brandRes, categoryRes, supplierRes] = await Promise.all([
    supabase.from('marcas').select('id, nome').eq('ativo', true).order('nome'),
    supabase
      .from('categorias_produto')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('contatos')
      .select('id, nome, razao_social')
      .eq('tipo', 'fornecedor')
      .order('nome'),
  ])

  if (brandRes.error) throw brandRes.error
  if (categoryRes.error) throw categoryRes.error
  if (supplierRes.error) throw supplierRes.error

  return {
    marcas: (brandRes.data || []) as ProductOption[],
    categorias: (categoryRes.data || []) as ProductOption[],
    fornecedores: (supplierRes.data || []) as SupplierOption[],
  }
}

export async function getNextProductSku(prefix = 'teste') {
  try {
    const { data, error } = await (supabase.rpc as any)('get_next_sku', {
      prefix,
    })
    if (!error && data) return data as string
  } catch (error) {
    console.warn('RPC get_next_sku failed, using local fallback', error)
  }

  const { data, error } = await supabase
    .from('produtos')
    .select('sku')
    .like('sku', `${prefix}%`)

  if (error) throw error

  let maxNum = 0
  for (const row of data || []) {
    if (!row.sku) continue
    const numStr = row.sku.substring(prefix.length).replace(/[^0-9]/g, '')
    const num = parseInt(numStr, 10)
    if (!isNaN(num) && num > maxNum) maxNum = num
  }

  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`
}

export async function createProductFromBudget(
  payload: ProductCatalogPayload,
): Promise<ProductCatalogItem> {
  const { data, error } = await (supabase as any).rpc(
    'criar_produto_orcamento',
    {
      p_payload: payload,
    },
  )

  if (error) {
    throw new Error(error.message || 'Erro ao criar produto no catálogo.')
  }
  if (!data?.id) {
    throw new Error('Produto criado sem identificador retornado pelo servidor.')
  }

  return { ...(data as ProductCatalogItem), source: 'produtos' }
}
