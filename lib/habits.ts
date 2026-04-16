import { supabase } from './supabase'

export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

export interface Habit {
  id: string
  name: string
  frequency: HabitFrequency
  description: string | null
  color: string
  reminder_time: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  logged_date: string
  notes: string | null
  created_at: string
}

export interface HabitWithStreak extends Habit {
  current_streak: number
  is_logged_today: boolean
  completion_pct: number
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

export async function createHabit(input: {
  name: string
  frequency: HabitFrequency
  description?: string
  color?: string
  reminder_time?: string
}): Promise<Habit> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: input.name,
      frequency: input.frequency,
      description: input.description || null,
      color: input.color || '#8B5CF6',
      reminder_time: input.reminder_time || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message || 'habits operation failed')
  return data as Habit
}

export async function listHabits(): Promise<HabitWithStreak[]> {
  const userId = await getUserId()
  const today = todayIST()

  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message || 'habits operation failed')
  if (!habits?.length) return []

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sinceDate = dateInIST(thirtyDaysAgo)

  const results: HabitWithStreak[] = []
  for (const habit of habits as Habit[]) {
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('logged_date')
      .eq('habit_id', habit.id)
      .gte('logged_date', sinceDate)
      .order('logged_date', { ascending: false })

    if (logsError) throw logsError

    const logDates = new Set((logs || []).map((entry: { logged_date: string }) => entry.logged_date))
    const isLoggedToday = logDates.has(today)
    const completionPct = Math.round(((logs?.length || 0) / 30) * 100)

    let streak = 0
    const checkDate = new Date(`${today}T12:00:00+05:30`)
    if (!isLoggedToday) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    while (true) {
      const dateStr = dateInIST(checkDate)
      if (logDates.has(dateStr)) {
        streak += 1
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    results.push({
      ...habit,
      current_streak: streak,
      is_logged_today: isLoggedToday,
      completion_pct: completionPct,
    })
  }

  return results
}

export async function logHabit(habitId: string, notes?: string): Promise<void> {
  const userId = await getUserId()
  const today = todayIST()

  const { error } = await supabase.from('habit_logs').insert({
    habit_id: habitId,
    user_id: userId,
    logged_date: today,
    notes: notes || null,
  })

  if (error) {
    if (error.code === '23505') throw new Error('Already logged today')
    throw new Error(error.message || 'logHabit failed')
  }
}

export async function updateHabit(
  habitId: string,
  updates: Partial<{
    name: string
    frequency: HabitFrequency
    description: string
    color: string
    archived: boolean
  }>
): Promise<Habit> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('habits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', habitId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message || 'habits operation failed')
  return data as Habit
}

export async function archiveHabit(habitId: string): Promise<void> {
  await updateHabit(habitId, { archived: true })
}

export async function deleteHabit(habitId: string): Promise<void> {
  const userId = await getUserId()
  // Remove logs first so we don't orphan history (CASCADE may already handle this,
  // but being explicit is safer).
  await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('user_id', userId)
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message || 'habits operation failed')
}
