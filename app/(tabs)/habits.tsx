import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { HabitCard } from '@/components/HabitCard'
import { Screen } from '@/components/ui/Screen'
import { Haptic } from '@/components/ui/Haptic'
import { EmptyState } from '@/components/ui/EmptyState'
import { EditHabitSheet } from '@/components/sheets/EditHabitSheet'
import { tryOrQueue } from '@/lib/queue'
import { listHabits, logHabit, type HabitWithStreak } from '@/lib/habits'
import { colors, spacing, radius, fontSize, fontWeight, duration } from '@/constants/theme'

const TAB_BAR_CLEARANCE = 170

export default function HabitsScreen() {
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithStreak[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<HabitWithStreak | null>(null)

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
      await tryOrQueue('habit_log', { habit_id: habitId }, () => logHabit(habitId))
      await loadData()
    } catch (error) {
      Alert.alert('Unable to log', error instanceof Error ? error.message : 'Try again')
    }
  }

  const activeCount = habits.length
  const bestStreak = habits.reduce((max, item) => Math.max(max, item.current_streak), 0)
  const todayDone = habits.filter((item) => item.is_logged_today).length

  return (
    <Screen>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: duration.base }}
          >
            <View style={styles.hero}>
              <Text style={styles.title}>Habits</Text>
              <Text style={styles.sub}>
                <Text style={styles.subAccent}>{todayDone}</Text>
                <Text> of {activeCount} logged today</Text>
              </Text>
            </View>
            <View style={styles.statsRow}>
              <StatCard label="Active" value={String(activeCount)} />
              <StatCard label="Best streak" value={String(bestStreak)} />
              <StatCard label="Today" value={`${todayDone}/${activeCount}`} />
            </View>
          </MotiView>
        }
        renderItem={({ item }) => (
          <HabitCard habit={item} onLog={() => handleLog(item.id)} onPress={() => setEditing(item)} />
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="refresh"
              tone="accent"
              title="No habits yet"
              subtitle="Create your first habit to start building streaks."
              action={{ label: 'New habit', onPress: () => router.push('/add-habit' as any) }}
            />
          )
        }
      />

      <Haptic haptic="medium" style={styles.fab} onPress={() => router.push('/add-habit' as any)}>
        <FontAwesome name="plus" size={18} color={colors.textPrimary} />
      </Haptic>

      <EditHabitSheet habit={editing} onClose={() => setEditing(null)} onMutated={loadData} />
    </Screen>
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
  list: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
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
  subAccent: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
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
