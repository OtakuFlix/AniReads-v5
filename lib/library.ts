import { supabase } from './supabase'
import type { Database } from './supabase'

type LibraryEntry = Database['public']['Tables']['user_manga_library']['Row']
type LibraryInsert = Database['public']['Tables']['user_manga_library']['Insert']
type LibraryUpdate = Database['public']['Tables']['user_manga_library']['Update']
type CustomList = Database['public']['Tables']['custom_lists']['Row']
type CustomListInsert = Database['public']['Tables']['custom_lists']['Insert']

export type ReadingStatus = 'reading' | 'plan_to_read' | 'on_hold' | 'dropped' | 'completed' | 're_reading'

export const READING_STATUSES: { value: ReadingStatus; label: string; icon: string }[] = [
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'plan_to_read', label: 'Plan to Read', icon: '📋' },
  { value: 'on_hold', label: 'On Hold', icon: '⏸️' },
  { value: 'dropped', label: 'Dropped', icon: '❌' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 're_reading', label: 'Re-Reading', icon: '🔄' },
]

// Library management functions
export async function addToLibrary(
  userId: string,
  mangaData: {
    manga_id: string
    manga_title: string
    manga_slug: string
    poster_url?: string
    total_chapters?: number
  },
  status: ReadingStatus = 'plan_to_read'
) {
  const entry: LibraryInsert = {
    user_id: userId,
    manga_id: mangaData.manga_id,
    manga_title: mangaData.manga_title,
    manga_slug: mangaData.manga_slug,
    poster_url: mangaData.poster_url,
    status,
    total_chapters: mangaData.total_chapters,
    started_at: status === 'reading' ? new Date().toISOString() : null,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('user_manga_library')
    .upsert(entry, { onConflict: 'user_id,manga_id' })
    .select()
    .single()

  return { data, error }
}

export async function updateLibraryEntry(
  userId: string,
  mangaId: string,
  updates: Partial<LibraryUpdate>
) {
  // Handle status change logic
  if (updates.status) {
    if (updates.status === 'reading' && !updates.started_at) {
      updates.started_at = new Date().toISOString()
    }
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString()
    }
    if (updates.status !== 'completed') {
      updates.completed_at = null
    }
  }

  const { data, error } = await supabase
    .from('user_manga_library')
    .update(updates)
    .eq('user_id', userId)
    .eq('manga_id', mangaId)
    .select()
    .single()

  return { data, error }
}

export async function removeFromLibrary(userId: string, mangaId: string) {
  const { error } = await supabase
    .from('user_manga_library')
    .delete()
    .eq('user_id', userId)
    .eq('manga_id', mangaId)

  return { error }
}

export async function getLibraryEntry(userId: string, mangaId: string): Promise<LibraryEntry | null> {
  const { data, error } = await supabase
    .from('user_manga_library')
    .select('*')
    .eq('user_id', userId)
    .eq('manga_id', mangaId)
    .single()

  if (error) return null
  return data
}

export async function getUserLibrary(
  userId: string,
  status?: ReadingStatus,
  customListId?: string
): Promise<LibraryEntry[]> {
  let query = supabase
    .from('user_manga_library')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (customListId) {
    query = query.eq('custom_list_id', customListId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching user library:', error)
    return []
  }

  return data || []
}

export async function getLibraryStats(userId: string) {
  const { data, error } = await supabase
    .from('user_manga_library')
    .select('status')
    .eq('user_id', userId)

  if (error) return null

  const stats = data.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1
    return acc
  }, {} as Record<ReadingStatus, number>)

  return {
    total: data.length,
    ...stats,
  }
}

// Custom lists functions
export async function createCustomList(
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = false
) {
  const listData: CustomListInsert = {
    user_id: userId,
    name,
    description,
    is_public: isPublic,
  }

  const { data, error } = await supabase
    .from('custom_lists')
    .insert(listData)
    .select()
    .single()

  return { data, error }
}

export async function getUserCustomLists(userId: string): Promise<CustomList[]> {
  const { data, error } = await supabase
    .from('custom_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching custom lists:', error)
    return []
  }

  return data || []
}

export async function updateCustomList(
  listId: string,
  updates: { name?: string; description?: string; is_public?: boolean }
) {
  const { data, error } = await supabase
    .from('custom_lists')
    .update(updates)
    .eq('id', listId)
    .select()
    .single()

  return { data, error }
}

export async function deleteCustomList(listId: string) {
  // First, remove the custom_list_id from all manga entries
  await supabase
    .from('user_manga_library')
    .update({ custom_list_id: null })
    .eq('custom_list_id', listId)

  // Then delete the list
  const { error } = await supabase
    .from('custom_lists')
    .delete()
    .eq('id', listId)

  return { error }
}

export async function addMangaToCustomList(
  userId: string,
  mangaId: string,
  customListId: string
) {
  const { data, error } = await supabase
    .from('user_manga_library')
    .update({ custom_list_id: customListId })
    .eq('user_id', userId)
    .eq('manga_id', mangaId)
    .select()
    .single()

  return { data, error }
}

export async function removeMangaFromCustomList(
  userId: string,
  mangaId: string
) {
  const { data, error } = await supabase
    .from('user_manga_library')
    .update({ custom_list_id: null })
    .eq('user_id', userId)
    .eq('manga_id', mangaId)
    .select()
    .single()

  return { data, error }
}