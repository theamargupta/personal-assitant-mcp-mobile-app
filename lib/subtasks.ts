import { supabase } from './supabase'

export interface Subtask {
  subtask_id: string
  parent_task_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string
  completed_at: string | null
  notes?: string | null
}

export interface AddSubtaskInput {
  parent_task_id: string
  title: string
  notes?: string
}

export interface UpdateSubtaskPatch {
  title?: string
  is_completed?: boolean
  notes?: string
}

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message || fallback
}

export async function listSubtasks(parentTaskId: string): Promise<Subtask[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('parent_task_id', parentTaskId)
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (error) throw new Error(errorMessage(error, 'listSubtasks failed'))
  return ((data || []) as Subtask[]).slice().sort((a, b) => a.position - b.position)
}

export async function addSubtask(input: AddSubtaskInput): Promise<Subtask> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      user_id: userId,
      parent_task_id: input.parent_task_id,
      title: input.title,
      notes: input.notes || null,
      is_completed: false,
    })
    .select('*')
    .single()

  if (error) throw new Error(errorMessage(error, 'addSubtask failed'))
  return data as Subtask
}

export async function updateSubtask(
  subtaskId: string,
  updates: UpdateSubtaskPatch
): Promise<Subtask> {
  const userId = await getUserId()
  const patch: Record<string, unknown> = {}

  if (updates.title !== undefined) patch.title = updates.title
  if (updates.notes !== undefined) patch.notes = updates.notes || null
  if (updates.is_completed !== undefined) {
    patch.is_completed = updates.is_completed
    patch.completed_at = updates.is_completed ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from('subtasks')
    .update(patch)
    .eq('subtask_id', subtaskId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(errorMessage(error, 'updateSubtask failed'))
  return data as Subtask
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('subtask_id', subtaskId)
    .eq('user_id', userId)

  if (error) throw new Error(errorMessage(error, 'deleteSubtask failed'))
}

export async function reorderSubtasks(
  parentTaskId: string,
  orderedSubtaskIds: string[]
): Promise<void> {
  const userId = await getUserId()

  await Promise.all(
    orderedSubtaskIds.map(async (subtaskId, index) => {
      const { error } = await supabase
        .from('subtasks')
        .update({ position: index + 1 })
        .eq('subtask_id', subtaskId)
        .eq('parent_task_id', parentTaskId)
        .eq('user_id', userId)

      if (error) throw new Error(errorMessage(error, 'reorderSubtasks failed'))
    })
  )
}
