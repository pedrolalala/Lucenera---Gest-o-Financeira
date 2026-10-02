import { addDays } from 'date-fns'
import { isApprovedStatus } from './budget-status'

// SPEC-174 N3 (decisão do usuário, 01/10): orçamento vencido = hoje depois
// da validade; quando validade estiver vazia (orçamento antigo, anterior à
// SPEC-095), cai para emissão + 10 dias -- o mesmo padrão que o form já usa
// para calcular a validade default (BudgetFormPage.tsx).
export function getBudgetVencimento(budget: {
  validade?: string | null
  data_emissao?: string | null
}): Date | null {
  if (budget.validade) return new Date(`${budget.validade}T00:00:00`)
  if (budget.data_emissao) return addDays(new Date(budget.data_emissao), 10)
  return null
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
