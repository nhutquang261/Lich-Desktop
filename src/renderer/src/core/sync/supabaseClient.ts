import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null
let cachedKey = ''

export function resolveSupabaseConfig(
  settingsUrl?: string,
  settingsAnonKey?: string
): { url: string; anonKey: string } | null {
  const url = (settingsUrl?.trim() || import.meta.env.VITE_SUPABASE_URL || '').trim()
  const anonKey = (settingsAnonKey?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

  if (!url || !anonKey) return null
  if (!url.startsWith('https://')) return null
  return { url, anonKey }
}

export function getSupabaseClient(
  settingsUrl?: string,
  settingsAnonKey?: string
): SupabaseClient | null {
  const config = resolveSupabaseConfig(settingsUrl, settingsAnonKey)
  if (!config) {
    cachedClient = null
    cachedKey = ''
    return null
  }

  const nextKey = `${config.url}::${config.anonKey}`
  if (cachedClient && cachedKey === nextKey) {
    return cachedClient
  }

  cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  })
  cachedKey = nextKey
  return cachedClient
}
