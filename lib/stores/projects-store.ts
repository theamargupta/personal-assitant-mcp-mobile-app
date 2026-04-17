import { useCallback } from 'react'
import { create } from 'zustand'
import { fetchProjects } from '@/lib/projects'

const STALE_MS = 60 * 1000

interface ProjectsState {
  projects: string[]
  loading: boolean
  error: string | null
  lastFetched: number
  loadProjects: (force?: boolean) => Promise<void>
  addLocalProject: (project: string) => void
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  lastFetched: 0,

  loadProjects: async (force = false) => {
    const { lastFetched, loading } = get()
    if (loading) return
    if (!force && lastFetched && Date.now() - lastFetched < STALE_MS) return
    set({ loading: true, error: null })
    try {
      const projects = await fetchProjects()
      set({ projects, loading: false, lastFetched: Date.now() })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load projects',
      })
    }
  },

  addLocalProject: (project: string) => {
    const trimmed = project.trim()
    if (!trimmed) return
    const { projects } = get()
    if (projects.includes(trimmed)) return
    set({ projects: [...projects, trimmed].sort((a, b) => a.localeCompare(b)) })
  },
}))

export function useProjects() {
  const projects = useProjectsStore((s) => s.projects)
  const loading = useProjectsStore((s) => s.loading)
  const error = useProjectsStore((s) => s.error)
  const loadProjects = useProjectsStore((s) => s.loadProjects)
  const addLocalProject = useProjectsStore((s) => s.addLocalProject)
  const reload = useCallback(() => loadProjects(true), [loadProjects])
  return { projects, loading, error, reload, addLocalProject }
}
