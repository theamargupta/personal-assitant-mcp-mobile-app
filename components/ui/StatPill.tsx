import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { GlassCard } from './GlassCard'
import { colors, spacing, fontSize, fontWeight, duration } from '@/constants/theme'

interface Props {
  label: string
  value: string | number
  accent?: string
  delay?: number
}

export function StatPill({ label, value, accent = colors.primary, delay = 0 }: Props) {
  const [display, setDisplay] = useState<string | number>(typeof value === 'number' ? 0 : value)

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const from = typeof display === 'number' ? display : 0
    const dur = 600
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: duration.base, delay }}
      style={styles.wrap}
    >
      <GlassCard padding={spacing.md}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.value}>{display}</Text>
        <Text style={styles.label}>{label}</Text>
      </GlassCard>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
})
