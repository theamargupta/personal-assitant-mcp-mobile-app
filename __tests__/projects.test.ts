jest.mock('@/lib/supabase', () => require('./mocks/supabase'))

import { queueResult, resetSupabaseMock, getFromCalls } from './mocks/supabase'
import { fetchProjects } from '@/lib/projects'
import { useProjectsStore } from '@/lib/stores/projects-store'

beforeEach(() => {
  resetSupabaseMock()
  useProjectsStore.setState({ projects: [], loading: false, error: null, lastFetched: 0 })
})

describe('fetchProjects', () => {
  it('returns distinct sorted projects', async () => {
    queueResult({
      data: [{ project: 'sathi' }, { project: 'client-a' }, { project: 'sathi' }],
      error: null,
    })

    const result = await fetchProjects()
    expect(result).toEqual(['client-a', 'sathi'])
    const calls = getFromCalls()
    expect(calls[0].table).toBe('pa_memory_items')
  })

  it('filters out null/empty values', async () => {
    queueResult({
      data: [{ project: null }, { project: '' }, { project: 'x' }],
      error: null,
    })

    expect(await fetchProjects()).toEqual(['x'])
  })

  it('throws on error', async () => {
    queueResult({ data: null, error: { message: 'boom' } })
    await expect(fetchProjects()).rejects.toThrow('boom')
  })
})

describe('useProjectsStore', () => {
  it('loadProjects populates state', async () => {
    queueResult({ data: [{ project: 'sathi' }], error: null })
    await useProjectsStore.getState().loadProjects()
    expect(useProjectsStore.getState().projects).toEqual(['sathi'])
    expect(useProjectsStore.getState().loading).toBe(false)
  })

  it('skips refetch if called within staleness window', async () => {
    queueResult({ data: [{ project: 'a' }], error: null })
    await useProjectsStore.getState().loadProjects()
    await useProjectsStore.getState().loadProjects()
    expect(useProjectsStore.getState().projects).toEqual(['a'])
    expect(getFromCalls()).toHaveLength(1)
  })

  it('force refetch bypasses staleness', async () => {
    queueResult({ data: [{ project: 'a' }], error: null })
    await useProjectsStore.getState().loadProjects()
    queueResult({ data: [{ project: 'a' }, { project: 'b' }], error: null })
    await useProjectsStore.getState().loadProjects(true)
    expect(useProjectsStore.getState().projects).toEqual(['a', 'b'])
  })

  it('addLocalProject inserts sorted, no duplicates', () => {
    useProjectsStore.setState({ projects: ['b'] })
    useProjectsStore.getState().addLocalProject('a')
    useProjectsStore.getState().addLocalProject('a')
    useProjectsStore.getState().addLocalProject('  ')
    expect(useProjectsStore.getState().projects).toEqual(['a', 'b'])
  })
})
