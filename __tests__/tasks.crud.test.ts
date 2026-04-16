jest.mock('@/lib/supabase', () => require('./mocks/supabase'))

import {
  queueResult,
  resetSupabaseMock,
  getFromCalls,
} from './mocks/supabase'
import {
  createTask,
  listTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '@/lib/tasks'

beforeEach(() => {
  resetSupabaseMock()
})

describe('tasks CRUD', () => {
  it('createTask inserts and returns the row', async () => {
    queueResult({
      data: {
        id: 't1',
        title: 'Ship PR',
        description: null,
        status: 'pending',
        priority: 'medium',
        due_date: null,
        tags: [],
        created_at: '2026-04-17',
        updated_at: '2026-04-17',
        completed_at: null,
      },
      error: null,
    })

    const task = await createTask({ title: 'Ship PR' })

    expect(task.id).toBe('t1')
    expect(task.title).toBe('Ship PR')
    const calls = getFromCalls()
    expect(calls[0].table).toBe('tasks')
    const inserts = calls[0].chain.calls.filter((c) => c.method === 'insert')
    expect(inserts).toHaveLength(1)
    expect(inserts[0].args[0]).toMatchObject({
      title: 'Ship PR',
      status: 'pending',
      priority: 'medium',
    })
  })

  it('listTasks returns rows and total count', async () => {
    queueResult({
      data: [
        { id: 't1', title: 'A', status: 'pending', priority: 'high' },
        { id: 't2', title: 'B', status: 'pending', priority: 'low' },
      ],
      count: 2,
      error: null,
    })

    const result = await listTasks({ status: 'pending' })
    expect(result.total).toBe(2)
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0].title).toBe('A')
  })

  it('updateTask patches the row', async () => {
    queueResult({
      data: { id: 't1', title: 'Updated', priority: 'high' },
      error: null,
    })

    await updateTask('t1', { title: 'Updated', priority: 'high' })
    const calls = getFromCalls()
    const updates = calls[0].chain.calls.filter((c) => c.method === 'update')
    expect(updates).toHaveLength(1)
    expect(updates[0].args[0]).toMatchObject({ title: 'Updated', priority: 'high' })
  })

  it('updateTaskStatus sets completed_at when completing', async () => {
    queueResult({ data: { id: 't1', status: 'completed' }, error: null })
    await updateTaskStatus('t1', 'completed')

    const calls = getFromCalls()
    const updates = calls[0].chain.calls.filter((c) => c.method === 'update')
    const patch = updates[0].args[0] as Record<string, unknown>
    expect(patch.status).toBe('completed')
    expect(patch.completed_at).toBeTruthy()
  })

  it('updateTaskStatus clears completed_at when reverting', async () => {
    queueResult({ data: { id: 't1', status: 'pending' }, error: null })
    await updateTaskStatus('t1', 'pending')

    const updates = getFromCalls()[0].chain.calls.filter((c) => c.method === 'update')
    const patch = updates[0].args[0] as Record<string, unknown>
    expect(patch.completed_at).toBeNull()
  })

  it('deleteTask issues a delete scoped to user', async () => {
    queueResult({ data: null, error: null })
    await deleteTask('t1')

    const chain = getFromCalls()[0].chain
    const deletes = chain.calls.filter((c) => c.method === 'delete')
    const eqs = chain.calls.filter((c) => c.method === 'eq')
    expect(deletes).toHaveLength(1)
    expect(eqs.some((c) => c.args[0] === 'id' && c.args[1] === 't1')).toBe(true)
    expect(eqs.some((c) => c.args[0] === 'user_id')).toBe(true)
  })

  it('createTask propagates errors', async () => {
    queueResult({ data: null, error: new Error('nope') })
    await expect(createTask({ title: 'x' })).rejects.toThrow('nope')
  })
})
