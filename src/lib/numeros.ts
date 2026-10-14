// SPEC-182 (N1): números de venda e de orçamento aparecem sem o prefixo
// ("VENDA-0001" → "0001", "ORC-0032" → "0032"; "ORC-0032-P3" → "0032-P3").
// Só exibição — o número gravado no banco não muda.
export const semPrefixo = (numero: string | null | undefined) =>
  (numero || '').replace(/^(VENDA|ORC)-/i, '')

// SPEC-199: quantidade de item aceita fração (peça por metro: fita, perfil, cabo — "4,5" m).
// orcamento_itens.quantidade é numeric(10,3): sempre 3 casas no máximo.
export const arredondarQtd = (n: number) => Math.round(n * 1000) / 1000

// "4,5" / "4.5" -> 4.5; vazio ou inválido -> null
export const lerQtd = (texto: string): number | null => {
  const t = texto.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? arredondarQtd(n) : null
}

// 4.5 -> "4,5"; 3 -> "3"
export const formatarQtd = (n: number | string | null | undefined) =>
  Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })

// Peça por metro = unidade MT no cadastro (Connect) OU quantidade quebrada.
export const ehPorMetro = (
  unidade: string | null | undefined,
  quantidade: number | string | null | undefined,
) => {
  const q = Number(quantidade) || 0
  return (unidade || '').trim().toUpperCase() === 'MT' || !Number.isInteger(q)
}
