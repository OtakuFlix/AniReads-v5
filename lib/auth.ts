import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  profile?: {
    username: string | null
    avatar_url: string | null
  }
}

export async function signUp(email: string, password: string, username?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || null,
      },
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    profile: profile || { username: null, avatar_url: null }
  }
}

export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}