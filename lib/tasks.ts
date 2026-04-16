import { supabase } from './supabase'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  tags: string[]
  created_at: string
  updated_at: string
  completed_at: string | null
}

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function createTask(input: {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  tags?: string[]
}): Promise<Task> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      status: 'pending',
      priority: input.priority || 'medium',
      due_date: input.due_date || null,
      tags: input.tags || [],
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Task
}

export async function listTasks(filters?: {
  status?: TaskStatus
  priority?: TaskPriority
  limit?: number
}): Promise<{ tasks: Task[]; total: number }> {
  const userId = await getUserId()
  let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('user_id', userId)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 50)

  if (error) throw error
  return { tasks: (data || []) as Task[], total: count || 0 }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const userId = await getUserId()
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as Task
}

export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string
    description: string
    priority: TaskPriority
    due_date: string
    tags: string[]
  }>
): Promise<Task> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as Task
}

export async function deleteTask(taskId: string): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId)
  if (error) throw error
}
