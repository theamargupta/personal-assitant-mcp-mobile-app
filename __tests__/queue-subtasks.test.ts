jest.mock('@/lib/supabase', () => require('./mocks/supabase'))
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({ isConnected: true }),
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
      } else if (sql.startsWith('DELETE FROM queue WHERE id')) {
        const idx = rows.findIndex((r) => r.id === args[0])
        if (idx >= 0) rows.splice(idx, 1)
      } else if (sql.startsWith('UPDATE queue')) {
        const row = rows.find((r) => r.id === args[1])
        if (row) {
          row.attempts += 1
          row.last_error = args[0] as string
        }
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

import { queueResult, resetSupabaseMock, getFromCalls } from './mocks/supabase'
import { enqueue, syncQueue } from '@/lib/queue'

const sqliteMock = jest.requireMock('expo-sqlite') as {
  __rows: Array<unknown>
}

async function drainQueue() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await syncQueue()
}

beforeEach(() => {
  resetSupabaseMock()
  sqliteMock.__rows.splice(0, sqliteMock.__rows.length)
})

describe('queue — subtasks', () => {
  it('replays subtask create', async () => {
    queueResult({ data: { subtask_id: 's1', title: 'Queued' }, error: null })

    await enqueue('subtask_create', { parent_task_id: 't1', title: 'Queued' })
    await drainQueue()

    const inserts = getFromCalls()[0].chain.calls.filter((c) => c.method === 'insert')
    expect(inserts[0].args[0]).toMatchObject({
      parent_task_id: 't1',
      title: 'Queued',
    })
  })

  it('replays subtask update', async () => {
    queueResult({ data: { subtask_id: 's1', is_completed: true }, error: null })

    await enqueue('subtask_update', { subtask_id: 's1', is_completed: true })
    await drainQueue()

    const chain = getFromCalls()[0].chain
    const updates = chain.calls.filter((c) => c.method === 'update')
    const eqs = chain.calls.filter((c) => c.method === 'eq')
    expect(updates[0].args[0]).toMatchObject({ is_completed: true })
    expect(eqs.some((c) => c.args[0] === 'subtask_id' && c.args[1] === 's1')).toBe(true)
  })

  it('replays subtask delete', async () => {
    queueResult({ data: null, error: null })

    await enqueue('subtask_delete', { subtask_id: 's1' })
    await drainQueue()

    const chain = getFromCalls()[0].chain
    expect(chain.calls.some((c) => c.method === 'delete')).toBe(true)
    expect(
      chain.calls.some((c) => c.method === 'eq' && c.args[0] === 'subtask_id' && c.args[1] === 's1')
    ).toBe(true)
  })

  it('replays subtask reorder in payload order', async () => {
    queueResult({ data: null, error: null })
    queueResult({ data: null, error: null })

    await enqueue('subtask_reorder', {
      parent_task_id: 't1',
      ordered_subtask_ids: ['s2', 's1'],
    })
    await drainQueue()

    expect(
      getFromCalls().map((call) => {
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
      { subtask_id: 's2', position: 1 },
      { subtask_id: 's1', position: 2 },
    ])
  })
})
