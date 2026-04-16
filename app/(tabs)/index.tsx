import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet, Alert } from 'react-native'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { listHabits, logHabit, type HabitWithStreak } from '@/lib/habits'
import { listTasks, updateTaskStatus, type Task } from '@/lib/tasks'
import { listGoals, type GoalWithProgress } from '@/lib/goals'
import { SpendingSummary } from '@/components/SpendingSummary'
import { TransactionCard } from '@/components/TransactionCard'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Transaction {
  id: string
  amount: number
  merchant: string | null
  note: string | null
  transaction_date: string
  spending_categories?: { name: string; icon: string } | null
}

function dateInIST(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function getGreetingText(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date())
  )
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function startOfCurrentWeekIST(): string {
  const now = new Date()
  const day = now.getDay()
  const shiftToMonday = day === 0 ? 6 : day - 1
  const start = new Date(now)
  start.setDate(now.getDate() - shiftToMonday)
  return dateInIST(start)
}

function priorityWeight(priority: Task['priority']): number {
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  return 1
}

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<{ total: number; categories: Array<{ name: string; icon: string; amount: number }> }>({
    total: 0,
    categories: [],
  })
  const [habits, setHabits] = useState<HabitWithStreak[]>([])
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [completedThisWeek, setCompletedThisWeek] = useState(0)
  const [activeGoals, setActiveGoals] = useState<GoalWithProgress[]>([])

  const loadData = async () => {
    try {
      const weekStart = startOfCurrentWeekIST()
      const [habitsResult, pendingTasksResult, completedTasksResult, goalsResult, txResult] = await Promise.all([
        listHabits(),
        listTasks({ status: 'pending', limit: 100 }),
        listTasks({ status: 'completed', limit: 200 }),
        listGoals('active'),
        api.listTransactions({
          start_date: `${weekStart}T00:00:00+05:30`,
          limit: '20',
        }) as Promise<{ transactions?: Transaction[] }>,
      ])

      const tx = txResult.transactions || []
      const categoryMap = new Map<string, { name: string; icon: string; amount: number }>()
      for (const item of tx) {
        const name = item.spending_categories?.name || 'Other'
        const icon = item.spending_categories?.icon || '💰'
        const current = categoryMap.get(name) || { name, icon, amount: 0 }
        current.amount += Number(item.amount)
        categoryMap.set(name, current)
      }

      const completedCount = completedTasksResult.tasks.filter(
        (task) => task.completed_at && task.completed_at >= `${weekStart}T00:00:00+05:30`
      ).length

      setHabits(habitsResult)
      setPendingTasks(pendingTasksResult.tasks)
      setCompletedThisWeek(completedCount)
      setActiveGoals(goalsResult)
      setTransactions(tx.slice(0, 5))
      setSummary({
        total: tx.reduce((sum, item) => sum + Number(item.amount), 0),
        categories: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount),
      })
    } catch {
      // Keep dashboard resilient on partial API/Supabase failures.
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const bestStreak = useMemo(() => habits.reduce((max, item) => Math.max(max, item.current_streak), 0), [habits])
  const unloggedHabits = useMemo(() => habits.filter((habit) => !habit.is_logged_today).slice(0, 3), [habits])
  const prioritizedTasks = useMemo(
    () =>
      [...pendingTasks]
        .sort((a, b) => {
          const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority)
          if (priorityDiff !== 0) return priorityDiff
          return (a.due_date || '').localeCompare(b.due_date || '')
        })
        .slice(0, 3),
    [pendingTasks]
  )

  const handleQuickLog = async (habitId: string) => {
    try {
      await logHabit(habitId)
      await loadData()
    } catch (error) {
      Alert.alert('Unable to log habit', error instanceof Error ? error.message : 'Try again')
    }
  }

  const handleQuickTaskComplete = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, 'completed')
      await loadData()
    } catch (error) {
      Alert.alert('Unable to update task', error instanceof Error ? error.message : 'Try again')
    }
  }

  const displayName = user?.email?.split('@')[0] || 'there'
  const greeting = getGreetingText()
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  })

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.greeting}>{`${greeting}, ${displayName}`}</Text>
              <Text style={styles.dateLabel}>{todayLabel}</Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="🔥 Best Streak" value={String(bestStreak)} />
              <StatCard label="✅ Tasks Done" value={String(completedThisWeek)} />
              <StatCard label="💰 Spent" value={`₹${Math.round(summary.total).toLocaleString('en-IN')}`} />
              <StatCard label="🎯 Goals" value={String(activeGoals.length)} />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Habits</Text>
              <TouchableOpacity onPress={() => router.push('/habits' as any)}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickList}>
              {unloggedHabits.length ? (
                unloggedHabits.map((habit) => (
                  <View key={habit.id} style={styles.quickRow}>
                    <View style={[styles.quickDot, { backgroundColor: habit.color }]} />
                    <Text style={styles.quickText} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Pressable style={styles.quickAction} onPress={() => handleQuickLog(habit.id)}>
                      <Text style={styles.quickActionText}>Log</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyInline}>All habits logged for today.</Text>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Tasks</Text>
              <TouchableOpacity onPress={() => router.push('/tasks' as any)}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickList}>
              {prioritizedTasks.length ? (
                prioritizedTasks.map((task) => (
                  <View key={task.id} style={styles.quickRow}>
                    <Pressable style={styles.quickCheckbox} onPress={() => handleQuickTaskComplete(task.id)}>
                      <FontAwesome name="check" size={10} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.quickText} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.quickMeta}>{task.priority}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyInline}>No pending tasks.</Text>
              )}
            </View>

            <SpendingSummary totalSpent={summary.total} periodLabel="This Week" topCategories={summary.categories} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/finance' as any)}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TransactionCard
            amount={Number(item.amount)}
            merchant={item.merchant}
            category={item.spending_categories?.name || 'Uncategorized'}
            icon={item.spending_categories?.icon || '❓'}
            date={new Date(item.transaction_date).toLocaleDateString('en-IN')}
            note={item.note}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet. Spend something!</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')} activeOpacity={0.8}>
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
  listContent: {
    paddingBottom: spacing['4xl'],
  },
  headerBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: spacing.md,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  quickList: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.income,
    backgroundColor: colors.income,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  quickMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  quickAction: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  quickActionText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyInline: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing['4xl'],
    fontSize: fontSize.base,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
