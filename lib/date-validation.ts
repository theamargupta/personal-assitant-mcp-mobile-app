const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates a user-entered date string.
 * - Empty / whitespace → returns `undefined` (unset is valid).
 * - Matches YYYY-MM-DD and is a real calendar date → returns the trimmed string.
 * - Otherwise throws an Error with a clear message.
 */
export function parseOptionalIsoDate(raw: string | null | undefined, fieldLabel = 'Date'): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined

  if (!ISO_DATE.test(trimmed)) {
    throw new Error(`${fieldLabel} must be in YYYY-MM-DD format (e.g. 2026-05-01)`)
  }

  const date = new Date(`${trimmed}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldLabel} is not a real calendar date`)
  }

  const [year, month, day] = trimmed.split('-').map(Number)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${fieldLabel} is not a real calendar date`)
  }

  return trimmed
}
