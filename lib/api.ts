import { supabase } from './supabase'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

// ── Transactions ─────────────────────────────────

export interface TransactionInput {
  amount: number
  merchant?: string
  source_app?: string
  category_id?: string
  note?: string
  transaction_date?: string
  raw_sms?: string
  is_auto_detected?: boolean
}

export const api = {
  // Transactions
  createTransaction: (data: TransactionInput) =>
    request('/api/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTransactions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/finance/transactions${query}`)
  },

  categorizeTransaction: (id: string, data: { category_id: string; note?: string }) =>
    request(`/api/finance/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: string) =>
    request(`/api/finance/transactions/${id}`, { method: 'DELETE' }),

  // Categories
  listCategories: () =>
    request<{ categories: Array<{ id: string; name: string; icon: string; is_preset: boolean }> }>(
      '/api/finance/categories'
    ),

  createCategory: (name: string, icon: string) =>
    request('/api/finance/categories', {
      method: 'POST',
      body: JSON.stringify({ name, icon }),
    }),

  deleteCategory: (id: string) =>
    request(`/api/finance/categories/${id}`, { method: 'DELETE' }),

  // Memory
  listMemories: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ memories: MemoryItem[] }>(`/api/memory/items${query}`)
  },

  searchMemories: (q: string, params?: Record<string, string>) => {
    const query = new URLSearchParams({ q, ...(params || {}) }).toString()
    return request<{ results: MemoryItem[] }>(`/api/memory/search?${query}`)
  },

  saveMemory: (data: {
    title: string
    content: string
    category?: string
    tags?: string[]
    space?: string
    force?: boolean
  }) =>
    request('/api/memory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMemory: (id: string, data: {
    title?: string
    content?: string
    category?: string
    tags?: string[]
  }) =>
    request<{ memory: MemoryItem }>(`/api/memory/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteMemory: (id: string) =>
    request(`/api/memory/items/${id}`, { method: 'DELETE' }),
}

// Documents
export const documentsApi = {
  list: () => request<{ documents: DocumentSummary[] }>('/api/documents'),

  get: (id: string) =>
    request<{ document: DocumentSummary; view_url: string | null; view_error?: string | null }>(
      `/api/documents/${id}`
    ),

  create: (data: { name: string; mime_type: string; file_size: number; tags?: string[] }) =>
    request<{
      document: { id: string; name: string; created_at: string; storage_path: string }
      upload_url: string
      storage_path: string
      mime_type: string
    }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markReady: (id: string, fileSize: number) =>
    request<{ document: DocumentSummary }>(`/api/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ready', file_size: fileSize }),
    }),

  delete: (id: string) => request(`/api/documents/${id}`, { method: 'DELETE' }),
}

export interface DocumentSummary {
  id: string
  name: string
  description: string | null
  doc_type: 'pdf' | 'image' | 'other'
  mime_type: string
  file_size: number
  tags: string[]
  status: 'pending' | 'ready'
  created_at: string
}

export interface MemoryItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  project: string | null
  importance: number
  created_at: string
  updated_at: string
  stale_hint?: string | null
  final_score?: number
}
