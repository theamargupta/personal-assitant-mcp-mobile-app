jest.mock('@/lib/supabase', () => require('./mocks/supabase'))

import { api, documentsApi } from '@/lib/api'

interface MockResponse {
  ok?: boolean
  status?: number
  json?: unknown
}

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

function mockOnce(response: MockResponse) {
  fetchMock.mockResolvedValueOnce({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: jest.fn().mockResolvedValue(response.json ?? {}),
  })
}

function lastCall(): { url: string; init: RequestInit } {
  const args = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
  return { url: String(args[0]), init: args[1] as RequestInit }
}

describe('api (fetch-based) CRUD', () => {
  describe('transactions', () => {
    it('createTransaction posts body and auth header', async () => {
      mockOnce({ json: { id: 'tx1' } })
      await api.createTransaction({ amount: 250, merchant: 'Coffee' })

      const call = lastCall()
      expect(call.url).toContain('/api/finance/transactions')
      expect(call.init.method).toBe('POST')
      const body = JSON.parse(call.init.body as string)
      expect(body).toMatchObject({ amount: 250, merchant: 'Coffee' })
      expect((call.init.headers as Record<string, string>).Authorization).toBe(
        'Bearer test-token'
      )
    })

    it('listTransactions hits GET with query params', async () => {
      mockOnce({ json: { transactions: [] } })
      await api.listTransactions({ start_date: '2026-04-01', limit: '10' })
      const call = lastCall()
      expect(call.url).toContain('start_date=2026-04-01')
      expect(call.url).toContain('limit=10')
    })

    it('categorizeTransaction PATCHes the row', async () => {
      mockOnce({ json: {} })
      await api.categorizeTransaction('tx1', { category_id: 'c1', note: 'x' })
      const call = lastCall()
      expect(call.url).toContain('/api/finance/transactions/tx1')
      expect(call.init.method).toBe('PATCH')
    })

    it('deleteTransaction DELETEs the row', async () => {
      mockOnce({ status: 204, json: {} })
      await api.deleteTransaction('tx1')
      expect(lastCall().init.method).toBe('DELETE')
    })

    it('surfaces error body from non-OK responses', async () => {
      mockOnce({ ok: false, status: 400, json: { error: 'bad' } })
      await expect(api.createTransaction({ amount: 1 })).rejects.toThrow('bad')
    })
  })

  describe('memory', () => {
    it('listMemories GETs /api/memory/items', async () => {
      mockOnce({ json: { memories: [] } })
      await api.listMemories({ limit: '10' })
      expect(lastCall().url).toContain('/api/memory/items?limit=10')
    })

    it('searchMemories GETs /api/memory/search with q=', async () => {
      mockOnce({ json: { results: [] } })
      await api.searchMemories('testing', { limit: '5' })
      const url = lastCall().url
      expect(url).toContain('/api/memory/search?q=testing')
      expect(url).toContain('limit=5')
    })

    it('saveMemory POSTs', async () => {
      mockOnce({ json: { status: 'saved', memory: { id: 'm1' } } })
      await api.saveMemory({ title: 't', content: 'c', category: 'note', force: true })
      const call = lastCall()
      expect(call.init.method).toBe('POST')
      const body = JSON.parse(call.init.body as string)
      expect(body).toMatchObject({ title: 't', content: 'c', force: true })
    })

    it('updateMemory PATCHes by id', async () => {
      mockOnce({ json: { memory: { id: 'm1' } } })
      await api.updateMemory('m1', { title: 'new' })
      const call = lastCall()
      expect(call.url).toContain('/api/memory/items/m1')
      expect(call.init.method).toBe('PATCH')
    })

    it('deleteMemory DELETEs by id', async () => {
      mockOnce({ status: 204, json: {} })
      await api.deleteMemory('m1')
      expect(lastCall().init.method).toBe('DELETE')
    })
  })

  describe('documents', () => {
    it('list returns documents array', async () => {
      mockOnce({ json: { documents: [{ id: 'd1', name: 'x' }] } })
      const res = await documentsApi.list()
      expect(res.documents).toHaveLength(1)
    })

    it('create POSTs then returns signed upload URL', async () => {
      mockOnce({
        json: {
          document: { id: 'd1', name: 'x', created_at: '', storage_path: 'p' },
          upload_url: 'https://s/u',
          storage_path: 'p',
          mime_type: 'application/pdf',
        },
      })
      const res = await documentsApi.create({
        name: 'bill.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
      })
      expect(res.upload_url).toBe('https://s/u')
      expect(lastCall().init.method).toBe('POST')
    })

    it('markReady PATCHes with status=ready', async () => {
      mockOnce({ json: { document: { id: 'd1', status: 'ready' } } })
      await documentsApi.markReady('d1', 1024)
      const body = JSON.parse(lastCall().init.body as string)
      expect(body).toMatchObject({ status: 'ready', file_size: 1024 })
    })

    it('delete DELETEs', async () => {
      mockOnce({ status: 204, json: {} })
      await documentsApi.delete('d1')
      expect(lastCall().init.method).toBe('DELETE')
    })
  })
})
