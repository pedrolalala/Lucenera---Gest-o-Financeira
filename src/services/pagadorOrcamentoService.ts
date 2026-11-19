// SPEC-326: faturar (Contas a Receber) um orçamento no nome de OUTRO pagador.
// Cliente e projeto do orçamento não mudam. A equipe do orçamento define o pagador (fica pendente) e o
// financeiro confirma na Revisão Financeira; sem confirmação a aprovação financeira é barrada no banco.
import { supabase } from '@/lib/supabase/client'

// as colunas pagador_* e as funções novas (migration 391) ainda não estão no types.ts gerado
const db = supabase as any

export interface PagadorOrcamento {
  orcamentoId: string
  status: string
  natureza: string
  clienteId: string | null
  clienteNome: string
  pagadorId: string | null
  pagadorNome: string | null
  motivo: string | null
  definidoPorNome: string | null
  definidoEm: string | null
  confirmadoEm: string | null
}

const nomeDe = (c: any): string | null => {
  const x = Array.isArray(c) ? c[0] : c
  return x?.nome || x?.razao_social || null
}

export async function carregarPagador(orcamentoId: string): Promise<PagadorOrcamento | null> {
  const { data, error } = await db
    .from('orcamentos')
    .select(
      `id, status, natureza_operacao, cliente_id, pagador_id, pagador_motivo, pagador_definido_em, pagador_confirmado_em,
       cliente:contatos!orcamentos_cliente_id_fkey(nome, razao_social),
       pagador:contatos!orcamentos_pagador_id_fkey(nome, razao_social),
       definidor:usuarios!orcamentos_pagador_definido_por_fkey(nome)`,
    )
    .eq('id', orcamentoId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    orcamentoId: data.id,
    status: data.status,
    natureza: data.natureza_operacao || 'venda',
    clienteId: data.cliente_id ?? null,
    clienteNome: nomeDe(data.cliente) || '—',
    pagadorId: data.pagador_id ?? null,
    pagadorNome: nomeDe(data.pagador),
    motivo: data.pagador_motivo ?? null,
    definidoPorNome: (Array.isArray(data.definidor) ? data.definidor[0] : data.definidor)?.nome ?? null,
    definidoEm: data.pagador_definido_em ?? null,
    confirmadoEm: data.pagador_confirmado_em ?? null,
  }
}

/** Define (ou, com pagadorId nulo, remove) o pagador. Equipe do orçamento = fica pendente; financeiro = já confirmado. */
export async function definirPagador(
  orcamentoId: string,
  pagadorId: string | null,
  motivo: string | null,
): Promise<void> {
  const { error } = await db.rpc('orcamento_definir_pagador', {
    p_orcamento: orcamentoId,
    p_pagador: pagadorId,
    p_motivo: motivo,
  })
  if (error) throw new Error(error.message)
}

/** Só o financeiro: confirma o pagador na Revisão Financeira (libera a aprovação). */
export async function confirmarPagador(orcamentoId: string): Promise<void> {
  const { error } = await db.rpc('orcamento_confirmar_pagador', { p_orcamento: orcamentoId })
  if (error) throw new Error(error.message)
}

/** O orçamento tem pagador diferente definido e o financeiro ainda não confirmou? */
export function pagadorPendente(b: { pagador_id?: string | null; pagador_confirmado_em?: string | null } | null | undefined): boolean {
  return !!b?.pagador_id && !b?.pagador_confirmado_em
}
