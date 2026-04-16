import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native'
import { GoalCard } from '@/components/GoalCard'
import { EmptyState } from '@/components/EmptyState'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { listGoals, toggleMilestone, type GoalStatus, type GoalWithProgress } from '@/lib/goals'

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
  const [loading, setLoading] = useState(false)

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Goals</Text>

      <Pressable style={styles.reviewCard} onPress={() => router.push('/review' as any)}>
        <Text style={styles.reviewTitle}>📊 View Weekly Review</Text>
        <FontAwesome name="angle-right" size={18} color={colors.textSecondary} />
      </Pressable>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = item === activeFilter
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )
        }}
      />

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const expanded = expandedGoalId === item.id
          return (
            <View>
              <GoalCard
                goal={item}
                onPress={() => setExpandedGoalId(expanded ? null : item.id)}
              />
              {expanded && item.goal_type === 'milestone' && item.milestones?.length ? (
                <View style={styles.milestoneBox}>
                  {item.milestones.map((milestone) => (
                    <Pressable
                      key={milestone.id}
                      style={styles.milestoneRow}
                      onPress={() => handleToggleMilestone(milestone.id, milestone.completed)}
                    >
                      <FontAwesome
                        name={milestone.completed ? 'check-circle' : 'circle-thin'}
                        size={18}
                        color={milestone.completed ? colors.income : colors.textMuted}
                      />
                      <Text style={[styles.milestoneTitle, milestone.completed && styles.milestoneDone]}>
                        {milestone.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          )
        }}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Loading goals...</Text>
          ) : (
            <EmptyState icon="🎯" title="No goals yet" subtitle="Create a goal and track progress over time." />
          )
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/add-goal' as any)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  reviewCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    paddingBottom: spacing['4xl'],
  },
  milestoneBox: {
    marginTop: -2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    gap: spacing.sm,
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
  loading: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing['4xl'],
    fontSize: fontSize.base,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    lineHeight: 26,
  },
})
