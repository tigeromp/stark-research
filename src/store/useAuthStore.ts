import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { supabaseSync } from '../lib/supabaseSync'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: any; needsEmailConfirm?: boolean }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

let authListenerBound = false

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  configured: isSupabaseConfigured(),

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      set({ loading: false, user: null, session: null, configured: false })
      return
    }

    try {
      // Prefer getSession (reads localStorage) then validate lightly
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Session error:', error)
        // Retry once — transient failures shouldn't log the user out
        const retry = await supabase.auth.getSession()
        set({
          user: retry.data.session?.user ?? null,
          session: retry.data.session ?? null,
          loading: false,
          configured: true,
        })
      } else {
        set({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
          configured: true,
        })
      }

      if (!authListenerBound) {
        authListenerBound = true
        supabase.auth.onAuthStateChange((event, nextSession) => {
          // Don't clear UI on transient refresh noise — only update session
          if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            set({
              user: nextSession?.user ?? null,
              session: nextSession ?? null,
              loading: false,
            })
            return
          }

          if (event === 'SIGNED_OUT') {
            supabaseSync.unsubscribe()
            set({ user: null, session: null, loading: false })
            return
          }

          set({
            user: nextSession?.user ?? null,
            session: nextSession ?? null,
            loading: false,
          })
        })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Cloud sync is not available' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (data.session) {
      set({ user: data.session.user, session: data.session })
    }

    return { error }
  },

  signUp: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Cloud sync is not available' } }
    }

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${import.meta.env.BASE_URL}`
        : undefined

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) return { error }

    if (data.session) {
      set({ user: data.session.user, session: data.session })
      return { error: null, needsEmailConfirm: false }
    }

    if (data.user) {
      return { error: null, needsEmailConfirm: true }
    }

    return { error: { message: 'Sign up failed. Try again.' } }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) return
    supabaseSync.unsubscribe()
    await supabase.auth.signOut({ scope: 'local' })
    set({ user: null, session: null })
  },
}))
