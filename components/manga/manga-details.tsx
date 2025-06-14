'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Chapter } from '@/lib/mangadx-api'
import { KitsuManga } from '@/lib/kitsu-api'
import { Star, Calendar, User, Book, List, ChevronDown, BookOpen, Share2, Bookmark as BookmarkIcon, Download } from 'lucide-react'
import { useBookmark } from '@/hooks/useBookmark'
import { toast } from 'sonner'

interface MangaDetailsProps {
  kitsuManga: KitsuManga | null
  chapters: Chapter[]
  mangaSlug: string
}

function Synopsis({ description, genres }: { description: string; genres: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLongDescription = description.length > 400

  return (
    <div className="prose prose-invert prose-p:text-gray-300 prose-strong:text-white max-w-none">
      <div
        className={`relative ${!isExpanded && isLongDescription ? 'max-h-40 overflow-hidden' : ''}`}
        dangerouslySetInnerHTML={{ __html: description }}
      />
      {!isExpanded && isLongDescription && (
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-900 to-transparent" />
      )}
      {isLongDescription && (
        <Button variant="link" onClick={() => setIsExpanded(!isExpanded)} className="text-red-400 pl-0">
          {isExpanded ? 'Read Less' : 'Read More'}
        </Button>
      )}
      <div className="flex flex-wrap gap-2 pt-4">
        {genres.map(genre => (
          <Badge key={genre} variant="secondary">{genre}</Badge>
        ))}
      </div>
    </div>
  )
}

function ChapterList({ chapters, mangaSlug, mangaTitle }: { chapters: Chapter[]; mangaSlug: string; mangaTitle: string }) {
  const [visibleChapters, setVisibleChapters] = useState(50)

  const handleDownloadChapter = async (chapter: Chapter) => {
    try {
      // Get chapter pages
      const response = await fetch(`/api/proxy/mangadx/at-home/server/${chapter.id}`)
      const pagesData = await response.json()
      
      if (!pagesData.chapter?.data) {
        toast.error('Failed to get chapter pages')
        return
      }

      const baseUrl = pagesData.baseUrl
      const chapterHash = pagesData.chapter.hash
      const pages = pagesData.chapter.data

      // Create download data
      const downloadData = {
        id: `${mangaSlug}-${chapter.id}`,
        mangaId: mangaSlug,
        mangaTitle: mangaTitle,
        mangaSlug: mangaSlug,
        chapterId: chapter.id,
        chapterNumber: chapter.attributes.chapter || "Unknown",
        chapterTitle: chapter.attributes.title || "",
        posterUrl: "/placeholder.svg",
        pages: pages.map((page: string) => `${baseUrl}/data/${chapterHash}/${page}`),
        downloadedAt: new Date().toISOString(),
        size: pages.length * 500000 // Estimate 500KB per page
      }

      // Save to localStorage
      const existingDownloads = JSON.parse(localStorage.getItem('manga_downloads') || '[]')
      const updatedDownloads = existingDownloads.filter((d: any) => d.id !== downloadData.id)
      updatedDownloads.push(downloadData)
      
      localStorage.setItem('manga_downloads', JSON.stringify(updatedDownloads))
      toast.success(`Chapter ${chapter.attributes.chapter} downloaded for offline reading!`)
    } catch (error) {
      console.error('Error downloading chapter:', error)
      toast.error('Failed to download chapter')
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <List className="w-12 h-12 mx-auto mb-4" />
        <p className="font-semibold">No chapters available</p>
        <p className="text-sm">Check back later for updates.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        {chapters.slice(0, visibleChapters).map(chapter => (
          <div key={chapter.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
            <Button variant="outline" asChild className="flex-1 justify-start border-gray-700 hover:bg-gray-800 hover:border-red-500">
              <Link href={`/reader/${mangaSlug}/1?chapter=${chapter.id}`}>
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="truncate">Chapter {chapter.attributes.chapter}: {chapter.attributes.title || 'No title'}</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownloadChapter(chapter)}
              className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
              title="Download for offline reading"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      {chapters.length > visibleChapters && (
        <div className="text-center mt-6">
          <Button variant="secondary" onClick={() => setVisibleChapters(prev => prev + 50)}>
            <ChevronDown className="w-4 h-4 mr-2" />
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

export default function MangaDetails({ kitsuManga, chapters, mangaSlug }: MangaDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const firstChapter = chapters[0]
  
  const { isBookmarked, isLoading: isBookmarkLoading, toggleBookmark } = useBookmark(mangaSlug)
  
  const handleBookmarkToggle = async () => {
    if (!kitsuManga) return
    
    const bookmarkData = {
      id: mangaSlug,
      title: kitsuManga.attributes.canonicalTitle || kitsuManga.attributes.titles.en_jp || 'Unknown Title',
      slug: mangaSlug,
      posterUrl: kitsuManga.attributes.posterImage?.original || kitsuManga.attributes.posterImage?.medium || '',
      type: 'manga' as const,
    }
    
    await toggleBookmark(bookmarkData)
  }

  const title = kitsuManga?.attributes.canonicalTitle || kitsuManga?.attributes.titles.en_jp || "Unknown Title"
  const altTitle = kitsuManga?.attributes.titles.en_jp
  const description = kitsuManga?.attributes.description || 'No description available.'
  const genres = kitsuManga?.relationships?.genres?.data?.map((g: any) => g.attributes.name) || []
  const authors = kitsuManga?.relationships?.staff?.data?.map((s: any) => s.attributes?.name || 'Unknown') || []
  
  const averageRating = kitsuManga?.attributes.averageRating
  const status = kitsuManga?.attributes.status
  const mangaType = kitsuManga?.attributes.mangaType
  const startDate = kitsuManga?.attributes.startDate
  const chapterCount = kitsuManga?.attributes.chapterCount

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">{title}</h1>
        {altTitle && altTitle !== title && (
          <p className="text-lg text-gray-400">{altTitle}</p>
        )}

        <div className="flex items-center flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-white font-semibold">
              {averageRating ? Number.parseFloat(averageRating).toFixed(1) : 'N/A'}
            </span>
            <span className="text-gray-400">/ 5</span>
          </div>
          {status && <Badge variant="destructive">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>}
          {mangaType && <Badge variant="secondary">{mangaType}</Badge>}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-gray-300">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-red-400" />
            <span className="font-medium">{authors.join(', ') || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-400" />
            <span className="font-medium">{startDate ? new Date(startDate).getFullYear() : 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-red-400" />
            <span className="font-medium">{chapterCount || chapters.length || 'N/A'} Chapters</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-3">
            {firstChapter && (
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                <Link href={`/reader/${mangaSlug}/1?chapter=${firstChapter.id}`}>
                  <BookOpen className="w-5 h-5 mr-2" />
                  Start Reading
                </Link>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="border-gray-600 hover:border-blue-500"
              onClick={handleBookmarkToggle}
              disabled={isBookmarkLoading}
            >
              <BookmarkIcon className={`w-5 h-5 mr-2 ${isBookmarked ? 'text-blue-400 fill-current' : 'text-gray-300'}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              className="border-gray-600 hover:border-blue-500"
            >
              <Share2 className="w-5 h-5 text-gray-300" />
            </Button>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-700 pb-2">Synopsis</h2>
          <div className="prose prose-invert prose-p:text-gray-300 prose-strong:text-white max-w-none">
            <div className={!isExpanded ? 'line-clamp-4' : ''}>
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
            {description.length > 200 && (
              <Button 
                variant="link" 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-red-400 pl-0 mt-2"
              >
                {isExpanded ? 'Show Less' : 'Read More'}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-4">
            {genres.map(genre => (
              <Badge key={genre} variant="secondary">{genre}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-700 pb-2">Chapters ({chapters.length})</h2>
        <ChapterList chapters={chapters} mangaSlug={mangaSlug} mangaTitle={title} />
      </div>
    </div>
  )
}