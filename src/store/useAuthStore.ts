import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; needsEmailConfirm?: boolean }>
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
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.error('Session error:', error)

      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        configured: true,
      })

      if (!authListenerBound) {
        authListenerBound = true
        supabase.auth.onAuthStateChange((_event, nextSession) => {
          set({
            user: nextSession?.user ?? null,
            session: nextSession ?? null,
            loading: false,
          })
        })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, user: null, session: null })
    }
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (data.session) {
      set({ user: data.session.user, session: data.session })
    }

    return { error }
  },

  signUp: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL}` : undefined,
      },
    })

    if (error) return { error }

    // If email confirmation is required, session is null until verified
    if (data.session) {
      set({ user: data.session.user, session: data.session })
      return { error: null, needsEmailConfirm: false }
    }

    if (data.user) {
      return { error: null, needsEmailConfirm: true }
    }

    return { error: { message: 'Sign up failed' } }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) return
    await supabase.auth.signOut({ scope: 'local' })
    set({ user: null, session: null })
  },
}))
