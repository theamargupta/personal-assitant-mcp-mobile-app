import { parseOptionalIsoDate } from '@/lib/date-validation'

describe('parseOptionalIsoDate', () => {
  it('returns undefined for empty / whitespace / null', () => {
    expect(parseOptionalIsoDate('')).toBeUndefined()
    expect(parseOptionalIsoDate('   ')).toBeUndefined()
    expect(parseOptionalIsoDate(null)).toBeUndefined()
    expect(parseOptionalIsoDate(undefined)).toBeUndefined()
  })

  it('returns the trimmed string for valid YYYY-MM-DD', () => {
    expect(parseOptionalIsoDate('2026-04-17')).toBe('2026-04-17')
    expect(parseOptionalIsoDate('  2026-04-17  ')).toBe('2026-04-17')
  })

  it('rejects gibberish with a clear message', () => {
    expect(() => parseOptionalIsoDate('zxcv', 'Due date')).toThrow(/Due date must be in YYYY-MM-DD/)
    expect(() => parseOptionalIsoDate('04/17/2026')).toThrow(/YYYY-MM-DD/)
    expect(() => parseOptionalIsoDate('2026-4-7')).toThrow(/YYYY-MM-DD/)
  })

  it('rejects impossible calendar dates', () => {
    expect(() => parseOptionalIsoDate('2026-02-30')).toThrow(/real calendar date/)
    expect(() => parseOptionalIsoDate('2026-13-01')).toThrow(/real calendar date/)
  })

  it('uses the provided field label in errors', () => {
    expect(() => parseOptionalIsoDate('bad', 'End date')).toThrow(/^End date/)
  })
})
