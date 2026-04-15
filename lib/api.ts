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
}
