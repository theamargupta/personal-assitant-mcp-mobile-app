jest.mock('@/lib/supabase', () => require('./mocks/supabase'))

import {
  queueResult,
  resetSupabaseMock,
  getFromCalls,
} from './mocks/supabase'
import {
  createTask,
  getTask,
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

  it('getTask fetches a single row scoped to the user', async () => {
    queueResult({
      data: { id: 't1', title: 'A', status: 'pending', priority: 'medium' },
      error: null,
    })

    const task = await getTask('t1')

    expect(task?.id).toBe('t1')
    const chain = getFromCalls()[0].chain
    const selects = chain.calls.filter((c) => c.method === 'select')
    const eqs = chain.calls.filter((c) => c.method === 'eq')
    expect(selects[0].args[0]).toBe('*')
    expect(eqs.some((c) => c.args[0] === 'id' && c.args[1] === 't1')).toBe(true)
    expect(eqs.some((c) => c.args[0] === 'user_id')).toBe(true)
    expect(chain.calls.some((c) => c.method === 'single' || c.method === 'maybeSingle')).toBe(true)
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

describe('tasks CRUD — categorization', () => {
  it('createTask with task_type=project sends project in insert', async () => {
    queueResult({
      data: {
        id: 't2',
        title: 'Project task',
        task_type: 'project',
        project: 'sathi',
        status: 'pending',
        priority: 'medium',
      },
      error: null,
    })

    const task = await createTask({
      title: 'Project task',
      task_type: 'project',
      project: 'sathi',
    })

    expect(task.task_type).toBe('project')
    expect(task.project).toBe('sathi')
    const inserts = getFromCalls()[0].chain.calls.filter((c) => c.method === 'insert')
    expect(inserts[0].args[0]).toMatchObject({
      task_type: 'project',
      project: 'sathi',
    })
  })

  it('createTask defaults task_type=personal and project=null', async () => {
    queueResult({
      data: { id: 't3', title: 'P', task_type: 'personal', project: null },
      error: null,
    })

    await createTask({ title: 'P' })

    const inserts = getFromCalls()[0].chain.calls.filter((c) => c.method === 'insert')
    expect(inserts[0].args[0]).toMatchObject({
      task_type: 'personal',
      project: null,
    })
  })

  it('createTask throws if task_type=project but project is empty/whitespace', async () => {
    await expect(
      createTask({ title: 'x', task_type: 'project', project: '   ' })
    ).rejects.toThrow(/project.*required/i)
  })

  it('listTasks filters by task_type and project', async () => {
    queueResult({ data: [], count: 0, error: null })
    await listTasks({ task_type: 'project', project: 'sathi' })

    const eqs = getFromCalls()[0].chain.calls.filter((c) => c.method === 'eq')
    expect(eqs.some((c) => c.args[0] === 'task_type' && c.args[1] === 'project')).toBe(true)
    expect(eqs.some((c) => c.args[0] === 'project' && c.args[1] === 'sathi')).toBe(true)
  })

  it('updateTask can change task_type from personal to project', async () => {
    queueResult({
      data: { id: 't1', task_type: 'project', project: 'sathi' },
      error: null,
    })

    await updateTask('t1', { task_type: 'project', project: 'sathi' })
    const updates = getFromCalls()[0].chain.calls.filter((c) => c.method === 'update')
    expect(updates[0].args[0]).toMatchObject({
      task_type: 'project',
      project: 'sathi',
    })
  })

  it('updateTask reverting to personal nulls project', async () => {
    queueResult({ data: { id: 't1', task_type: 'personal' }, error: null })
    await updateTask('t1', { task_type: 'personal' })

    const updates = getFromCalls()[0].chain.calls.filter((c) => c.method === 'update')
    expect(updates[0].args[0]).toMatchObject({
      task_type: 'personal',
      project: null,
    })
  })

  it('listTasks returns task.project directly from the row', async () => {
    queueResult({
      data: [
        { id: 't1', title: 'A', task_type: 'project', project: 'sathi' },
      ],
      count: 1,
      error: null,
    })

    const { tasks } = await listTasks()
    expect(tasks[0].task_type).toBe('project')
    expect(tasks[0].project).toBe('sathi')
  })
})
