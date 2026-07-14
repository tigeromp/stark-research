import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInAnonymously: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      // If Supabase is not configured, work in offline mode
      set({ loading: false, user: null })
      return
    }

    try {
      // Get existing session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
      }
      
      set({ user: session?.user ?? null, loading: false })

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        set({ user: session?.user ?? null })
        
        // Refresh session if needed
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, user: null })
    }
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (data.user) {
      set({ user: data.user })
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
    })
    
    if (data.user) {
      set({ user: data.user })
    }
    
    return { error }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) return

    await supabase.auth.signOut()
    set({ user: null })
  },

  signInAnonymously: async () => {
    if (!isSupabaseConfigured()) {
      set({ user: null, loading: false })
      return
    }

    const { data } = await supabase.auth.signInAnonymously()
    
    if (data.user) {
      set({ user: data.user })
    }
  },
}))
