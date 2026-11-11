import { addDays } from 'date-fns'
import { isApprovedStatus } from './budget-status'
import { getRegras } from './budget-regras'

// SPEC-174 N3 (decisão do usuário, 01/10): orçamento vencido = hoje depois
// da validade; quando validade estiver vazia (orçamento antigo, anterior à
// SPEC-095), cai para emissão + 10 dias -- o mesmo padrão que o form já usa
// para calcular a validade default (BudgetFormPage.tsx).
export function getBudgetVencimento(budget: {
  validade?: string | null
  data_emissao?: string | null
}): Date | null {
  if (budget.validade) return new Date(`${budget.validade}T00:00:00`)
  if (budget.data_emissao) {
    // SPEC-282: dias de validade vêm das regras do orçamento. Orçamento antigo sem validade gravada,
    // emitido antes da última mudança da regra, continua com o valor de antes (mudança vale só p/ novos).
    const r = getRegras()
    const emissao = new Date(budget.data_emissao)
    const dias =
      r.validadeDiasAnterior !== null &&
      r.validadeVigenteDesde &&
      emissao.getTime() < r.validadeVigenteDesde.getTime()
        ? r.validadeDiasAnterior
        : r.validadeDias
    return addDays(emissao, dias)
  }
  return null
}

// SPEC-282: idade do orçamento em dias desde a emissão (para a regra "mais de N dias").
export function getBudgetIdadeDias(budget: { data_emissao?: string | null }): number | null {
  if (!budget.data_emissao) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const emi = new Date(budget.data_emissao)
  emi.setHours(0, 0, 0, 0)
  return Math.floor((hoje.getTime() - emi.getTime()) / 86_400_000)
}

// SPEC-282: o aviso de preço deve abrir? Status na lista das regras, não aprovado/devolução, e
// (validade vencida OU mais de `avisoPrecoDias` dias desde a emissão).
export function deveAvisarPrecoPorTempo(budget: {
  status?: string | null
  natureza_operacao?: string | null
  validade?: string | null
  data_emissao?: string | null
}): { avisar: boolean; vencido: boolean } {
  const r = getRegras()
  if (isApprovedStatus(budget.status) || budget.natureza_operacao === 'devolucao') {
    return { avisar: false, vencido: false }
  }
  if (budget.status && !r.statusQueAvisam.includes(budget.status)) {
    return { avisar: false, vencido: false }
  }
  const vencido = isBudgetVencido(budget)
  const idade = getBudgetIdadeDias(budget)
  return { avisar: vencido || (idade !== null && idade > r.avisoPrecoDias), vencido }
}

// SPEC-174 N3: não se aplica a orçamento já aprovado/virado venda
// (isApprovedStatus) nem a devolução (decisão do usuário, 01/10).
export function isBudgetVencido(budget: {
  status?: string | null
  natureza_operacao?: string | null
  validade?: string | null
  data_emissao?: string | null
}): boolean {
  if (isApprovedStatus(budget.status)) return false
  if (budget.natureza_operacao === 'devolucao') return false
  const vencimento = getBudgetVencimento(budget)
  if (!vencimento) return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(vencimento)
  venc.setHours(0, 0, 0, 0)
  return hoje.getTime() > venc.getTime()
}

// SPEC-174 N3: "pode recusar e manter os preços antigos; não perguntar de
// novo na mesma sessão para o mesmo orçamento" -- sessionStorage (limpa ao
// fechar a aba), não localStorage; guarda tanto a recusa quanto a
// confirmação, já que em ambos os casos o aviso não deve repetir na sessão.
const SESSION_KEY = 'spec174_n3_preco_vencido_perguntado'

function readAskedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function wasPriceUpdatePromptAsked(budgetId: string): boolean {
  return readAskedSet().has(budgetId)
}

export function markPriceUpdatePromptAsked(budgetId: string): void {
  try {
    const set = readAskedSet()
    set.add(budgetId)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(set)))
  } catch {
    // sessionStorage indisponível (ex.: modo privado) -- ignora, o aviso só
    // pode voltar a aparecer nesta sessão.
  }
}
