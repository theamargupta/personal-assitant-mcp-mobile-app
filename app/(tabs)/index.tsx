import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native'
import { MotiView } from 'moti'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { listHabits, logHabit, type HabitWithStreak } from '@/lib/habits'
import { listTasks, updateTaskStatus, type Task } from '@/lib/tasks'
import { listGoals, type GoalWithProgress } from '@/lib/goals'
import { tryOrQueue } from '@/lib/queue'
import { Screen } from '@/components/ui/Screen'
import { Section } from '@/components/ui/Section'
import { Row } from '@/components/ui/Row'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatPill } from '@/components/ui/StatPill'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Haptic } from '@/components/ui/Haptic'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { colors, spacing, radius, fontSize, fontWeight, duration } from '@/constants/theme'

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

function startOfCurrentWeekIST(): string {
  const now = new Date()
  const day = now.getDay()
  const shiftToMonday = day === 0 ? 6 : day - 1
  const start = new Date(now)
  start.setDate(now.getDate() - shiftToMonday)
  return dateInIST(start)
}

function getGreeting(): { main: string; sub: string } {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }).format(new Date())
  )
  if (hour < 12) return { main: 'Good morning', sub: 'A fresh start' }
  if (hour < 18) return { main: 'Good afternoon', sub: 'Keep the momentum' }
  if (hour < 22) return { main: 'Good evening', sub: 'Wind things down' }
  return { main: 'Late night', sub: 'Wrap up and rest' }
}

function priorityWeight(priority: Task['priority']): number {
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  return 1
}

function resolveDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): string {
  if (!user) return 'there'
  const metadata = (user.user_metadata || {}) as { full_name?: string; name?: string; first_name?: string }
  const candidate = metadata.first_name || metadata.full_name || metadata.name
  if (candidate) return String(candidate).split(' ')[0]
  const local = user.email?.split('@')[0] || ''
  if (!local) return 'there'
  const withoutDots = local.split('.')[0] || local
  return withoutDots.length > 14 ? `${withoutDots.slice(0, 13)}…` : withoutDots
}

export default function TodayScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [spendTotal, setSpendTotal] = useState(0)
  const [habits, setHabits] = useState<HabitWithStreak[]>([])
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [completedThisWeek, setCompletedThisWeek] = useState(0)
  const [activeGoals, setActiveGoals] = useState<GoalWithProgress[]>([])

  const loadData = async () => {
    try {
      const weekStart = startOfCurrentWeekIST()
      const [habitsResult, pendingTasksResult, completedTasksResult, goalsResult, txResult] =
        await Promise.all([
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
      const completedCount = completedTasksResult.tasks.filter(
        (task) => task.completed_at && task.completed_at >= `${weekStart}T00:00:00+05:30`
      ).length

      setHabits(habitsResult)
      setPendingTasks(pendingTasksResult.tasks)
      setCompletedThisWeek(completedCount)
      setActiveGoals(goalsResult)
      setTransactions(tx.slice(0, 4))
      setSpendTotal(tx.reduce((sum, item) => sum + Number(item.amount), 0))
    } catch {
      // Keep dashboard resilient on partial API/Supabase failures.
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const bestStreak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, h.current_streak), 0),
    [habits]
  )
  const unloggedHabits = useMemo(
    () => habits.filter((h) => !h.is_logged_today).slice(0, 3),
    [habits]
  )
  const prioritizedTasks = useMemo(
    () =>
      [...pendingTasks]
        .sort((a, b) => {
          const diff = priorityWeight(b.priority) - priorityWeight(a.priority)
          if (diff !== 0) return diff
          return (a.due_date || '').localeCompare(b.due_date || '')
        })
        .slice(0, 3),
    [pendingTasks]
  )

  const leadingGoal = activeGoals[0]

  const handleQuickLog = async (habitId: string) => {
    try {
      await tryOrQueue('habit_log', { habit_id: habitId }, () => logHabit(habitId))
      await loadData()
    } catch (error) {
      Alert.alert('Unable to log habit', error instanceof Error ? error.message : 'Try again')
    }
  }

  const handleQuickTaskComplete = async (taskId: string) => {
    try {
      // Task status updates don't offline-queue yet (need a dedicated kind).
      // Keep the online path; errors still surface to the user.
      await updateTaskStatus(taskId, 'completed')
      await loadData()
    } catch (error) {
      Alert.alert('Unable to update task', error instanceof Error ? error.message : 'Try again')
    }
  }

  const displayName = resolveDisplayName(user)
  const greeting = getGreeting()
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  })

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: duration.slow }}
          style={styles.hero}
        >
          <Text style={styles.date}>{todayLabel.toUpperCase()}</Text>
          <Text style={styles.greeting} numberOfLines={2} adjustsFontSizeToFit>
            {greeting.main},{' '}
            <Text style={styles.name}>{displayName}</Text>
          </Text>
          <Text style={styles.sub}>{greeting.sub}</Text>
        </MotiView>

        <View style={styles.statsGrid}>
          <StatPill label="Best streak" value={bestStreak} accent="#F97316" delay={60} />
          <StatPill label="Tasks this week" value={completedThisWeek} accent="#10B981" delay={120} />
          <StatPill
            label="Spent this week"
            value={`₹${Math.round(spendTotal).toLocaleString('en-IN')}`}
            accent="#F43F5E"
            delay={180}
          />
          <StatPill label="Active goals" value={activeGoals.length} accent="#8B5CF6" delay={240} />
        </View>

        {leadingGoal && (
          <Section title="Leading goal">
            <View style={{ paddingHorizontal: spacing.lg }}>
              <GlassCard glow padding={spacing.lg}>
                <View style={styles.goalRow}>
                  <ProgressRing
                    progress={Math.min(1, leadingGoal.progress_pct / 100)}
                    size={62}
                    stroke={6}
                    label={`${Math.round(leadingGoal.progress_pct)}%`}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {leadingGoal.title}
                    </Text>
                    <Text style={styles.goalSub} numberOfLines={1}>
                      {leadingGoal.metric_type || 'Tracking'}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          </Section>
        )}

        <Section
          title="Today's rituals"
          action={{ label: 'See all', onPress: () => router.push('/habits' as any) }}
        >
          <View style={{ paddingHorizontal: spacing.lg }}>
            <GlassCard padding={0}>
              {loading ? (
                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <SkeletonRow />
                  <SkeletonRow />
                </View>
              ) : unloggedHabits.length ? (
                unloggedHabits.map((habit, idx) => (
                  <View key={habit.id}>
                    <Row
                      leading={
                        <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                      }
                      title={habit.name}
                      subtitle={habit.current_streak ? `🔥 ${habit.current_streak}-day streak` : 'Start a streak today'}
                      trailing={
                        <Haptic
                          haptic="success"
                          onPress={() => handleQuickLog(habit.id)}
                          style={styles.logBtn}
                        >
                          <Text style={styles.logText}>Log</Text>
                        </Haptic>
                      }
                    />
                    {idx < unloggedHabits.length - 1 && <View style={styles.sep} />}
                  </View>
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <FontAwesome name="check-circle" size={18} color={colors.income} />
                  <Text style={styles.emptyText}>All rituals logged. Good work.</Text>
                </View>
              )}
            </GlassCard>
          </View>
        </Section>

        <Section
          title="On your plate"
          action={{ label: 'See all', onPress: () => router.push('/tasks' as any) }}
        >
          <View style={{ paddingHorizontal: spacing.lg }}>
            <GlassCard padding={0}>
              {loading ? (
                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <SkeletonRow />
                  <SkeletonRow />
                </View>
              ) : prioritizedTasks.length ? (
                prioritizedTasks.map((task, idx) => (
                  <View key={task.id}>
                    <Row
                      leading={
                        <Haptic
                          haptic="success"
                          onPress={() => handleQuickTaskComplete(task.id)}
                          style={styles.checkbox}
                        >
                          <FontAwesome name="check" size={10} color={colors.textPrimary} />
                        </Haptic>
                      }
                      title={task.title}
                      subtitle={
                        task.due_date
                          ? `Due ${new Date(task.due_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}`
                          : undefined
                      }
                      trailing={<PriorityChip priority={task.priority} />}
                    />
                    {idx < prioritizedTasks.length - 1 && <View style={styles.sep} />}
                  </View>
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <FontAwesome name="coffee" size={18} color={colors.textMuted} />
                  <Text style={styles.emptyText}>Nothing pending. Time to plan.</Text>
                </View>
              )}
            </GlassCard>
          </View>
        </Section>

        <Section
          title="Recent spend"
          action={{ label: 'See all', onPress: () => router.push('/finance' as any) }}
        >
          <View style={{ paddingHorizontal: spacing.lg }}>
            <GlassCard padding={0}>
              {loading ? (
                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <SkeletonRow />
                </View>
              ) : transactions.length ? (
                transactions.map((tx, idx) => (
                  <View key={tx.id}>
                    <Row
                      leading={
                        <Text style={styles.txIcon}>
                          {tx.spending_categories?.icon || '💰'}
                        </Text>
                      }
                      title={tx.merchant || tx.spending_categories?.name || 'Transaction'}
                      subtitle={new Date(tx.transaction_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      trailing={
                        <Text style={styles.txAmount}>
                          ₹{Math.round(Number(tx.amount)).toLocaleString('en-IN')}
                        </Text>
                      }
                    />
                    {idx < transactions.length - 1 && <View style={styles.sep} />}
                  </View>
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <FontAwesome name="smile-o" size={18} color={colors.income} />
                  <Text style={styles.emptyText}>No spend yet this week.</Text>
                </View>
              )}
            </GlassCard>
          </View>
        </Section>

        <View style={{ height: 200 }} />
      </ScrollView>
    </Screen>
  )
}

function PriorityChip({ priority }: { priority: Task['priority'] }) {
  const map = {
    high: { bg: 'rgba(244,63,94,0.12)', fg: colors.expense, label: 'High' },
    medium: { bg: 'rgba(234,179,8,0.12)', fg: '#EAB308', label: 'Med' },
    low: { bg: 'rgba(161,161,170,0.12)', fg: colors.textMuted, label: 'Low' },
  } as const
  const v = map[priority] || map.low
  return (
    <View style={[styles.chip, { backgroundColor: v.bg }]}>
      <Text style={[styles.chipText, { color: v.fg }]}>{v.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing['4xl'],
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  date: {
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
  },
  name: {
    color: colors.primary,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    rowGap: spacing.sm,
  },
  habitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.5)',
  },
  logText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: spacing.md,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  goalTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  goalSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  txIcon: {
    fontSize: 20,
  },
  txAmount: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
})
