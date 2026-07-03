const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false
  return UUID_REGEX.test(value)
}

export function sanitizeProdutoId(
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (UUID_REGEX.test(trimmed)) return trimmed
  return null
}
