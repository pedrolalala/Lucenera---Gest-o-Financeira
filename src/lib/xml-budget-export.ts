// SPEC-050 — serializador client-side que exporta um orçamento do Lucenera
// para o mesmo formato de XML usado pelo ERP "Connect", mas com a tag raiz
// trocada de `connect_systems` para `Laghi_systems` (decisão explícita do
// usuário, para identificar a origem do documento).
//
// A estrutura interna das tags de item é replicada 1:1 com o que
// `xml-budget-import.ts`/o parser Python de referência esperam ler,
// inclusive tags sem dado real no Lucenera (exportadas vazias/zero, mesmo
// padrão observado nos XMLs reais do Connect — ex. `cod_tabela_preco`
// frequentemente vazio).

export interface ExportXmlItem {
  custom_id?: string | null
  produto_id?: string | null
  descricao?: string | null
  quantidade: number
  preco_unitario: number
  desconto: number
}

export interface ExportProdutoMeta {
  codigo_produto: number | null
  referencia: string | null
  nome: string | null
}

export interface ExportBudgetHeader {
  /** orcamentos.numero (ex. "ORC-0010") — usado como <cod_orcamento> (P-6). */
  numero: string | null
  empresaCodigo: number | null
  empresaCnpj: string | null
  /** contatos.codigo_legado do cliente selecionado, se houver. */
  clienteCodigoLegado: number | null
  dataEmissao: Date | string | null
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Formata number no padrão decimal do Connect (vírgula, 2 casas). */
function formatDecimalBR(value: number): string {
  return (Number(value) || 0).toFixed(2).replace('.', ',')
}

function formatDateBR(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function computeItemSubtotal(item: ExportXmlItem): number {
  const q = Number(item.quantidade) || 0
  const p = Number(item.preco_unitario) || 0
  // orcamento_itens.desconto é numeric(12,2) — não arredondar para inteiro
  // (mesmo achado crítico do import, SPEC-050).
  const d = Math.round((Number(item.desconto) || 0) * 100) / 100
  return q * p * (1 - d / 100)
}

function buildItemXml(
  item: ExportXmlItem,
  index: number,
  getProdutoMeta: (
    produtoId: string | null | undefined,
  ) => ExportProdutoMeta | null,
): string {
  const meta = getProdutoMeta(item.produto_id)
  // Diferente do import de PDF (que zera a descrição quando o produto foi
  // casado), a exportação de XML sempre preserva um texto de
  // <desc_produto> — usa a descrição em tela se houver, senão o nome do
  // produto casado.
  const descProduto = item.descricao?.trim() || meta?.nome || ''
  const subtotal = computeItemSubtotal(item)

  return (
    '<Item>' +
    `<indice>${index + 1}</indice>` +
    `<desc_classificacao>${escapeXml(item.custom_id || '')}</desc_classificacao>` +
    `<cod_produto>${meta?.codigo_produto ?? ''}</cod_produto>` +
    `<referencia>${escapeXml(meta?.referencia || '')}</referencia>` +
    `<cod_setor></cod_setor>` +
    `<cod_produto_grade>0</cod_produto_grade>` +
    `<desc_produto>${escapeXml(descProduto)}</desc_produto>` +
    `<qtd_produto>${Number(item.quantidade) || 0}</qtd_produto>` +
    `<vl_unitario>${formatDecimalBR(item.preco_unitario)}</vl_unitario>` +
    `<desconto_produto>${formatDecimalBR(Number(item.desconto) || 0)}</desconto_produto>` +
    `<vl_total_produto>${formatDecimalBR(subtotal)}</vl_total_produto>` +
    `<vl_tributos>0</vl_tributos>` +
    `<vl_item_aux>0</vl_item_aux>` +
    `<desc_marca></desc_marca>` +
    `<especificacao></especificacao>` +
    `<historico_orcamento></historico_orcamento>` +
    `<saida>0</saida>` +
    `<dev_haver>0</dev_haver>` +
    `<dev_troca>0</dev_troca>` +
    `<dev_defeito>0</dev_defeito>` +
    '</Item>'
  )
}

/**
 * Monta o XML de exportação a partir do estado atual do orçamento em tela
 * (P-5: reflete edições não salvas, não força salvar antes de exportar).
 */
export function buildConnectXmlExport(
  header: ExportBudgetHeader,
  itens: ExportXmlItem[],
  getProdutoMeta: (
    produtoId: string | null | undefined,
  ) => ExportProdutoMeta | null,
): string {
  const valorTotal = itens.reduce(
    (acc, item) => acc + computeItemSubtotal(item),
    0,
  )

  const dataEmissaoDate =
    header.dataEmissao instanceof Date
      ? header.dataEmissao
      : header.dataEmissao
        ? new Date(header.dataEmissao)
        : null

  const itemsXml = itens
    .map((item, idx) => buildItemXml(item, idx, getProdutoMeta))
    .join('')

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Laghi_systems><orcamento>' +
    `<cod_orcamento>${escapeXml(header.numero || '')}</cod_orcamento>` +
    `<cod_empresa>${header.empresaCodigo ?? ''}</cod_empresa>` +
    `<cnpj_empresa>${escapeXml(header.empresaCnpj || '')}</cnpj_empresa>` +
    `<cod_cliente>${header.clienteCodigoLegado ?? ''}</cod_cliente>` +
    `<cod_tabela_preco></cod_tabela_preco>` +
    `<vl_total_orcamento>${formatDecimalBR(valorTotal)}</vl_total_orcamento>` +
    `<dt_orcamento>${dataEmissaoDate ? formatDateBR(dataEmissaoDate) : ''}</dt_orcamento>` +
    `<dt_devolucao></dt_devolucao>` +
    `<itens>${itemsXml}</itens>` +
    '</orcamento></Laghi_systems>'
  )
}

/** Dispara o download do XML gerado no navegador, sem Edge Function. */
export function downloadXmlFile(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
