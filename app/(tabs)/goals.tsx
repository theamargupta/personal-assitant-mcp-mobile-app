import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native'
import { MotiView } from 'moti'
import { Screen } from '@/components/ui/Screen'
import { GlassCard } from '@/components/ui/GlassCard'
import { Haptic } from '@/components/ui/Haptic'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors, spacing, radius, fontSize, fontWeight, duration } from '@/constants/theme'
import { listGoals, toggleMilestone, type GoalStatus, type GoalWithProgress } from '@/lib/goals'

const TAB_BAR_CLEARANCE = 170
const FILTERS = ['Active', 'Completed', 'All'] as const
type FilterOption = typeof FILTERS[number]

function toStatus(filter: FilterOption): GoalStatus | undefined {
  if (filter === 'All') return undefined
  if (filter === 'Completed') return 'completed'
  return 'active'
}

export default function GoalsScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterOption>('Active')
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const status = toStatus(activeFilter)
      const result = await listGoals(status)
      setGoals(result)
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [activeFilter])
  )

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      await toggleMilestone(milestoneId, !completed)
      await loadData()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to update milestone')
    }
  }

  const { active, completed } = useMemo(() => {
    const a: GoalWithProgress[] = []
    const c: GoalWithProgress[] = []
    for (const g of goals) (g.status === 'completed' ? c : a).push(g)
    return { active: a, completed: c }
  }, [goals])

  return (
    <Screen>
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: duration.base }}
        style={styles.hero}
      >
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.sub}>
          <Text style={styles.subStrong}>{active.length}</Text> active
          {completed.length > 0 && (
            <>
              <Text>  ·  </Text>
              <Text style={styles.subMuted}>{completed.length}</Text>
              <Text> done</Text>
            </>
          )}
        </Text>
      </MotiView>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <Haptic
          haptic="selection"
          onPress={() => router.push('/review' as any)}
          style={styles.reviewCard}
        >
          <View style={styles.reviewDot} />
          <Text style={styles.reviewTitle}>Weekly review</Text>
          <FontAwesome name="angle-right" size={16} color={colors.textSecondary} />
        </Haptic>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((item) => {
            const isActive = item === activeFilter
            return (
              <Haptic
                haptic="selection"
                key={item}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
              </Haptic>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 && !loading ? (
          <EmptyState
            icon="bullseye"
            tone="accent"
            title="No goals yet"
            subtitle="Set an outcome goal or a milestone list to track progress over time."
            action={{ label: 'Create goal', onPress: () => router.push('/add-goal' as any) }}
          />
        ) : (
          goals.map((item, idx) => {
            const expanded = expandedGoalId === item.id
            return (
              <View key={item.id} style={styles.goalWrap}>
                <Haptic haptic="selection" onPress={() => setExpandedGoalId(expanded ? null : item.id)}>
                  <GlassCard padding={spacing.lg} glow={item.status === 'active' && item.progress_pct >= 75}>
                    <View style={styles.goalRow}>
                      <ProgressRing
                        progress={Math.min(1, (item.progress_pct || 0) / 100)}
                        size={56}
                        stroke={5}
                        color={item.status === 'completed' ? colors.income : colors.primary}
                        label={`${Math.round(item.progress_pct || 0)}%`}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={styles.goalTitleRow}>
                          <Text style={styles.goalTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.status === 'completed' && (
                            <FontAwesome name="check-circle" size={14} color={colors.income} />
                          )}
                        </View>
                        <Text style={styles.goalMeta} numberOfLines={1}>
                          {(item.metric_type || item.goal_type || 'goal').replace(/_/g, ' ')}
                          {item.end_date && (
                            <>
                              <Text>  ·  by </Text>
                              <Text style={{ color: colors.textSecondary }}>
                                {new Date(item.end_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </Text>
                            </>
                          )}
                        </Text>
                      </View>
                      <FontAwesome
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={colors.textMuted}
                      />
                    </View>

                    {expanded && item.goal_type === 'milestone' && item.milestones?.length ? (
                      <View style={styles.milestoneBox}>
                        {item.milestones.map((m) => (
                          <Pressable
                            key={m.id}
                            style={styles.milestoneRow}
                            onPress={() => handleToggleMilestone(m.id, m.completed)}
                          >
                            <FontAwesome
                              name={m.completed ? 'check-circle' : 'circle-thin'}
                              size={16}
                              color={m.completed ? colors.income : colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.milestoneTitle,
                                m.completed && styles.milestoneDone,
                              ]}
                            >
                              {m.title}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </GlassCard>
                </Haptic>
              </View>
            )
          })
        )}
        <View style={{ height: TAB_BAR_CLEARANCE }} />
      </ScrollView>

      <Haptic
        haptic="medium"
        style={styles.fab}
        onPress={() => router.push('/add-goal' as any)}
      >
        <FontAwesome name="plus" size={18} color={colors.textPrimary} />
      </Haptic>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  subStrong: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  subMuted: {
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  reviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  reviewTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  filterWrap: {
    height: 48,
    marginTop: spacing.sm,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  list: {
    paddingTop: spacing.sm,
  },
  goalWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  goalMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  milestoneBox: {
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceBorder,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  milestoneTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  milestoneDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
})
