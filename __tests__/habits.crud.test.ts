jest.mock('@/lib/supabase', () => require('./mocks/supabase'))

import { queueResult, resetSupabaseMock, getFromCalls } from './mocks/supabase'
import {
  createHabit,
  listHabits,
  logHabit,
  updateHabit,
  deleteHabit,
} from '@/lib/habits'

beforeEach(() => {
  resetSupabaseMock()
})

describe('habits CRUD', () => {
  it('createHabit inserts with defaults', async () => {
    queueResult({
      data: {
        id: 'h1',
        name: 'Meditate',
        frequency: 'daily',
        description: null,
        color: '#8B5CF6',
        reminder_time: null,
        archived: false,
        created_at: '',
        updated_at: '',
      },
      error: null,
    })

    const habit = await createHabit({ name: 'Meditate', frequency: 'daily' })
    expect(habit.id).toBe('h1')

    const calls = getFromCalls()
    expect(calls[0].table).toBe('habits')
    const insert = calls[0].chain.calls.find((c) => c.method === 'insert')!
    expect(insert.args[0]).toMatchObject({
      name: 'Meditate',
      frequency: 'daily',
      color: '#8B5CF6',
    })
  })

  it('listHabits enriches with streaks and today flag', async () => {
    // First query: list habits.
    queueResult({
      data: [
        {
          id: 'h1',
          name: 'Read',
          frequency: 'daily',
          description: null,
          color: '#f00',
          reminder_time: null,
          archived: false,
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    })
    // Second query: habit_logs for h1.
    queueResult({
      data: [{ logged_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }],
      error: null,
    })

    const list = await listHabits()
    expect(list).toHaveLength(1)
    expect(list[0].is_logged_today).toBe(true)
    expect(list[0].current_streak).toBe(1)
  })

  it('logHabit inserts a habit_log row for today', async () => {
    queueResult({ data: null, error: null })
    await logHabit('h1', 'great session')

    const calls = getFromCalls()
    expect(calls[0].table).toBe('habit_logs')
    const insert = calls[0].chain.calls.find((c) => c.method === 'insert')!
    expect(insert.args[0]).toMatchObject({
      habit_id: 'h1',
      notes: 'great session',
    })
  })

  it('logHabit maps unique-constraint error to "Already logged"', async () => {
    queueResult({ data: null, error: { code: '23505', message: 'dup' } })
    await expect(logHabit('h1')).rejects.toThrow('Already logged today')
  })

  it('updateHabit patches fields', async () => {
    queueResult({ data: { id: 'h1', name: 'New', frequency: 'weekly' }, error: null })
    await updateHabit('h1', { name: 'New', frequency: 'weekly' })
    const update = getFromCalls()[0].chain.calls.find((c) => c.method === 'update')!
    expect(update.args[0]).toMatchObject({ name: 'New', frequency: 'weekly' })
  })

  it('deleteHabit cascades through habit_logs then habits', async () => {
    queueResult({ data: null, error: null }) // logs delete
    queueResult({ data: null, error: null }) // habits delete
    await deleteHabit('h1')

    const calls = getFromCalls()
    expect(calls[0].table).toBe('habit_logs')
    expect(calls[1].table).toBe('habits')
    expect(calls[1].chain.calls.some((c) => c.method === 'delete')).toBe(true)
  })
})
