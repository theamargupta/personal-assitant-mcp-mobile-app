import { supabase } from './supabase'

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function fetchProjects(): Promise<string[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('pa_memory_items')
    .select('project')
    .eq('user_id', userId)
    .not('project', 'is', null)

  if (error) {
    throw new Error((error as { message?: string }).message || 'fetchProjects failed')
  }

  const rows = (data as { project: string | null }[] | null) || []
  const distinct = new Set<string>()
  for (const r of rows) {
    const p = (r.project || '').trim()
    if (p) distinct.add(p)
  }
  return [...distinct].sort((a, b) => a.localeCompare(b))
}
