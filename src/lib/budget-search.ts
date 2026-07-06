export function fuzzyMatch(
  query: string,
  target: string | null | undefined,
): boolean {
  if (!target) return false
  const q = query.trim().toLowerCase()
  if (!q) return false
  return target.toLowerCase().includes(q)
}

export interface BudgetSearchable {
  numero?: string | null
  cliente?: {
    nome?: string | null
    razao_social?: string | null
    email?: string | null
    nome_empresa?: string | null
  } | null
  projeto?: {
    nome?: string | null
    codigo?: string | null
  } | null
  arquiteto?: {
    nome?: string | null
  } | null
}

export function searchBudgetsByContactsAndProjects<T extends BudgetSearchable>(
  budgets: T[],
  query: string,
): T[] {
  const trimmed = query.trim()
  if (!trimmed) return budgets

  return budgets.filter((budget) => {
    const client = budget.cliente
    const projeto = budget.projeto

    return (
      fuzzyMatch(trimmed, client?.nome) ||
      fuzzyMatch(trimmed, client?.razao_social) ||
      fuzzyMatch(trimmed, client?.email) ||
      fuzzyMatch(trimmed, client?.nome_empresa) ||
      fuzzyMatch(trimmed, projeto?.nome) ||
      fuzzyMatch(trimmed, projeto?.codigo) ||
      fuzzyMatch(trimmed, budget.numero)
    )
  })
}

export function hasSearchMatchHighlight(
  query: string,
  target: string | null | undefined,
): boolean {
  return fuzzyMatch(query, target)
}
