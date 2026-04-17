import { supabase } from './supabase'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskType = 'personal' | 'project'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  tags: string[]
  task_type: TaskType
  project: string | null
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

function normalizeCategorization(
  task_type: TaskType | undefined,
  project: string | null | undefined
): { task_type: TaskType; project: string | null } {
  const type: TaskType = task_type || 'personal'
  if (type === 'project') {
    const slug = (project || '').trim()
    if (!slug) throw new Error('project is required when task_type is "project"')
    return { task_type: 'project', project: slug }
  }
  return { task_type: 'personal', project: null }
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  tags?: string[]
  task_type?: TaskType
  project?: string | null
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const userId = await getUserId()
  const cat = normalizeCategorization(input.task_type, input.project)

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
      task_type: cat.task_type,
      project: cat.project,
    })
    .select('*')
    .single()

  if (error) throw new Error((error as { message?: string }).message || 'createTask failed')
  return data as Task
}

export interface ListTasksFilters {
  status?: TaskStatus
  priority?: TaskPriority
  task_type?: TaskType
  project?: string
  limit?: number
}

export async function listTasks(
  filters?: ListTasksFilters
): Promise<{ tasks: Task[]; total: number }> {
  const userId = await getUserId()
  let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('user_id', userId)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.task_type) query = query.eq('task_type', filters.task_type)
  if (filters?.project) query = query.eq('project', filters.project)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 50)

  if (error) throw new Error((error as { message?: string }).message || 'listTasks failed')
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

  if (error) throw new Error((error as { message?: string }).message || 'updateTaskStatus failed')
  return data as Task
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  tags?: string[]
  task_type?: TaskType
  project?: string | null
}

export async function updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
  const userId = await getUserId()

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (updates.title !== undefined) patch.title = updates.title
  if (updates.description !== undefined) patch.description = updates.description
  if (updates.priority !== undefined) patch.priority = updates.priority
  if (updates.due_date !== undefined) patch.due_date = updates.due_date
  if (updates.tags !== undefined) patch.tags = updates.tags

  if (updates.task_type !== undefined) {
    const cat = normalizeCategorization(updates.task_type, updates.project)
    patch.task_type = cat.task_type
    patch.project = cat.project
  } else if (updates.project !== undefined) {
    patch.project = updates.project ? updates.project.trim() || null : null
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error((error as { message?: string }).message || 'updateTask failed')
  return data as Task
}

export async function deleteTask(taskId: string): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId)
  if (error) throw new Error((error as { message?: string }).message || 'deleteTask failed')
}
