/**
 * Chainable Supabase mock used by CRUD tests.
 *
 * Each call to `supabase.from(...)` returns a fresh chain whose methods return
 * itself. Terminal operations (`.single()`, `.maybeSingle()`, `await` directly)
 * consume the head of a per-test result queue. Tests push one result per
 * database round-trip via `queueResult()`.
 */

type QueryResult = { data?: unknown; error?: unknown; count?: number | null }

let resultQueue: QueryResult[] = []
let fromCalls: Array<{ table: string; chain: ChainRecorder }> = []

export function queueResult(result: QueryResult) {
  resultQueue.push(result)
}

export function resetSupabaseMock() {
  resultQueue = []
  fromCalls = []
}

export function getFromCalls() {
  return fromCalls
}

export interface ChainRecorder {
  calls: Array<{ method: string; args: unknown[] }>
}

function nextResult(): QueryResult {
  return resultQueue.shift() || { data: null, error: null }
}

function createChain(): ChainRecorder & Record<string, (...args: unknown[]) => unknown> {
  const recorder: ChainRecorder = { calls: [] }

  const handler: ProxyHandler<ChainRecorder> = {
    get(target, prop: string | symbol) {
      if (prop === 'calls') return target.calls

      if (prop === 'then') {
        return (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(nextResult()).then(resolve, reject)
      }

      if (prop === 'single' || prop === 'maybeSingle') {
        return (...args: unknown[]) => {
          target.calls.push({ method: prop, args })
          return Promise.resolve(nextResult())
        }
      }

      return (...args: unknown[]) => {
        target.calls.push({ method: String(prop), args })
        return proxy
      }
    },
  }

  const proxy = new Proxy(recorder as ChainRecorder & Record<string, (...args: unknown[]) => unknown>, handler)
  return proxy as ChainRecorder & Record<string, (...args: unknown[]) => unknown>
}

export const TEST_USER_ID = 'test-user-id'

export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: TEST_USER_ID } }, error: null }),
    getSession: () =>
      Promise.resolve({ data: { session: { access_token: 'test-token' } }, error: null }),
  },
  from: (table: string) => {
    const chain = createChain()
    fromCalls.push({ table, chain })
    return chain
  },
  storage: {
    from: () => ({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.test/avatar.jpg' } }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'x' }, error: null }),
      createSignedUploadUrl: jest
        .fn()
        .mockResolvedValue({ data: { signedUrl: 'x' }, error: null }),
      remove: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}
