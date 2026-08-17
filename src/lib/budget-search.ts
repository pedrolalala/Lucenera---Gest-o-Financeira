// SPEC-116: normaliza acento/maiúscula pra busca "estilo Google" — usado
// tanto no match único (fuzzyMatch/highlight) quanto no multi-termo abaixo.
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function fuzzyMatch(
  query: string,
  target: string | null | undefined,
): boolean {
  if (!target) return false
  const q = normalize(query.trim())
  if (!q) return false
  return normalize(target).includes(q)
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
  // SPEC-116: multi-termo em qualquer ordem, sem distinção de acento —
  // cada palavra digitada precisa aparecer em algum campo do orçamento
  // (cliente, projeto, arquiteto ou número), não necessariamente no mesmo
  // campo. Antes era 1 termo contra cada campo isoladamente, sensível a
  // acento, e nunca checava o arquiteto apesar de já estar na interface.
  const terms = normalize(query.trim())
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return budgets

  return budgets.filter((budget) => {
    const client = budget.cliente
    const projeto = budget.projeto
    const haystack = normalize(
      [
        client?.nome,
        client?.razao_social,
        client?.email,
        client?.nome_empresa,
        projeto?.nome,
        projeto?.codigo,
        budget.numero,
        budget.arquiteto?.nome,
      ]
        .filter(Boolean)
        .join(' '),
    )
    return terms.every((t) => haystack.includes(t))
  })
}

export function hasSearchMatchHighlight(
  query: string,
  target: string | null | undefined,
): boolean {
  return fuzzyMatch(query, target)
}
