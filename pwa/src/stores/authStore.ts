import { create } from 'zustand'
import { supabase, type Profile } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  fetchProfile: (userId: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data as Profile })
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  }
}))
