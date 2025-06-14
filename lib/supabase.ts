import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_manga_library: {
        Row: {
          id: string
          user_id: string
          manga_id: string
          manga_title: string
          manga_slug: string
          poster_url: string | null
          status: 'reading' | 'plan_to_read' | 'on_hold' | 'dropped' | 'completed' | 're_reading'
          custom_list_id: string | null
          progress: number
          total_chapters: number | null
          rating: number | null
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          manga_id: string
          manga_title: string
          manga_slug: string
          poster_url?: string | null
          status: 'reading' | 'plan_to_read' | 'on_hold' | 'dropped' | 'completed' | 're_reading'
          custom_list_id?: string | null
          progress?: number
          total_chapters?: number | null
          rating?: number | null
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          manga_id?: string
          manga_title?: string
          manga_slug?: string
          poster_url?: string | null
          status?: 'reading' | 'plan_to_read' | 'on_hold' | 'dropped' | 'completed' | 're_reading'
          custom_list_id?: string | null
          progress?: number
          total_chapters?: number | null
          rating?: number | null
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      custom_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}