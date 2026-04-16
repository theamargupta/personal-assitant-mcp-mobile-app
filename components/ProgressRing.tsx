import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface ProgressRingProps {
  progress: number
  size?: number
  color?: string
}

export function ProgressRing({ progress, size = 48, color = colors.primary }: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, progress))

  return (
    <View style={[styles.container, { width: size }]}>
      <View style={[styles.track, { width: size }]}>
        <View style={[styles.fill, { width: `${normalized}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{normalized}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  track: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: radius.full,
  },
  value: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
})

