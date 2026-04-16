import { colors, spacing, radius, fontSize, duration, spring, elevation } from '@/constants/theme'

describe('theme tokens', () => {
  it('exposes core color tokens', () => {
    expect(colors.bg).toBe('#09090B')
    expect(colors.primary).toBe('#8B5CF6')
    expect(colors.expense).toBe('#F43F5E')
  })

  it('spacing is a monotonic scale', () => {
    const scale = [spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl]
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]).toBeGreaterThan(scale[i - 1])
    }
  })

  it('radius.full is large enough for pill shapes', () => {
    expect(radius.full).toBeGreaterThanOrEqual(999)
  })

  it('fontSize is a monotonic scale', () => {
    const scale = [fontSize.xs, fontSize.sm, fontSize.base, fontSize.md, fontSize.lg, fontSize.xl]
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]).toBeGreaterThan(scale[i - 1])
    }
  })

  it('duration fast < base < slow', () => {
    expect(duration.fast).toBeLessThan(duration.base)
    expect(duration.base).toBeLessThan(duration.slow)
  })

  it('spring configs have required fields', () => {
    for (const preset of [spring.snappy, spring.gentle, spring.bouncy]) {
      expect(preset.damping).toBeGreaterThan(0)
      expect(preset.stiffness).toBeGreaterThan(0)
      expect(preset.mass).toBeGreaterThan(0)
    }
  })

  it('elevation.glow uses the primary accent color', () => {
    expect(elevation.glow.shadowColor).toBe(colors.primary)
  })
})
