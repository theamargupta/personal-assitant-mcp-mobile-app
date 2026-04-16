jest.mock('@/lib/supabase', () => require('./mocks/supabase'))

import { queueResult, resetSupabaseMock, getFromCalls } from './mocks/supabase'
import {
  createGoal,
  updateGoal,
  updateGoalStatus,
  deleteGoal,
  toggleMilestone,
} from '@/lib/goals'

beforeEach(() => {
  resetSupabaseMock()
})

describe('goals CRUD', () => {
  it('createGoal inserts a goal row', async () => {
    queueResult({
      data: {
        id: 'g1',
        title: 'Run 100km',
        goal_type: 'outcome',
        metric_type: 'habit_streak',
        status: 'active',
        start_date: '2026-04-01',
        end_date: '2026-12-31',
      },
      error: null,
    })

    const goal = await createGoal({
      title: 'Run 100km',
      goal_type: 'outcome',
      start_date: '2026-04-01',
      end_date: '2026-12-31',
    })

    expect(goal.id).toBe('g1')
    const calls = getFromCalls()
    expect(calls[0].table).toBe('goals')
  })

  it('updateGoal patches title and end_date', async () => {
    queueResult({ data: null, error: null })
    await updateGoal('g1', { title: 'New title', end_date: '2027-01-01' })

    const update = getFromCalls()[0].chain.calls.find((c) => c.method === 'update')!
    expect(update.args[0]).toMatchObject({ title: 'New title', end_date: '2027-01-01' })
  })

  it('updateGoalStatus writes the status', async () => {
    queueResult({ data: null, error: null })
    await updateGoalStatus('g1', 'completed')
    const update = getFromCalls()[0].chain.calls.find((c) => c.method === 'update')!
    expect((update.args[0] as Record<string, unknown>).status).toBe('completed')
  })

  it('deleteGoal removes milestones then the goal', async () => {
    queueResult({ data: null, error: null }) // milestones
    queueResult({ data: null, error: null }) // goals
    await deleteGoal('g1')

    const calls = getFromCalls()
    expect(calls[0].table).toBe('goal_milestones')
    expect(calls[1].table).toBe('goals')
  })

  it('toggleMilestone writes completed + completed_at', async () => {
    queueResult({ data: null, error: null })
    await toggleMilestone('m1', true)

    const calls = getFromCalls()
    expect(calls[0].table).toBe('goal_milestones')
    const update = calls[0].chain.calls.find((c) => c.method === 'update')!
    const patch = update.args[0] as Record<string, unknown>
    expect(patch.completed).toBe(true)
    expect(patch.completed_at).toBeTruthy()
  })
})
