/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeStatus(status?: string | null) {
  if (!status) return 'rascunho'
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
}

/**
 * Formats a circuit identifier string.
 * Ensures uppercase "L" prefix and leading zero for single-digit numbers.
 * Examples: "l1" -> "L01", "L5" -> "L05", "l12" -> "L12", "100" -> "L100"
 */
export function formatCircuitId(input: string | null | undefined): string {
  if (!input) return ''

  const trimmed = input.trim()
  if (!trimmed) return ''

  const value = trimmed.toUpperCase()

  const match = value.match(/^L?(\d+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    if (num < 10) {
      return 'L0' + num
    }
    return 'L' + num
  }

  if (value.startsWith('L')) {
    return value
  }

  return value
}

/**
 * Extracts the numeric value from a circuit identifier string.
 * Examples: "L01" -> 1, "L15" -> 15, "L100" -> 100, "" -> 0
 */
export function extractCircuitNumber(input: string | null | undefined): number {
  if (!input) return 0
  const match = input.trim().match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Sorts items by their circuit ID (custom_id) field.
 * Items with valid circuit IDs (L01, L02, L10, etc.) are sorted numerically.
 * Items without circuit IDs are placed at the end.
 */
export function sortItemsByCircuitId<T extends { custom_id?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const idA = (a.custom_id || '').toUpperCase()
    const idB = (b.custom_id || '').toUpperCase()

    const numA = parseInt(idA.replace(/^L/, ''), 10)
    const numB = parseInt(idB.replace(/^L/, ''), 10)

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }

    if (!idA && idB) return 1
    if (idA && !idB) return -1

    return idA.localeCompare(idB)
  })
}
