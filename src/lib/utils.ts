import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeStatus(status: string | null | undefined): string {
  if (!status) return ''
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
}

export function formatCircuitId(value: string): string {
  if (!value) return ''
  const trimmed = value.trim().toUpperCase()

  const match = trimmed.match(/^L\s*(\d+)$/)
  if (match) {
    return `L${match[1].padStart(2, '0')}`
  }

  const numMatch = trimmed.match(/^(\d+)$/)
  if (numMatch) {
    return `L${numMatch[1].padStart(2, '0')}`
  }

  if (trimmed === 'L' || trimmed === 'L ') {
    return 'L'
  }

  if (trimmed.startsWith('L')) {
    const rest = trimmed.slice(1).trim()
    const numMatch2 = rest.match(/^(\d+)$/)
    if (numMatch2) {
      return `L${numMatch2[1].padStart(2, '0')}`
    }
    return trimmed
  }

  return trimmed
}

export function extractCircuitNumber(value: string | null | undefined): number {
  if (!value) return 0
  const match = value.match(/(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return 0
}

export function sortItemsByCircuitId<
  T extends { custom_id?: string | null; sub_ordem?: number | null },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const numA = extractCircuitNumber(a.custom_id)
    const numB = extractCircuitNumber(b.custom_id)
    const aValid = numA > 0
    const bValid = numB > 0

    if (!aValid && !bValid) {
      return (a.sub_ordem ?? 0) - (b.sub_ordem ?? 0)
    }
    if (!aValid) return 1
    if (!bValid) return -1

    if (numA !== numB) return numA - numB

    return (a.sub_ordem ?? 0) - (b.sub_ordem ?? 0)
  })
}

export function computeSubOrdem<T extends { custom_id?: string | null }>(
  items: T[],
): number[] {
  const circuitCounts: Record<number, number> = {}
  return items.map((item) => {
    const circuitNum = extractCircuitNumber(item.custom_id)
    const current = circuitCounts[circuitNum] ?? 0
    circuitCounts[circuitNum] = current + 1
    return current
  })
}
