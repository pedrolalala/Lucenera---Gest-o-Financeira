// SPEC-133: resumo financeiro completo pra confirmação de Aprovação
// Financeira (FinancialApprovalDialog) — reproduz a mesma fórmula de
// bruto/sinal/desconto/líquido já usada em BudgetFormPage.tsx (linhas
// ~782-808), extraída aqui pra não duplicar a lógica. Datas de vencimento
// recalculadas a partir de "hoje" (não da data de salvamento do
// orçamento), porque a RPC de aprovação usa current_date no momento da
// aprovação como data-base (mesmo raciocínio documentado na SPEC-133).

export interface ParcelaPrevista {
  numero: number
  valor: number
  dataVencimento: Date
  // SPEC-152: presentes quando a parcela veio de orcamentos.plano_parcelas
  // customizado -- usados pelo PDF do orçamento (generate-report) e pela UI
  // pra sinalizar carteira/permuta em vez de "boleto".
  formaPagamento?: string
  permutaFornecedorId?: string | null
}

export interface ResumoFinanceiro {
  valorBruto: number
  valorSinal: number
  valorAposSinal: number
  descontoValor: number
  valorLiquido: number
  freteValor: number
  valorTotal: number
  parcelas: ParcelaPrevista[]
}

// SPEC-152: item de orcamentos.plano_parcelas (jsonb), quando o orçamento
// usa valor customizado por parcela em vez da divisão igual.
export interface PlanoParcelaItem {
  numero: number
  dias_offset: number
  valor: number
  forma_pagamento?: string | null
  permuta_fornecedor_id?: string | null
}

interface BudgetParaResumo {
  itens?: { quantidade: number; preco_unitario: number; desconto: number }[] | null
  desconto_global: number | null
  desconto_tipo?: string | null
  valor_sinal?: number | null
  frete_tipo: string | null
  frete_valor: number | null
  valor_total: number
  prazo_pagamento_dias: number[] | null
  // SPEC-152: quando presente (array não vazio), substitui a divisão igual
  // abaixo -- mesma fonte que aprovar_orcamento_financeiro usa no banco.
  plano_parcelas?: PlanoParcelaItem[] | null
}

export function calcularResumoFinanceiro(budget: BudgetParaResumo): ResumoFinanceiro {
  const valorBruto = (budget.itens || []).reduce((acc, item) => {
    const q = Number(item.quantidade) || 0
    const p = Number(item.preco_unitario) || 0
    const d = Math.round(Number(item.desconto) || 0) // %
    return acc + q * p * (1 - d / 100)
  }, 0)

  const valorSinal = Number(budget.valor_sinal) || 0
  const valorAposSinal = Math.max(0, valorBruto - valorSinal)

  const descontoGlobalPerc = Number(budget.desconto_global) || 0
  const descontoTipo = budget.desconto_tipo || 'percentual'
  const descontoValor =
    descontoTipo === 'valor'
      ? Math.min(Math.max(descontoGlobalPerc, 0), valorAposSinal)
      : valorAposSinal * (Math.min(descontoGlobalPerc, 100) / 100)

  const valorLiquido = valorAposSinal - descontoValor
  const freteValor = budget.frete_tipo === 'com_frete' ? Number(budget.frete_valor) || 0 : 0

  // Não usa valorLiquido + freteValor pra bater exatamente com o que a RPC
  // de aprovação de fato divide entre as parcelas (orcamentos.valor_total,
  // persistido) — evita que arredondamento/dado desatualizado no client
  // produza um total de parcelas diferente do que o banco vai gerar.
  const valorTotal = Number(budget.valor_total) || 0

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // SPEC-152: plano_parcelas (valor customizado por parcela) substitui a
  // divisão igual quando presente -- mesma fonte de verdade usada por
  // aprovar_orcamento_financeiro no banco.
  const planoCustomizado = Array.isArray(budget.plano_parcelas)
    ? [...budget.plano_parcelas].sort((a, b) => a.numero - b.numero)
    : null

  let parcelas: ParcelaPrevista[]
  if (planoCustomizado && planoCustomizado.length > 0) {
    parcelas = planoCustomizado.map((p) => {
      const dataVencimento = new Date(hoje)
      dataVencimento.setDate(dataVencimento.getDate() + (p.dias_offset ?? 0))
      return {
        numero: p.numero,
        valor: Number(p.valor) || 0,
        dataVencimento,
        formaPagamento: p.forma_pagamento || undefined,
        permutaFornecedorId: p.permuta_fornecedor_id ?? null,
      }
    })
  } else {
    const prazos = Array.isArray(budget.prazo_pagamento_dias) ? budget.prazo_pagamento_dias : []
    const qtdParcelas = Math.max(1, prazos.length)
    const valorBase = Math.round((valorTotal / qtdParcelas) * 100) / 100

    let acumulado = 0
    parcelas = Array.from({ length: qtdParcelas }, (_, i) => {
      const isUltima = i === qtdParcelas - 1
      const valor = isUltima
        ? Math.round((valorTotal - acumulado) * 100) / 100
        : valorBase
      if (!isUltima) acumulado += valor
      const offset = prazos[i] ?? 0
      const dataVencimento = new Date(hoje)
      dataVencimento.setDate(dataVencimento.getDate() + offset)
      return { numero: i + 1, valor, dataVencimento }
    })
  }

  return {
    valorBruto,
    valorSinal,
    valorAposSinal,
    descontoValor,
    valorLiquido,
    freteValor,
    valorTotal,
    parcelas,
  }
}

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  cheque: 'Cheque',
  dinheiro: 'Dinheiro',
  permuta: 'Permuta',
  // SPEC-152: parcela recebida sem gerar boleto (aparece em relatórios de
  // saldo em aberto/pendências) -- ver enum public.pagamento_forma.
  carteira: 'Carteira',
}
