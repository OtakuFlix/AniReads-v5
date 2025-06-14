'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Calendar,
  User,
  Book,
  BookOpen,
  Share2,
  Bookmark as BookmarkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LibraryStatusSelector from '@/components/library/library-status-selector'
import { useBookmark } from '@/hooks/useBookmark'
import { toast } from 'sonner'
import { KitsuManga } from '@/lib/kitsu-api'
import { Chapter } from '@/lib/mangadex-api'

interface MangaHeaderProps {
  kitsuManga: KitsuManga | null
  mangaData: {
    manga_id: string
    manga_title: string
    manga_slug: string
    poster_url: string
    total_chapters: number | undefined
  }
  mangaSlug: string
  chapters: Chapter[]
}

export default function MangaHeader({ kitsuManga, mangaData, mangaSlug, chapters }: MangaHeaderProps) {
  const { isBookmarked, isLoading: isBookmarkLoading, toggleBookmark } = useBookmark(mangaData.manga_id)

  const posterUrl = mangaData.poster_url
  const title = mangaData.manga_title
  const authors = kitsuManga?.relationships?.staff?.data?.map((s: any) => s.attributes?.name || 'Unknown') || []

  const handleBookmarkToggle = async () => {
    const bookmarkData = {
      id: mangaData.manga_id,
      title: title,
      slug: mangaSlug,
      posterUrl: posterUrl,
      type: 'manga' as const,
    }
    const wasBookmarked = isBookmarked
    const success = await toggleBookmark(bookmarkData)
    if (success) {
      toast.success(wasBookmarked ? 'Bookmark removed' : 'Manga bookmarked')
    } else {
      toast.error('Failed to update bookmark')
    }
  }

  const firstChapterId = chapters[0]?.id

  return (
    <div className="space-y-6">
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800/80">
        <Image src={posterUrl || '/placeholder.svg'} alt={title} fill className="object-cover" unoptimized />
      </div>
      <LibraryStatusSelector mangaData={mangaData} onStatusChange={() => {}} />
    </div>
  )
}
