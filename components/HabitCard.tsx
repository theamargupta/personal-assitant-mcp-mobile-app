import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Pressable, View, Text, StyleSheet } from 'react-native'
import type { HabitWithStreak } from '@/lib/habits'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { StreakBadge } from '@/components/StreakBadge'

interface HabitCardProps {
  habit: HabitWithStreak
  onLog: () => void
  onPress: () => void
}

export function HabitCard({ habit, onLog, onPress }: HabitCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: habit.color }]} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>
        <View style={styles.metaRow}>
          <StreakBadge streak={habit.current_streak} />
          <Text style={styles.metaText}>{habit.completion_pct}% in 30 days</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                backgroundColor: habit.color,
                width: `${Math.max(0, Math.min(100, habit.completion_pct))}%`,
              },
            ]}
          />
        </View>
      </View>

      {habit.is_logged_today ? (
        <FontAwesome name="check-circle" size={20} color={colors.income} />
      ) : (
        <Pressable
          style={styles.logButton}
          onPress={(event) => {
            event.stopPropagation()
            onLog()
          }}
        >
          <Text style={styles.logText}>Log</Text>
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  barTrack: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    height: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: radius.full,
  },
  logButton: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  logText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})

