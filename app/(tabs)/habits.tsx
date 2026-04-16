import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { HabitCard } from '@/components/HabitCard'
import { EmptyState } from '@/components/EmptyState'
import { listHabits, logHabit, type HabitWithStreak } from '@/lib/habits'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

export default function HabitsScreen() {
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithStreak[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await listHabits()
      setHabits(data)
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load habits')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const handleLog = async (habitId: string) => {
    try {
      await logHabit(habitId)
      Alert.alert('Logged', 'Habit marked complete for today')
      await loadData()
    } catch (error) {
      Alert.alert('Unable to log', error instanceof Error ? error.message : 'Try again')
    }
  }

  const activeCount = habits.length
  const bestStreak = habits.reduce((max, item) => Math.max(max, item.current_streak), 0)
  const todayDone = habits.filter((item) => item.is_logged_today).length

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>Habits</Text>
            <View style={styles.statsRow}>
              <StatCard label="Active" value={String(activeCount)} />
              <StatCard label="Best Streak" value={String(bestStreak)} />
              <StatCard label="Today" value={`${todayDone}/${activeCount}`} />
            </View>
          </>
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onLog={() => handleLog(item.id)}
            onPress={() => {}}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Loading habits...</Text>
          ) : (
            <EmptyState icon="🔁" title="No habits yet" subtitle="Create your first habit to start building streaks." />
          )
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/add-habit' as any)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: spacing['4xl'],
  },
  header: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
