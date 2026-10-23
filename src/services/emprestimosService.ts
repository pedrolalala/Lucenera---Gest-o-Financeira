/**
 * SPEC-223: orçamento de empréstimo (Tipo de Operação Outros → EMPRESTIMO). Mesmo empréstimo da
 * SPEC-219 (tabelas showroom_emprestimo*, número EMP-, termo, fotos, devolução) — aqui pelo usuário
 * logado, via RPCs emprestimo_* (as tabelas não têm grant). Estoque não muda; o que o cliente ficar
 * vira um orçamento de venda novo.
 */
import { supabase } from '@/lib/supabase/client'
import { compactarFoto } from '@/lib/foto-compacta'

// Bucket PRIVADO: envio e leitura só com liberação temporária por RPC.
const BUCKET_FOTOS = 'showroom-emprestimos'

const rpc = (nome: string, args: Record<string, unknown>) => (supabase as any).rpc(nome, args)

export type StatusEmprestimo =
  | 'em_aberto'
  | 'atrasado'
  | 'devolvido'
  | 'devolvido_com_dano'
  | 'virou_venda'
  | 'parcial'
  | 'cancelado'

export type SituacaoItem = 'emprestado' | 'devolvido' | 'devolvido_com_dano' | 'convertido_venda'

export const ROTULO_STATUS: Record<StatusEmprestimo, string> = {
  em_aberto: 'Em aberto',
  atrasado: 'Atrasado',
  devolvido: 'Devolvido',
  devolvido_com_dano: 'Devolvido com dano',
  virou_venda: 'Virou venda',
  parcial: 'Parcial: venda + devolução',
  cancelado: 'Cancelado',
}

export const ROTULO_SITUACAO: Record<SituacaoItem, string> = {
  emprestado: 'Com o cliente',
  devolvido: 'Devolvida',
  devolvido_com_dano: 'Devolvida com dano',
  convertido_venda: 'Virou venda',
}

export function numeroEmprestimo(n: number): string {
  return `EMP-${String(n).padStart(4, '0')}`
}

export interface EmprestimoResumo {
  id: string
  numero: number
  empresa_nome: string
  cliente_nome: string
  data_emprestimo: string
  data_prevista_devolucao: string
  status: StatusEmprestimo
  qtd_pecas: number
  qtd_pecas_em_aberto: number
  valor_total: number
  valor_dano: number
  fotos_saida: number
  criado_em: string
  origem: 'showroom' | 'orcamento'
  orcamento_id: string | null
  orcamento_numero: string | null
}

export type MomentoFoto = 'saida' | 'devolucao'

export interface FotoEmprestimo {
  id: string
  item_id: string | null
  momento: MomentoFoto
  path: string
  criado_em: string
  /** link temporário (10 min) */
  url: string | null
}

export interface ClienteSnapshot {
  nome: string
  razao_social: string | null
  cpf_cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
}

export interface EmpresaTermo {
  id: string
  nome: string
  razao_social: string | null
  cnpj: string | null
  inscricao_estadual: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
}

export interface ItemEmprestimo {
  id: string
  produto_id: string
  codigo_produto: number
  nome: string
  referencia: string | null
  quantidade: number
  valor_unitario: number
  situacao: SituacaoItem
  data_devolucao: string | null
  descricao_dano: string | null
  valor_dano: number | null
  devolvido_registrado_por: string | null
  orcamento_venda_id: string | null
  orcamento_venda_numero: string | null
}

export interface EmprestimoDetalhe {
  id: string
  numero: number
  status: StatusEmprestimo
  origem: 'showroom' | 'orcamento'
  orcamento_id: string | null
  orcamento_numero: string | null
  projeto_codigo: string | null
  data_emprestimo: string
  data_prevista_devolucao: string
  observacoes: string | null
  cancelado_em: string | null
  cancelado_motivo: string | null
  criado_por: string | null
  criado_em: string
  cliente: ClienteSnapshot
  empresa: EmpresaTermo
  itens: ItemEmprestimo[]
}

export interface EmAbertoPorProduto {
  produto_id: string
  quantidade_em_aberto: number
  estoque_geral: number
  estoque_showroom: number
  emprestimos: { numero: number; cliente: string; quantidade: number; devolver_ate: string }[]
}

function normalizar(d: EmprestimoDetalhe): EmprestimoDetalhe {
  return {
    ...d,
    itens: d.itens.map((i) => ({
      ...i,
      valor_unitario: Number(i.valor_unitario) || 0,
      valor_dano: i.valor_dano == null ? null : Number(i.valor_dano),
    })),
  }
}

export async function confirmarEmprestimo(orcamentoId: string): Promise<{ id: string; numero: number }> {
  const { data, error } = await rpc('emprestimo_confirmar_orcamento', { p_orcamento_id: orcamentoId })
  if (error) throw new Error(error.message)
  return data as { id: string; numero: number }
}

/** Empréstimo do orçamento (null enquanto não confirmado). */
export async function emprestimoDoOrcamento(orcamentoId: string): Promise<EmprestimoDetalhe | null> {
  const { data, error } = await rpc('emprestimo_do_orcamento', { p_orcamento_id: orcamentoId })
  if (error) throw new Error(error.message)
  return data ? normalizar(data as EmprestimoDetalhe) : null
}

export async function obterEmprestimo(id: string): Promise<EmprestimoDetalhe> {
  const { data, error } = await rpc('emprestimo_obter', { p_id: id })
  if (error) throw new Error(error.message)
  return normalizar(data as EmprestimoDetalhe)
}

export async function listarEmprestimos(status: StatusEmprestimo | null, termo: string): Promise<EmprestimoResumo[]> {
  const { data, error } = await rpc('emprestimo_listar', { p_status: status, p_termo: termo.trim() || null })
  if (error) throw new Error(error.message)
  return ((data ?? []) as EmprestimoResumo[]).map((r) => ({
    ...r,
    valor_total: Number(r.valor_total) || 0,
    valor_dano: Number(r.valor_dano) || 0,
  }))
}

export async function emAbertoPorProduto(produtoIds: string[]): Promise<EmAbertoPorProduto[]> {
  if (produtoIds.length === 0) return []
  const { data, error } = await rpc('emprestimo_em_aberto_por_produto', { p_produto_ids: produtoIds })
  if (error) throw new Error(error.message)
  return ((data ?? []) as EmAbertoPorProduto[]).map((r) => ({ ...r, estoque_geral: Number(r.estoque_geral) || 0 }))
}

/** Libera, compacta e sobe as fotos; devolve os paths já no servidor (ainda não gravados). */
async function enviarFotos(
  emprestimoId: string,
  momento: MomentoFoto,
  itemId: string | null,
  arquivos: File[],
): Promise<string[]> {
  const blobs = await Promise.all(arquivos.map(compactarFoto))
  const { data, error } = await rpc('emprestimo_liberar_fotos', {
    p_emprestimo_id: emprestimoId,
    p_momento: momento,
    p_item_id: itemId,
    p_extensoes: blobs.map(() => 'jpg'),
  })
  if (error) throw new Error(error.message)
  const paths = data as string[]
  for (let i = 0; i < paths.length; i++) {
    const { error: up } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(paths[i], blobs[i], { contentType: 'image/jpeg', upsert: false })
    if (up) throw new Error(`Falha ao enviar a foto ${i + 1}: ${up.message}`)
  }
  return paths
}

export async function adicionarFotosSaida(emprestimoId: string, arquivos: File[]): Promise<void> {
  const paths = await enviarFotos(emprestimoId, 'saida', null, arquivos)
  const { error } = await rpc('emprestimo_confirmar_fotos_saida', { p_emprestimo_id: emprestimoId, p_paths: paths })
  if (error) throw new Error(error.message)
}

export async function listarFotos(emprestimoId: string): Promise<FotoEmprestimo[]> {
  const { data, error } = await rpc('emprestimo_liberar_leitura_fotos', { p_emprestimo_id: emprestimoId })
  if (error) throw new Error(error.message)
  const fotos = (data ?? []) as Omit<FotoEmprestimo, 'url'>[]
  if (fotos.length === 0) return []
  const { data: urls } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(
    fotos.map((f) => f.path),
    600,
  )
  const porPath = new Map((urls ?? []).map((u) => [u.path, u.signedUrl]))
  return fotos.map((f) => ({ ...f, url: porPath.get(f.path) ?? null }))
}

/** Devolução de uma peça (ou parte dela): exige pelo menos 1 foto de como voltou. */
export async function registrarDevolucao(
  emprestimoId: string,
  itemId: string,
  quantidade: number,
  fotos: File[],
  comDano: boolean,
  descricaoDano?: string,
  valorDano?: number | null,
): Promise<void> {
  if (fotos.length === 0) throw new Error('Tire pelo menos 1 foto de como a peça voltou.')
  const paths = await enviarFotos(emprestimoId, 'devolucao', itemId, fotos)
  const { error } = await rpc('emprestimo_registrar_devolucao', {
    p_item_id: itemId,
    p_quantidade: quantidade,
    p_com_dano: comDano,
    p_descricao_dano: comDano ? (descricaoDano ?? '').trim() : null,
    p_valor_dano: comDano ? (valorDano ?? null) : null,
    p_fotos: paths,
  })
  if (error) throw new Error(error.message)
}

export async function converterEmVenda(
  emprestimoId: string,
  itens: { item_id: string; quantidade: number }[],
): Promise<{ orcamento_id: string; numero: string }> {
  const { data, error } = await rpc('emprestimo_converter_em_venda', { p_emprestimo_id: emprestimoId, p_itens: itens })
  if (error) throw new Error(error.message)
  return data as { orcamento_id: string; numero: string }
}

export async function cancelarEmprestimo(id: string, motivo: string): Promise<void> {
  const { error } = await rpc('emprestimo_cancelar', { p_id: id, p_motivo: motivo.trim() })
  if (error) throw new Error(error.message)
}
