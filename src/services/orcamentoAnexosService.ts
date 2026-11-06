import { supabase } from '@/lib/supabase/client'

// SPEC-254: comprovante (Pix, depósito) anexado na aprovação da equipe e visto na revisão financeira.
// Bucket PRIVADO "orcamento-anexos" (caminho <orcamento_id>/<arquivo>), aberto só por URL assinada (AGENTS.md, regra 10).
// A tabela orcamento_anexos ainda não está no types.ts gerado: acesso por `as any`, como o resto dos serviços novos.

export const BUCKET_ANEXOS = 'orcamento-anexos'
export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024
export const TIPOS_ANEXO = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export interface OrcamentoAnexo {
  id: string
  orcamentoId: string
  categoria: string
  nomeArquivo: string
  caminho: string
  tipoMime: string | null
  tamanhoBytes: number | null
  criadoPor: string
  criadoEm: string
}

const db = supabase as any

const mapear = (r: any): OrcamentoAnexo => ({
  id: r.id,
  orcamentoId: r.orcamento_id,
  categoria: r.categoria,
  nomeArquivo: r.nome_arquivo,
  caminho: r.caminho,
  tipoMime: r.tipo_mime ?? null,
  tamanhoBytes: r.tamanho_bytes != null ? Number(r.tamanho_bytes) : null,
  criadoPor: r.criado_por,
  criadoEm: r.criado_em,
})

/** Mensagem de erro se o arquivo não pode ser anexado; null se está ok. */
export function validarAnexo(arquivo: File): string | null {
  if (!TIPOS_ANEXO.includes(arquivo.type)) {
    return `"${arquivo.name}": só PDF ou imagem (PNG, JPG, WEBP).`
  }
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
    return `"${arquivo.name}" passa de 10 MB.`
  }
  return null
}

const nomeSeguro = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .slice(-80)

export async function anexarArquivos(
  orcamentoId: string,
  arquivos: File[],
  categoria: 'comprovante' | 'outro' = 'comprovante',
): Promise<void> {
  const enviados: string[] = []
  try {
    for (const arquivo of arquivos) {
      const erro = validarAnexo(arquivo)
      if (erro) throw new Error(erro)
      const caminho = `${orcamentoId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`
      const { error: upError } = await supabase.storage
        .from(BUCKET_ANEXOS)
        .upload(caminho, arquivo, { contentType: arquivo.type })
      if (upError) throw new Error(`Não consegui enviar "${arquivo.name}": ${upError.message}`)
      enviados.push(caminho)
      const { error: insError } = await db.from('orcamento_anexos').insert({
        orcamento_id: orcamentoId,
        categoria,
        nome_arquivo: arquivo.name,
        caminho,
        tipo_mime: arquivo.type,
        tamanho_bytes: arquivo.size,
      })
      if (insError) throw new Error(`Não consegui registrar "${arquivo.name}": ${insError.message}`)
    }
  } catch (err) {
    // desfaz os arquivos já enviados nesta rodada para não deixar lixo no bucket
    if (enviados.length > 0) await supabase.storage.from(BUCKET_ANEXOS).remove(enviados)
    throw err
  }
}

export async function listarAnexos(orcamentoId: string): Promise<OrcamentoAnexo[]> {
  const { data, error } = await db
    .from('orcamento_anexos')
    .select('*')
    .eq('orcamento_id', orcamentoId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return (data || []).map(mapear)
}

/** Quais orçamentos da lista têm anexo (para o clipe na fila da revisão financeira). */
export async function orcamentosComAnexo(orcamentoIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(orcamentoIds.filter(Boolean))]
  const com = new Set<string>()
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db
      .from('orcamento_anexos')
      .select('orcamento_id')
      .in('orcamento_id', ids.slice(i, i + 100))
    if (error) throw error
    for (const r of data || []) com.add(r.orcamento_id)
  }
  return com
}

export async function urlAssinadaAnexo(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_ANEXOS).createSignedUrl(caminho, 300)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Não consegui abrir o arquivo.')
  return data.signedUrl
}
