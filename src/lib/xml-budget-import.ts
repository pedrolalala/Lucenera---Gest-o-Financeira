// SPEC-050 — parser client-side do XML no padrão do ERP "Connect"
// (<connect_systems><orcamento>...<itens><Item>...).
//
// Porta simplificada, para o browser (DOMParser, sem dependência nova), da
// extração de campos feita por `OrçamentoParser.parse_xml()` em
// `04-Sistemas/script python power point/data_manager.py`. Não replica a
// lógica de agrupamento/hierarquia de peso daquele script (voltada para
// gerar slides de PowerPoint) — aqui o XML só precisa virar linhas de
// `orcamento_itens`.
//
// Resolução de `empresa_id`/`cliente_id`/`produto_id` é feita contra os
// arrays já carregados por `useOptions()`, sem round-trip novo ao banco.

import { supabase } from '@/lib/supabase/client'
import { formatCircuitId } from '@/lib/utils'

export interface ParsedXmlItem {
  indice: string
  desc_classificacao: string
  custom_id: string
  cod_produto: string
  referencia: string
  desc_produto: string
  quantidade: number
  preco_unitario: number
  desconto: number
  vl_total_produto: number | null
}

export interface ParsedXmlBudget {
  cod_orcamento: number | null
  cod_empresa: number | null
  cnpj_empresa: string
  cod_cliente: number | null
  vl_total_orcamento: number | null
  data_emissao: Date | null
  itens: ParsedXmlItem[]
}

export interface ResolvedXmlItem extends ParsedXmlItem {
  produto_id: string | null
}

export interface ResolvedXmlBudget {
  raw: ParsedXmlBudget
  empresa_id: string | null
  empresa_nome: string | null
  cliente_id: string | null
  cliente_nome: string | null
  itens: ResolvedXmlItem[]
  itensCasados: number
  itensAvulsos: number
}

/**
 * Converte um decimal no formato Connect (vírgula, ex. "212,454") para
 * number. Retorna `null` para texto vazio/ausente.
 */
function parseDecimalBR(text: string): number | null {
  if (!text) return null
  const normalized = text.trim().replace(',', '.')
  if (!normalized) return null
  const value = parseFloat(normalized)
  return Number.isNaN(value) ? null : value
}

function parseIntBR(text: string): number | null {
  if (!text) return null
  const value = parseInt(text.trim(), 10)
  return Number.isNaN(value) ? null : value
}

/** Converte "dd/mm/aaaa" para Date. Retorna null se o formato não bater. */
function parseDateBR(text: string): Date | null {
  const match = (text || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Busca o texto de um elemento filho direto (equivalente a Element.find do ElementTree). */
function childText(el: Element, tag: string): string {
  const child = Array.from(el.children).find((c) => c.tagName === tag)
  return child?.textContent?.trim() || ''
}

export const MAX_XML_FILE_SIZE = 5 * 1024 * 1024

export function validateXmlFile(file: File): string | null {
  const isXml =
    file.type === 'text/xml' ||
    file.type === 'application/xml' ||
    file.name.toLowerCase().endsWith('.xml')
  if (!isXml) return 'Não é um arquivo XML válido.'
  if (file.size > MAX_XML_FILE_SIZE) return 'Arquivo muito grande (máx 5MB).'
  return null
}

/**
 * Parse do XML no formato Connect. Não depende da tag raiz
 * (`connect_systems` no Connect, `Laghi_systems` no que o Lucenera exporta) —
 * só do elemento `<orcamento>` e dos `<Item>` dentro dele, mesmo critério
 * usado por `OrçamentoParser.parse_xml()` (`root.findall(".//Item")`).
 */
export function parseConnectXml(xmlText: string): ParsedXmlBudget {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  const parserError = doc.getElementsByTagName('parsererror')[0]
  if (parserError) {
    throw new Error('Arquivo XML inválido ou corrompido.')
  }

  const orcamentoEl = doc.querySelector('orcamento')
  if (!orcamentoEl) {
    throw new Error(
      'XML não contém um elemento <orcamento>. Verifique se é um XML no formato Connect.',
    )
  }

  const itemEls = Array.from(orcamentoEl.querySelectorAll('Item'))
  if (itemEls.length === 0) {
    throw new Error('XML não contém nenhum item (<Item>).')
  }

  const itens: ParsedXmlItem[] = itemEls.map((itemEl) => {
    const desc_classificacao = childText(itemEl, 'desc_classificacao')
    const qtyRaw = parseDecimalBR(childText(itemEl, 'qtd_produto')) ?? 1
    const precoRaw = parseDecimalBR(childText(itemEl, 'vl_unitario')) ?? 0
    const descontoRaw =
      parseDecimalBR(childText(itemEl, 'desconto_produto')) ?? 0

    return {
      indice: childText(itemEl, 'indice'),
      desc_classificacao,
      // "L Fixo" — a letra do XML é preservada (P, L, etc.), como no parser
      // Python de referência.
      custom_id: formatCircuitId(desc_classificacao),
      cod_produto: childText(itemEl, 'cod_produto'),
      referencia: childText(itemEl, 'referencia'),
      desc_produto: childText(itemEl, 'desc_produto'),
      // orcamento_itens.quantidade é numeric(10,3) — o XML traz itens
      // fracionários reais (ex. metro linear de perfil: "4,5", "2,5").
      // Nunca arredondar para inteiro, senão infla/reduz quantidade
      // silenciosamente (achado crítico da revisão da SPEC-050).
      quantidade: Math.max(0.001, Math.round(qtyRaw * 1000) / 1000),
      // orcamento_itens.preco_unitario é numeric(12,2); o XML pode trazer até
      // 3 casas decimais (ex. "212,454") — arredonda para 2 casas (P-4).
      preco_unitario: Math.round(precoRaw * 100) / 100,
      // orcamento_itens.desconto é numeric(12,2) — mesma regra do preço.
      desconto: Math.round(descontoRaw * 100) / 100,
      vl_total_produto: parseDecimalBR(childText(itemEl, 'vl_total_produto')),
    }
  })

  return {
    cod_orcamento: parseIntBR(childText(orcamentoEl, 'cod_orcamento')),
    cod_empresa: parseIntBR(childText(orcamentoEl, 'cod_empresa')),
    cnpj_empresa: childText(orcamentoEl, 'cnpj_empresa'),
    cod_cliente: parseIntBR(childText(orcamentoEl, 'cod_cliente')),
    vl_total_orcamento: parseDecimalBR(
      childText(orcamentoEl, 'vl_total_orcamento'),
    ),
    data_emissao: parseDateBR(childText(orcamentoEl, 'dt_orcamento')),
    // dt_devolucao (P-3): ignorado, não mapeia para nenhum campo Lucenera.
    itens,
  }
}

function resolveEmpresa(
  parsed: ParsedXmlBudget,
  empresas: any[],
): { id: string | null; nome: string | null } {
  const cnpjNormalizado = (parsed.cnpj_empresa || '').replace(/\D/g, '')
  if (cnpjNormalizado) {
    const found = empresas.find(
      (e) => (e.cnpj || '').replace(/\D/g, '') === cnpjNormalizado,
    )
    if (found) return { id: found.id, nome: found.nome }
  }
  if (parsed.cod_empresa != null) {
    const found = empresas.find((e) => Number(e.codigo) === parsed.cod_empresa)
    if (found) return { id: found.id, nome: found.nome }
  }
  return { id: null, nome: null }
}

function resolveCliente(
  parsed: ParsedXmlBudget,
  clientes: any[],
): { id: string | null; nome: string | null } {
  if (parsed.cod_cliente == null) return { id: null, nome: null }
  const found = clientes.find(
    (c) => Number(c.codigo_legado) === parsed.cod_cliente,
  )
  if (!found) return { id: null, nome: null }
  return {
    id: found.id,
    nome: (found as any).razao_social?.trim() || found.nome,
  }
}

function resolveProdutoId(item: ParsedXmlItem, produtos: any[]): string | null {
  const codProduto = item.cod_produto ? Number(item.cod_produto) : null
  if (codProduto != null && !Number.isNaN(codProduto)) {
    const found = produtos.find(
      (p) => p.source === 'produtos' && p.codigo_produto === codProduto,
    )
    if (found) return found.id
  }
  const referencia = (item.referencia || '').trim().toLowerCase()
  if (referencia) {
    const found = produtos.find(
      (p) =>
        p.source === 'produtos' &&
        (p.referencia || '').trim().toLowerCase() === referencia,
    )
    if (found) return found.id
  }
  return null
}

/**
 * Resolve empresa/cliente/produto do XML já parseado contra os arrays
 * carregados por `useOptions()`. Produto sem match vira item "avulso" (P-1);
 * cliente sem match fica com `cliente_id: null` para o chamador decidir abrir
 * o `ClientCreateModal` (P-2).
 */
export function resolveConnectXmlImport(
  parsed: ParsedXmlBudget,
  options: { empresas: any[]; clientes: any[]; produtos: any[] },
): ResolvedXmlBudget {
  const empresa = resolveEmpresa(parsed, options.empresas)
  const cliente = resolveCliente(parsed, options.clientes)

  const itens: ResolvedXmlItem[] = parsed.itens.map((item) => ({
    ...item,
    produto_id: resolveProdutoId(item, options.produtos),
  }))

  const itensCasados = itens.filter((i) => i.produto_id).length

  return {
    raw: parsed,
    empresa_id: empresa.id,
    empresa_nome: empresa.nome,
    cliente_id: cliente.id,
    cliente_nome: cliente.nome,
    itens,
    itensCasados,
    itensAvulsos: itens.length - itensCasados,
  }
}

/**
 * Idempotência do import (checklist da SPEC-050): consulta pontual para
 * saber se este `cod_orcamento` do Connect já foi importado antes.
 */
export async function findOrcamentoJaImportado(
  codOrcamento: number,
): Promise<{ id: string; numero: string | null } | null> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('id, numero')
    .eq('origem_connect_cod_orcamento', codOrcamento)
    .maybeSingle()

  if (error) {
    // Nunca tratar falha na checagem como "não importado ainda" — isso
    // liberaria o botão de aplicar sem garantia real de idempotência (o
    // índice único no banco ainda protege contra duplicata, mas o usuário
    // veria um erro genérico do Postgres em vez do aviso amigável).
    throw new Error(
      `Não foi possível verificar se este orçamento já foi importado antes: ${error.message}`,
    )
  }

  return data
}
