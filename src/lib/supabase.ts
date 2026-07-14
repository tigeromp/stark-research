import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Anon key is safe to ship in the browser. Defaults keep GitHub Pages builds working
// even when Actions secrets / .env.production are missing.
const DEFAULT_URL = 'https://tntwkojcrbvoryhxmttp.supabase.co'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudHdrb2pjcmJ2b3J5aHhtdHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5ODc3MzQsImV4cCI6MjA5OTU2MzczNH0.w3BawXHjUlP34BMFMTRE6qBo4kOrPT9Xyhn4uIc1IGc'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || DEFAULT_URL
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || DEFAULT_ANON_KEY

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'))

function createSupabaseClient(): SupabaseClient {
  const storage =
    typeof window !== 'undefined'
      ? window.localStorage
      : undefined

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage,
      storageKey: 'arc-auth-token',
      flowType: 'pkce',
    },
  })
}

export const supabase = createSupabaseClient()
