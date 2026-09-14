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

interface BudgetParaResumo {
  itens?: { quantidade: number; preco_unitario: number; desconto: number }[] | null
  desconto_global: number | null
  desconto_tipo?: string | null
  valor_sinal?: number | null
  frete_tipo: string | null
  frete_valor: number | null
  valor_total: number
  prazo_pagamento_dias: number[] | null
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

  const prazos = Array.isArray(budget.prazo_pagamento_dias) ? budget.prazo_pagamento_dias : []
  const qtdParcelas = Math.max(1, prazos.length)
  const valorBase = Math.round((valorTotal / qtdParcelas) * 100) / 100
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  let acumulado = 0
  const parcelas: ParcelaPrevista[] = Array.from({ length: qtdParcelas }, (_, i) => {
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
}
