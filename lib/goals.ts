import { supabase } from './supabase'

export type GoalType = 'outcome' | 'milestone'
export type GoalStatus = 'active' | 'completed' | 'failed' | 'archived'
export type MetricType = 'habit_streak' | 'habit_completion' | 'tasks_completed' | 'spending_limit'

export interface Goal {
  id: string
  title: string
  description: string | null
  goal_type: GoalType
  metric_type: MetricType | null
  metric_ref_id: string | null
  target_value: number | null
  is_recurring: boolean
  recurrence: 'weekly' | 'monthly' | null
  start_date: string
  end_date: string
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface GoalMilestone {
  id: string
  goal_id: string
  title: string
  sort_order: number
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface GoalWithProgress extends Goal {
  current_value: number
  progress_pct: number
  milestones?: GoalMilestone[]
}

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

function dateInIST(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function todayIST(): string {
  return dateInIST(new Date())
}

export async function createGoal(input: {
  title: string
  description?: string
  goal_type: GoalType
  metric_type?: MetricType
  metric_ref_id?: string
  target_value?: number
  start_date: string
  end_date: string
  milestones?: string[]
}): Promise<Goal> {
  const userId = await getUserId()
  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      goal_type: input.goal_type,
      metric_type: input.metric_type || null,
      metric_ref_id: input.metric_ref_id || null,
      target_value: input.target_value || null,
      is_recurring: false,
      recurrence: null,
      start_date: input.start_date,
      end_date: input.end_date,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) throw error

  if (input.goal_type === 'milestone' && input.milestones?.length) {
    const milestoneRows = input.milestones.map((title, index) => ({
      goal_id: (goal as Goal).id,
      user_id: userId,
      title,
      sort_order: index + 1,
    }))
    const { error: milestonesError } = await supabase.from('goal_milestones').insert(milestoneRows)
    if (milestonesError) throw milestonesError
  }

  return goal as Goal
}

export async function listGoals(statusFilter?: GoalStatus): Promise<GoalWithProgress[]> {
  const userId = await getUserId()
  let query = supabase.from('goals').select('*').eq('user_id', userId)
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: goals, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  if (!goals?.length) return []

  const results: GoalWithProgress[] = []
  for (const goal of goals as Goal[]) {
    const progress = await computeProgress(userId, goal)
    results.push({
      ...goal,
      current_value: progress.currentValue,
      progress_pct: progress.progressPct,
      milestones: progress.milestones,
    })
  }
  return results
}

async function computeProgress(
  userId: string,
  goal: Goal
): Promise<{ currentValue: number; progressPct: number; milestones?: GoalMilestone[] }> {
  if (goal.goal_type === 'milestone') {
    const { data: milestones, error } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goal.id)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const items = (milestones || []) as GoalMilestone[]
    const total = items.length
    const done = items.filter((item) => item.completed).length
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    return { currentValue: done, progressPct: pct, milestones: items }
  }

  const target = goal.target_value || 0
  let currentValue = 0
  const startDate = goal.start_date
  const endDate = goal.end_date

  switch (goal.metric_type) {
    case 'habit_streak': {
      if (!goal.metric_ref_id) break
      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('logged_date')
        .eq('habit_id', goal.metric_ref_id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate)
        .order('logged_date', { ascending: false })

      if (error) throw error

      const logDates = new Set((logs || []).map((entry: { logged_date: string }) => entry.logged_date))
      let streak = 0
      const checkDate = new Date(`${todayIST()}T12:00:00+05:30`)
      while (true) {
        const dateStr = dateInIST(checkDate)
        if (dateStr < startDate) break
        if (logDates.has(dateStr)) {
          streak += 1
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
      currentValue = streak
      break
    }
    case 'habit_completion': {
      if (!goal.metric_ref_id) break
      const start = new Date(`${startDate}T00:00:00+05:30`)
      const end = new Date(`${endDate}T23:59:59+05:30`)
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const { count, error } = await supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('habit_id', goal.metric_ref_id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate)

      if (error) throw error
      currentValue = totalDays > 0 ? Math.round((((count || 0) / totalDays) * 100 + Number.EPSILON) * 10) / 10 : 0
      break
    }
    case 'tasks_completed': {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', `${startDate}T00:00:00+05:30`)
        .lte('completed_at', `${endDate}T23:59:59+05:30`)

      if (error) throw error
      currentValue = count || 0
      break
    }
    case 'spending_limit': {
      let query = supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('transaction_date', `${startDate}T00:00:00+05:30`)
        .lte('transaction_date', `${endDate}T23:59:59+05:30`)

      if (goal.metric_ref_id) query = query.eq('category_id', goal.metric_ref_id)

      const { data: transactions, error } = await query
      if (error) throw error

      currentValue = (transactions || []).reduce(
        (sum: number, transaction: { amount: string | number }) => sum + Number(transaction.amount),
        0
      )
      break
    }
    default:
      currentValue = 0
  }

  const progressPct =
    goal.metric_type === 'spending_limit'
      ? target === 0
        ? 0
        : Math.round(Math.max(0, (1 - currentValue / target) * 100))
      : target === 0
        ? 0
        : Math.round(Math.min(100, (currentValue / target) * 100))

  return { currentValue, progressPct }
}

export async function toggleMilestone(milestoneId: string, completed: boolean): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('goal_milestones')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function updateGoalStatus(goalId: string, status: GoalStatus): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('goals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function updateGoal(
  goalId: string,
  updates: Partial<{
    title: string
    description: string
    target_value: number
    end_date: string
    start_date: string
    metric_type: MetricType
  }>
): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteGoal(goalId: string): Promise<void> {
  const userId = await getUserId()
  // Delete milestones first (CASCADE should handle but being explicit).
  await supabase.from('goal_milestones').delete().eq('goal_id', goalId)
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)
  if (error) throw error
}
