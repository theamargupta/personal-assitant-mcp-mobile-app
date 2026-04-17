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
  }
})

import { queueResult, resetSupabaseMock, getFromCalls } from './mocks/supabase'
import { enqueue, syncQueue } from '@/lib/queue'

beforeEach(() => {
  resetSupabaseMock()
})

describe('queue — task_create with categorization', () => {
  it('enqueues and replays a project task with task_type+project intact', async () => {
    queueResult({
      data: {
        id: 't9',
        title: 'Q',
        task_type: 'project',
        project: 'sathi',
        status: 'pending',
        priority: 'medium',
      },
      error: null,
    })

    await enqueue('task_create', {
      title: 'Q',
      task_type: 'project',
      project: 'sathi',
    })

    await new Promise((r) => setTimeout(r, 0))
    await syncQueue()

    const calls = getFromCalls().filter((c) => c.table === 'tasks')
    expect(calls.length).toBeGreaterThan(0)
    const inserts = calls[0].chain.calls.filter((c) => c.method === 'insert')
    expect(inserts[0].args[0]).toMatchObject({
      task_type: 'project',
      project: 'sathi',
    })
  })
})
