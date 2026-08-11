export interface EnderecoCep {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

const cache = new Map<string, EnderecoCep | null>()

async function buscarViaCep(digits: string): Promise<EnderecoCep | null> {
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  if (!response.ok) throw new Error('ViaCEP indisponível')
  const data = await response.json()
  if (!data || data.erro) return null
  return {
    cep: digits,
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: (data.uf || '').toUpperCase(),
  }
}

async function buscarBrasilApiCep(digits: string): Promise<EnderecoCep | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('BrasilAPI CEP indisponível')
  const data = await response.json()
  return {
    cep: digits,
    logradouro: data.street || '',
    bairro: data.neighborhood || '',
    cidade: data.city || '',
    uf: (data.state || '').toUpperCase(),
  }
}

/**
 * Busca endereço por CEP: ViaCEP como fonte primária, BrasilAPI como
 * fallback (rede fora do ar ou CEP não encontrado numa das duas).
 * Cacheia em memória por CEP (8 dígitos) pra não repetir a mesma consulta
 * na mesma sessão. Retorna null se o CEP não existir em nenhuma das duas.
 */
export async function buscarEnderecoPorCep(
  cep: string,
): Promise<EnderecoCep | null> {
  const digits = (cep || '').replace(/\D/g, '')
  if (digits.length !== 8) return null

  if (cache.has(digits)) return cache.get(digits)!

  let resultado: EnderecoCep | null = null
  try {
    resultado = await buscarViaCep(digits)
  } catch {
    resultado = null
  }
  if (!resultado) {
    try {
      resultado = await buscarBrasilApiCep(digits)
    } catch {
      resultado = null
    }
  }

  cache.set(digits, resultado)
  return resultado
}
