import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const active = streak > 0

  return (
    <View style={[styles.badge, active ? styles.badgeActive : styles.badgeIdle]}>
      <Text style={styles.emoji}>🔥</Text>
      <Text style={[styles.value, active ? styles.valueActive : styles.valueIdle]}>{streak}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeActive: {
    backgroundColor: colors.primaryGlow,
  },
  badgeIdle: {
    backgroundColor: colors.surfaceElevated,
  },
  emoji: {
    fontSize: fontSize.sm,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  valueActive: {
    color: colors.primary,
  },
  valueIdle: {
    color: colors.textMuted,
  },
})

