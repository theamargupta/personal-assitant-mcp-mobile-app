jest.mock('@/lib/supabase', () => require('./mocks/supabase'))
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({ isConnected: false }),
    addEventListener: jest.fn(() => () => undefined),
  },
}))
jest.mock('expo-sqlite', () => {
  const rows: Array<{
    id: number
    kind: string
    payload: string
    created_at: number
    attempts: number
    last_error: string | null
  }> = []
  let nextId = 1
  const db = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn(async (sql: string, ...args: unknown[]) => {
      if (sql.startsWith('INSERT INTO queue')) {
        rows.push({
          id: nextId++,
          kind: args[0] as string,
          payload: args[1] as string,
          created_at: args[2] as number,
          attempts: 0,
          last_error: null,
        })
      }
      return {}
    }),
    getAllAsync: jest.fn(async () => rows.slice()),
    getFirstAsync: jest.fn(async () => ({ count: rows.length })),
  }
  return {
    __esModule: true,
    openDatabaseAsync: jest.fn().mockResolvedValue(db),
    __rows: rows,
  }
})

import {
  queueResult,
  resetSupabaseMock,
  getFromCalls,
} from './mocks/supabase'
import {
  addSubtask,
  deleteSubtask,
  listSubtasks,
  reorderSubtasks,
  updateSubtask,
} from '@/lib/subtasks'
import { tryOrQueue } from '@/lib/queue'

const sqliteMock = jest.requireMock('expo-sqlite') as {
  __rows: Array<{ kind: string; payload: string }>
}

beforeEach(() => {
  resetSupabaseMock()
  sqliteMock.__rows.splice(0, sqliteMock.__rows.length)
})

describe('subtasks CRUD', () => {
  it('listSubtasks returns rows sorted by position', async () => {
    queueResult({
      data: [
        { subtask_id: 's2', parent_task_id: 't1', title: 'Second', position: 2 },
        { subtask_id: 's1', parent_task_id: 't1', title: 'First', position: 1 },
      ],
      error: null,
    })

    const subtasks = await listSubtasks('t1')

    expect(subtasks.map((subtask) => subtask.subtask_id)).toEqual(['s1', 's2'])
    const chain = getFromCalls()[0].chain
    const orders = chain.calls.filter((c) => c.method === 'order')
    expect(orders[0].args).toEqual(['position', { ascending: true }])
  })

  it('addSubtask inserts and returns the row', async () => {
    queueResult({
      data: {
        subtask_id: 's1',
        parent_task_id: 't1',
        title: 'Draft tests',
        is_completed: false,
        position: 1,
        created_at: '2026-04-19T00:00:00Z',
        completed_at: null,
        notes: null,
      },
      error: null,
    })

    const subtask = await addSubtask({ parent_task_id: 't1', title: 'Draft tests' })

    expect(subtask.subtask_id).toBe('s1')
    const inserts = getFromCalls()[0].chain.calls.filter((c) => c.method === 'insert')
    expect(inserts).toHaveLength(1)
    expect(inserts[0].args[0]).toMatchObject({
      parent_task_id: 't1',
      title: 'Draft tests',
      is_completed: false,
      notes: null,
    })
  })

  it('addSubtask enqueues with the correct payload when offline', async () => {
    await tryOrQueue('subtask_create', { parent_task_id: 't1', title: 'Offline' }, () =>
      addSubtask({ parent_task_id: 't1', title: 'Offline' })
    )

    expect(sqliteMock.__rows).toHaveLength(1)
    expect(sqliteMock.__rows[0].kind).toBe('subtask_create')
    expect(JSON.parse(sqliteMock.__rows[0].payload)).toEqual({
      parent_task_id: 't1',
      title: 'Offline',
    })
  })

  it('updateSubtask toggles completion on the right row', async () => {
    queueResult({ data: { subtask_id: 's1', is_completed: true }, error: null })

    await updateSubtask('s1', { is_completed: true })

    const chain = getFromCalls()[0].chain
    const updates = chain.calls.filter((c) => c.method === 'update')
    const eqs = chain.calls.filter((c) => c.method === 'eq')
    expect(updates[0].args[0]).toMatchObject({ is_completed: true })
    expect((updates[0].args[0] as Record<string, unknown>).completed_at).toBeTruthy()
    expect(eqs.some((c) => c.args[0] === 'subtask_id' && c.args[1] === 's1')).toBe(true)
  })

  it('updateSubtask edits the title', async () => {
    queueResult({ data: { subtask_id: 's1', title: 'Edited' }, error: null })

    await updateSubtask('s1', { title: 'Edited' })

    const updates = getFromCalls()[0].chain.calls.filter((c) => c.method === 'update')
    expect(updates[0].args[0]).toMatchObject({ title: 'Edited' })
  })

  it('deleteSubtask removes the row and can be queued offline', async () => {
    queueResult({ data: null, error: null })

    await deleteSubtask('s1')

    const chain = getFromCalls()[0].chain
    const deletes = chain.calls.filter((c) => c.method === 'delete')
    const eqs = chain.calls.filter((c) => c.method === 'eq')
    expect(deletes).toHaveLength(1)
    expect(eqs.some((c) => c.args[0] === 'subtask_id' && c.args[1] === 's1')).toBe(true)

    await tryOrQueue('subtask_delete', { subtask_id: 's1' }, () => deleteSubtask('s1'))
    expect(sqliteMock.__rows[0].kind).toBe('subtask_delete')
    expect(JSON.parse(sqliteMock.__rows[0].payload)).toEqual({ subtask_id: 's1' })
  })

  it('reorderSubtasks sends the id array in order', async () => {
    queueResult({ data: null, error: null })
    queueResult({ data: null, error: null })
    queueResult({ data: null, error: null })

    await reorderSubtasks('t1', ['s3', 's1', 's2'])

    const calls = getFromCalls()
    expect(calls).toHaveLength(3)
    expect(
      calls.map((call) => {
        const eq = call.chain.calls.find(
          (c) => c.method === 'eq' && c.args[0] === 'subtask_id'
        )
        const update = call.chain.calls.find((c) => c.method === 'update')
        return {
          subtask_id: eq?.args[1],
          position: (update?.args[0] as { position: number }).position,
        }
      })
    ).toEqual([
      { subtask_id: 's3', position: 1 },
      { subtask_id: 's1', position: 2 },
      { subtask_id: 's2', position: 3 },
    ])
  })
})
