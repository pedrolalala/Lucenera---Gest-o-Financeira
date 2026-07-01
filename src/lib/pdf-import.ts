import { supabase } from '@/lib/supabase/client'

export interface ParsedPdfResult {
  empresa_nome?: string | null
  cliente_nome?: string | null
  arquiteto_nome?: string | null
  vendedor_nome?: string | null
  status?: string | null
  forma_pagamento?: string | null
  desconto_global?: number | null
  observacoes?: string | null
  condicoes_pagamento?: string | null
  itens?: Array<{
    custom_id?: string
    descricao?: string
    quantidade?: number
    preco_unitario?: number
    desconto?: number
  }>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

export function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf') return 'Não é um PDF válido.'
  if (file.size > MAX_FILE_SIZE) return 'Arquivo muito grande (máx 10MB).'
  return null
}

export function readFileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
  })
}

export async function parseSinglePdf(file: File): Promise<ParsedPdfResult> {
  const base64 = await readFileBase64(file)
  const { data, error } = await supabase.functions.invoke('parse-budget-pdf', {
    body: { pdfBase64: base64 },
  })

  if (error) {
    let msg = error.message || 'Erro ao processar PDF'
    try {
      const ctx = (error as any).context
      if (ctx && typeof ctx.json === 'function') {
        const errData = await ctx.json()
        if (errData?.error) msg = errData.error
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'error' in error
      ) {
        msg = (error as any).error
      }
    } catch {
      /* fallback */
    }
    throw new Error(msg)
  }

  if (!data || data.error) {
    throw new Error(data?.error || 'Retorno inválido do servidor')
  }

  return data as ParsedPdfResult
}
