import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { listHabits, type HabitWithStreak } from '@/lib/habits'
import { listTasks, type Task } from '@/lib/tasks'
import { listGoals, type GoalWithProgress } from '@/lib/goals'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { ReviewSummary } from '@/components/ReviewSummary'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

type PeriodOption = 'this_week' | 'last_week' | 'this_month'

interface ReviewData {
  habits: HabitWithStreak[]
  tasks: Task[]
  goals: GoalWithProgress[]
  transactions: Array<{ amount: number; spending_categories?: { name: string; icon: string } | null }>
  habitLogsByHabit: Record<string, number>
  startDate: string
  endDate: string
}

const PERIOD_OPTIONS: Array<{ key: PeriodOption; label: string }> = [
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
]

function dateInIST(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function todayIST(): string {
  return dateInIST(new Date())
}

function getPeriodRange(period: PeriodOption): { startDate: string; endDate: string } {
  const now = new Date()
  const today = new Date(now)
  const day = today.getDay()
  const shiftToMonday = day === 0 ? 6 : day - 1

  if (period === 'this_week') {
    const start = new Date(today)
    start.setDate(today.getDate() - shiftToMonday)
    return { startDate: dateInIST(start), endDate: dateInIST(today) }
  }

  if (period === 'last_week') {
    const end = new Date(today)
    end.setDate(today.getDate() - shiftToMonday - 1)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    return { startDate: dateInIST(start), endDate: dateInIST(end) }
  }

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return { startDate: dateInIST(startOfMonth), endDate: dateInIST(today) }
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00+05:30`)
  const end = new Date(`${endDate}T00:00:00+05:30`)
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export default function ReviewScreen() {
  const [period, setPeriod] = useState<PeriodOption>('this_week')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReviewData>({
    habits: [],
    tasks: [],
    goals: [],
    transactions: [],
    habitLogsByHabit: {},
    startDate: '',
    endDate: '',
  })

  const loadData = async (selected: PeriodOption) => {
    setLoading(true)
    const range = getPeriodRange(selected)

    try {
      const [habits, tasksResult, goals, transactionsResult, habitLogsResult] = await Promise.all([
        listHabits(),
        listTasks({ limit: 200 }),
        listGoals(),
        api.listTransactions({
          start_date: `${range.startDate}T00:00:00+05:30`,
          end_date: `${range.endDate}T23:59:59+05:30`,
          limit: '200',
        }) as Promise<{ transactions?: Array<{ amount: number; spending_categories?: { name: string; icon: string } | null }> }>,
        supabase
          .from('habit_logs')
          .select('habit_id')
          .gte('logged_date', range.startDate)
          .lte('logged_date', range.endDate),
      ])

      const logsByHabit: Record<string, number> = {}
      for (const entry of habitLogsResult.data || []) {
        const key = (entry as { habit_id: string }).habit_id
        logsByHabit[key] = (logsByHabit[key] || 0) + 1
      }

      setData({
        habits,
        tasks: tasksResult.tasks,
        goals,
        transactions: (transactionsResult.transactions || []).map((transaction) => ({
          amount: Number(transaction.amount),
          spending_categories: transaction.spending_categories || null,
        })),
        habitLogsByHabit: logsByHabit,
        startDate: range.startDate,
        endDate: range.endDate,
      })
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData(period)
    }, [period])
  )

  const periodDays = data.startDate && data.endDate ? daysBetween(data.startDate, data.endDate) : 1
  const bestHabit = data.habits.reduce<HabitWithStreak | null>(
    (best, habit) => (!best || habit.current_streak > best.current_streak ? habit : best),
    null
  )

  const completedTasks = data.tasks.filter(
    (task) =>
      task.status === 'completed' &&
      task.completed_at &&
      task.completed_at >= `${data.startDate}T00:00:00+05:30` &&
      task.completed_at <= `${data.endDate}T23:59:59+05:30`
  ).length
  const pendingTasks = data.tasks.filter((task) => task.status !== 'completed').length
  const overdueTasks = data.tasks.filter(
    (task) => Boolean(task.due_date && task.status !== 'completed' && task.due_date < todayIST())
  ).length

  const spendingTotal = data.transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const categoryBreakdown = data.transactions.reduce<Record<string, number>>((acc, transaction) => {
    const name = transaction.spending_categories?.name || 'Other'
    acc[name] = (acc[name] || 0) + Number(transaction.amount)
    return acc
  }, {})
  const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]

  const goalsHit = data.goals.filter((goal) => goal.progress_pct >= 100).length
  const goalsMissed = data.goals.filter((goal) => goal.end_date < todayIST() && goal.progress_pct < 100).length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.filterRow}>
        {PERIOD_OPTIONS.map((option) => {
          const active = option.key === period
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setPeriod(option.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        <View style={styles.grid}>
          <ReviewSummary
            title="Best Streak"
            value={bestHabit ? `${bestHabit.name} • ${bestHabit.current_streak}` : '-'}
            subtitle="days"
          />
          <ReviewSummary title="Tasks" value={`${completedTasks}/${data.tasks.length}`} subtitle="completed" />
        </View>
        <View style={styles.grid}>
          <ReviewSummary
            title="Spending"
            value={formatCurrency(spendingTotal)}
            subtitle={topCategory ? `Top: ${topCategory[0]}` : 'No spending'}
          />
          <ReviewSummary title="Goals" value={`${goalsHit} hit`} subtitle={`${goalsMissed} missed`} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habits</Text>
        {data.habits.map((habit) => {
          const completion = Math.round(((data.habitLogsByHabit[habit.id] || 0) / periodDays) * 100)
          return (
            <View key={habit.id} style={styles.rowItem}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle}>{habit.name}</Text>
                <Text style={styles.rowMeta}>{completion}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, completion))}%` }]} />
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <View style={styles.card}>
          <Text style={styles.cardLine}>Completed: {completedTasks}</Text>
          <Text style={styles.cardLine}>Pending: {pendingTasks}</Text>
          <Text style={styles.cardLine}>Overdue: {overdueTasks}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Finance</Text>
        <View style={styles.card}>
          <Text style={styles.cardLine}>Total: {formatCurrency(spendingTotal)}</Text>
          {Object.entries(categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([category, amount]) => (
              <Text key={category} style={styles.cardLine}>
                {category}: {formatCurrency(amount)}
              </Text>
            ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals</Text>
        {data.goals.map((goal) => (
          <View key={goal.id} style={styles.rowItem}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>{goal.title}</Text>
              <Text style={styles.rowMeta}>{goal.progress_pct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, goal.progress_pct))}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {loading ? <Text style={styles.loading}>Refreshing review...</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  filterRow: {
    flexDirection: 'row',
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
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardLine: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  rowItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  loading: {
    marginTop: spacing.lg,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: fontSize.sm,
  },
})

