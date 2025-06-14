"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import MangaBanner from '@/components/manga/manga-banner'
import MangaHeader from '@/components/manga/manga-header'
import MangaDetails from '@/components/manga/manga-details'
import MangaComments from '@/components/manga/manga-comments'
import {
  searchKitsuManga,
  getKitsuPosterImage,
  getKitsuCoverImage,
  type KitsuManga,
} from "@/lib/kitsu-api"
import { getMangaDxChapters, getMangaDxManga, getPrimaryEnglishTitle, type Chapter } from "@/lib/mangadx-api"
import LoadingSpinner from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"

export default function MangaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [kitsuManga, setKitsuManga] = useState<KitsuManga | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [mangaDxId, setMangaDxId] = useState<string | null>(null)
  const { user } = useAuth()

  const slug = params.slug as string

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setLoading(true)
        console.log("MangaDetailPage: Processing slug:", slug)

        // Check if slug is already a MangaDx ID (UUID format)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
        
        let currentMangaDxId: string
        
        if (isUUID) {
          // Slug is already a MangaDx ID
          currentMangaDxId = slug
          console.log("MangaDetailPage: Using slug as MangaDx ID:", currentMangaDxId)
        } else {
          // Slug is a title-based slug, need to search for MangaDx ID
          console.log("MangaDetailPage: Searching for MangaDx ID using slug:", slug)
          
          // Convert slug back to searchable title
          const searchTitle = slug.replace(/-/g, ' ')
          
          // Search MangaDx for the manga
          const searchResponse = await fetch(`/api/proxy/mangadx/manga?title=${encodeURIComponent(searchTitle)}&limit=1&includes[]=cover_art`)
          const searchData = await searchResponse.json()
          
          if (!searchData.data || searchData.data.length === 0) {
            console.error("MangaDetailPage: No manga found for slug:", slug)
            setLoading(false)
            return
          }
          
          currentMangaDxId = searchData.data[0].id
          console.log("MangaDetailPage: Found MangaDx ID:", currentMangaDxId)
          
          // Update URL to use MangaDx ID for consistency
          router.replace(`/manga/${currentMangaDxId}`, { scroll: false })
        }

        setMangaDxId(currentMangaDxId)

        // Get MangaDx manga details
        const mangaDxResponse = await getMangaDxManga(currentMangaDxId)
        const mdManga = mangaDxResponse.data
        
        if (!mdManga) {
          console.error("MangaDetailPage: No MangaDx manga found for ID:", currentMangaDxId)
          setLoading(false)
          return
        }

        const mdTitle = getPrimaryEnglishTitle(mdManga)
        console.log("MangaDetailPage: MangaDx title:", mdTitle)

        // Search Kitsu for additional metadata using the MangaDx title
        let kitsuData: KitsuManga | null = null
        try {
          const kitsuSearchData = await searchKitsuManga(mdTitle, 1)
          kitsuData = kitsuSearchData.data[0] || null
          console.log("MangaDetailPage: Kitsu manga found:", !!kitsuData)
        } catch (error) {
          console.warn("MangaDetailPage: Could not fetch Kitsu data:", error)
        }

        setKitsuManga(kitsuData)

        // Get chapters from MangaDx
        const chaptersData = await getMangaDxChapters(currentMangaDxId)
        const sortedChapters = (chaptersData.data || []).sort((a, b) => {
          const aChapter = Number.parseFloat(a.attributes.chapter || "0")
          const bChapter = Number.parseFloat(b.attributes.chapter || "0")
          const aVolume = Number.parseFloat(a.attributes.volume || "0")
          const bVolume = Number.parseFloat(b.attributes.volume || "0")

          if (aVolume !== bVolume) {
            return aVolume - bVolume
          }
          return aChapter - bChapter
        })
        setChapters(sortedChapters)
        console.log("MangaDetailPage: Chapters fetched:", sortedChapters.length)

      } catch (error) {
        console.error("MangaDetailPage: Error fetching manga details:", error)
        setKitsuManga(null)
        setChapters([])
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchMangaDetails()
    }
  }, [slug, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!mangaDxId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Manga not found</h1>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const posterUrl = kitsuManga ? getKitsuPosterImage(kitsuManga.attributes.posterImage) : "/placeholder.svg"
  const coverUrl = kitsuManga
    ? getKitsuCoverImage(kitsuManga.attributes.coverImage) || getKitsuPosterImage(kitsuManga.attributes.posterImage)
    : "/placeholder.svg?height=400&width=1200"
  const title = kitsuManga?.attributes.canonicalTitle || kitsuManga?.attributes.titles.en_jp || "Unknown Title"

  // Prepare manga data for library operations - use MangaDx ID as primary identifier
  const mangaData = {
    manga_id: mangaDxId,
    manga_title: title,
    manga_slug: mangaDxId, // Use MangaDx ID as slug for consistency
    poster_url: posterUrl,
    total_chapters: kitsuManga?.attributes.chapterCount || chapters.length || undefined,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <MangaBanner coverUrl={coverUrl} title={title} />
      <main className="container mx-auto p-4 -mt-20 md:-mt-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <aside className="md:col-span-1 lg:col-span-1">
            <MangaHeader
              kitsuManga={kitsuManga}
              mangaData={mangaData}
              mangaSlug={mangaDxId}
              chapters={chapters}
            />
          </aside>
          <div className="md:col-span-2 lg:col-span-3 space-y-8">
            <MangaDetails
              kitsuManga={kitsuManga}
              chapters={chapters}
              mangaSlug={mangaDxId}
            />
            <MangaComments
              mangaId={mangaDxId}
              mangaTitle={title}
            />
          </div>
        </div>
      </main>
    </div>
  );
}