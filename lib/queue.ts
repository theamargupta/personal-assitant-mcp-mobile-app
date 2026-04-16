import * as SQLite from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'
import { api } from './api'
import { logHabit } from './habits'
import { createTask } from './tasks'

export type QueueKind = 'habit_log' | 'task_create' | 'transaction_create'

export interface QueuedItem {
  id: number
  kind: QueueKind
  payload: Record<string, unknown>
  createdAt: number
  attempts: number
  lastError?: string
}

const DB_NAME = 'sathi-queue.db'
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null
const listeners = new Set<(count: number) => void>()
let syncing = false

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME)
      await db.execAsync(`
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kind TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT
        );
      `)
      return db
    })()
  }
  return dbPromise
}

async function notifyCount() {
  const count = await pendingCount()
  for (const listener of listeners) listener(count)
}

export function subscribePending(listener: (count: number) => void): () => void {
  listeners.add(listener)
  pendingCount().then(listener).catch(() => undefined)
  return () => {
    listeners.delete(listener)
  }
}

export async function pendingCount(): Promise<number> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM queue')
  return row?.count || 0
}

export async function enqueue(kind: QueueKind, payload: Record<string, unknown>): Promise<void> {
  const db = await getDb()
  await db.runAsync(
    'INSERT INTO queue (kind, payload, created_at) VALUES (?, ?, ?)',
    kind,
    JSON.stringify(payload),
    Date.now()
  )
  void notifyCount()
  // Best-effort — try sync immediately if we're online.
  void syncQueue().catch(() => undefined)
}

async function list(): Promise<QueuedItem[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<{
    id: number
    kind: QueueKind
    payload: string
    created_at: number
    attempts: number
    last_error: string | null
  }>('SELECT id, kind, payload, created_at, attempts, last_error FROM queue ORDER BY id ASC')
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    payload: JSON.parse(r.payload),
    createdAt: r.created_at,
    attempts: r.attempts,
    lastError: r.last_error || undefined,
  }))
}

async function removeItem(id: number): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM queue WHERE id = ?', id)
}

async function bumpAttempt(id: number, error: string): Promise<void> {
  const db = await getDb()
  await db.runAsync(
    'UPDATE queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
    error,
    id
  )
}

async function runItem(item: QueuedItem): Promise<void> {
  switch (item.kind) {
    case 'habit_log': {
      const habitId = item.payload.habit_id as string
      const notes = item.payload.notes as string | undefined
      await logHabit(habitId, notes)
      break
    }
    case 'task_create': {
      await createTask(item.payload as Parameters<typeof createTask>[0])
      break
    }
    case 'transaction_create': {
      await api.createTransaction(
        item.payload as unknown as Parameters<typeof api.createTransaction>[0]
      )
      break
    }
    default:
      throw new Error(`Unknown queue kind: ${item.kind}`)
  }
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing) return { synced: 0, failed: 0 }
  syncing = true
  let synced = 0
  let failed = 0
  try {
    const net = await NetInfo.fetch()
    if (!net.isConnected) return { synced, failed }

    const items = await list()
    for (const item of items) {
      try {
        await runItem(item)
        await removeItem(item.id)
        synced++
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'failed'
        await bumpAttempt(item.id, msg)
        failed++
        // Abort the batch on auth failures — likely everything else will fail too.
        if (msg.toLowerCase().includes('not authenticated')) break
        // Drop items that have tried >5 times so the queue doesn't jam forever.
        if (item.attempts >= 4) await removeItem(item.id)
      }
    }
  } finally {
    syncing = false
    void notifyCount()
  }
  return { synced, failed }
}

/**
 * Wraps a function so the operation is tried online first, and if that fails
 * because the device is offline or the network rejects us, it's queued for
 * later retry. Callers see an optimistic success (the returned promise resolves
 * with `{ queued: true }` when queued, or the online result otherwise).
 */
export async function tryOrQueue<T>(
  kind: QueueKind,
  payload: Record<string, unknown>,
  run: () => Promise<T>
): Promise<{ queued: false; result: T } | { queued: true }> {
  const net = await NetInfo.fetch()
  if (!net.isConnected) {
    await enqueue(kind, payload)
    return { queued: true }
  }
  try {
    const result = await run()
    return { queued: false, result }
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Network') || msg.includes('Failed to fetch')) {
      await enqueue(kind, payload)
      return { queued: true }
    }
    throw error
  }
}

export function startOnlineSync(): () => void {
  const unsub = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void syncQueue().catch(() => undefined)
    }
  })
  return unsub
}
