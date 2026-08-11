export interface DadosCnpj {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  porte: string | null
  naturezaJuridica: string | null
  capitalSocial: number | null
  email: string | null
  telefone: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  situacaoCadastral: string | null
  dataSituacaoCadastral: string | null
  cnaeDescricao: string | null
  socios: { nome: string; qualificacao?: string }[]
}

const cache = new Map<string, DadosCnpj | null>()

async function buscarBrasilApiCnpj(digits: string): Promise<DadosCnpj | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('BrasilAPI CNPJ indisponível')
  const data = await response.json()
  return {
    cnpj: digits,
    razaoSocial: data.razao_social || '',
    nomeFantasia: data.nome_fantasia || data.razao_social || '',
    porte: data.porte ?? null,
    naturezaJuridica: data.natureza_juridica ?? null,
    capitalSocial: data.capital_social ?? null,
    email: data.email || null,
    telefone: data.ddd_telefone_1 || null,
    cep: data.cep ? String(data.cep).replace(/\D/g, '') : null,
    logradouro: data.logradouro || null,
    numero: data.numero || null,
    bairro: data.bairro || null,
    cidade: data.municipio || null,
    uf: data.uf || null,
    situacaoCadastral: data.descricao_situacao_cadastral ?? null,
    dataSituacaoCadastral: data.data_situacao_cadastral ?? null,
    cnaeDescricao: data.cnae_fiscal_descricao ?? null,
    socios: Array.isArray(data.qsa)
      ? data.qsa.map((s: any) => ({
          nome: s.nome_socio || s.nome || '',
          qualificacao: s.qualificacao_socio,
        }))
      : [],
  }
}

async function buscarReceitaWsCnpj(digits: string): Promise<DadosCnpj | null> {
  const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${digits}`)
  if (!response.ok) throw new Error('ReceitaWS indisponível')
  const data = await response.json()
  if (data.status === 'ERROR') return null
  return {
    cnpj: digits,
    razaoSocial: data.nome || '',
    nomeFantasia: data.fantasia || data.nome || '',
    porte: data.porte ?? null,
    naturezaJuridica: data.natureza_juridica ?? null,
    capitalSocial: data.capital_social ? Number(data.capital_social) : null,
    email: data.email || null,
    telefone: data.telefone || null,
    cep: data.cep ? data.cep.replace(/\D/g, '') : null,
    logradouro: data.logradouro || null,
    numero: data.numero || null,
    bairro: data.bairro || null,
    cidade: data.municipio || null,
    uf: data.uf || null,
    situacaoCadastral: data.situacao ?? null,
    dataSituacaoCadastral: data.data_situacao ?? null,
    cnaeDescricao: data.atividade_principal?.[0]?.text ?? null,
    socios: Array.isArray(data.qsa)
      ? data.qsa.map((s: any) => ({ nome: s.nome || '', qualificacao: s.qual }))
      : [],
  }
}

/**
 * Busca dados de empresa por CNPJ: BrasilAPI como fonte primária,
 * ReceitaWS como fallback (rede fora do ar ou CNPJ não encontrado numa
 * das duas — ReceitaWS tem limite de 3 req/min, por isso só é usada
 * quando a BrasilAPI falha). Cacheia em memória por CNPJ (14 dígitos).
 */
export async function buscarDadosCnpj(cnpj: string): Promise<DadosCnpj | null> {
  const digits = (cnpj || '').replace(/\D/g, '')
  if (digits.length !== 14) return null

  if (cache.has(digits)) return cache.get(digits)!

  let resultado: DadosCnpj | null = null
  try {
    resultado = await buscarBrasilApiCnpj(digits)
  } catch {
    resultado = null
  }
  if (!resultado) {
    try {
      resultado = await buscarReceitaWsCnpj(digits)
    } catch {
      resultado = null
    }
  }

  cache.set(digits, resultado)
  return resultado
}
