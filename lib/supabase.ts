import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Local: copy .env.example to .env. ' +
      'EAS: set both for the matching environment (e.g. production) at expo.dev → Environment variables, ' +
      'or `eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment production --visibility plaintext`. ' +
      'EXPO_PUBLIC_ vars must not use "secret" visibility or they will not be embedded in the client bundle.'
  )
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
