import { Pressable, View, Text, StyleSheet } from 'react-native'
import type { GoalWithProgress } from '@/lib/goals'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface GoalCardProps {
  goal: GoalWithProgress
  onPress: () => void
}

function formatAmount(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const progress = Math.max(0, Math.min(100, goal.progress_pct))
  const doneColor =
    goal.metric_type === 'spending_limit' ? (progress < 40 ? colors.income : colors.expense) : progress >= 100
      ? colors.income
      : colors.primary

  const milestoneTotal = goal.milestones?.length || 0
  const milestoneDone = goal.milestones?.filter((milestone) => milestone.completed).length || 0

  const detailText =
    goal.goal_type === 'milestone'
      ? `${milestoneDone}/${milestoneTotal} milestones`
      : goal.metric_type === 'spending_limit'
        ? `${formatAmount(goal.current_value)} / ${formatAmount(goal.target_value || 0)}`
        : `${goal.current_value}/${goal.target_value || 0}`

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {goal.title}
        </Text>
        <View style={[styles.typeBadge, goal.goal_type === 'milestone' ? styles.typeMilestone : styles.typeOutcome]}>
          <Text style={styles.typeText}>{goal.goal_type}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: doneColor }]} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{detailText}</Text>
        <Text style={styles.progressPct}>{progress}%</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  typeBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeOutcome: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
  },
  typeMilestone: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  typeText: {
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'capitalize',
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radius.full,
  },
  bottomRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  progressPct: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})

