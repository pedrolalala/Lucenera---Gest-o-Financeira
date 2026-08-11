import { useCallback, useRef, useState } from 'react'
import { buscarEnderecoPorCep, type EnderecoCep } from '@/services/cepService'
import { buscarDadosCnpj, type DadosCnpj } from '@/services/cnpjService'

const DEBOUNCE_MS = 300

/**
 * Busca automática de endereço por CEP: debounce de 300ms, loading
 * exposto pra desabilitar o campo enquanto busca, fallback e cache já
 * embutidos no cepService. `onError` recebe uma mensagem amigável (CEP
 * não encontrado ou falha de rede) pra o chamador decidir como exibir
 * (toast, etc.) — nunca lança exceção pro componente.
 */
export function useCepLookup() {
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const buscar = useCallback(
    (
      cep: string,
      onResult: (endereco: EnderecoCep) => void,
      onError: (message: string) => void,
    ) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const digits = (cep || '').replace(/\D/g, '')
      if (digits.length !== 8) return

      timeoutRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const endereco = await buscarEnderecoPorCep(digits)
          if (!endereco) {
            onError('CEP não encontrado. Preencha o endereço manualmente.')
          } else {
            onResult(endereco)
          }
        } catch {
          onError(
            'Não foi possível buscar o CEP. Preencha o endereço manualmente.',
          )
        } finally {
          setLoading(false)
        }
      }, DEBOUNCE_MS)
    },
    [],
  )

  return { buscar, loading }
}

/**
 * Busca automática de dados de empresa por CNPJ — mesmo padrão do
 * useCepLookup (debounce, loading, fallback/cache no cnpjService).
 */
export function useCnpjLookup() {
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const buscar = useCallback(
    (
      cnpj: string,
      onResult: (dados: DadosCnpj) => void,
      onError: (message: string) => void,
    ) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const digits = (cnpj || '').replace(/\D/g, '')
      if (digits.length !== 14) return

      timeoutRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const dados = await buscarDadosCnpj(digits)
          if (!dados) {
            onError('CNPJ não encontrado. Preencha os dados manualmente.')
          } else {
            onResult(dados)
          }
        } catch {
          onError(
            'Não foi possível buscar o CNPJ. Preencha os dados manualmente.',
          )
        } finally {
          setLoading(false)
        }
      }, DEBOUNCE_MS)
    },
    [],
  )

  return { buscar, loading }
}
