"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { getMangaDxRecentWithKitsuPosters } from "@/lib/mangadx-api"
import MangaCard from "@/components/manga-card"

interface MangaWithKitsuPoster {
  id: string
  attributes: {
    title: Record<string, string>
    description: Record<string, string>
    status: string
    year?: number
    contentRating: string
    tags: Array<{
      attributes: {
        name: Record<string, string>
        group: string
      }
    }>
  }
  kitsuPoster: string
  relationships: Array<{
    id: string
    type: string
    attributes?: {
      name?: string
      fileName?: string
    }
  }>
}

export default function RecentMangaSection() {
  const [updates, setUpdates] = useState<MangaWithKitsuPoster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const data = await getMangaDxRecentWithKitsuPosters(12)
        setUpdates(data || [])
      } catch (error) {
        console.error("Error fetching latest updates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpdates()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Recent Manga</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3 animate-pulse">
              <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-2 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-red-500" />
        <h2 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
          Recent Manga
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {updates.map((item) => {
          const title = Object.values(item.attributes.title)[0] || "Unknown Title"
          const posterUrl = item.kitsuPoster || "/placeholder.svg"
          const description = Object.values(item.attributes.description)[0] || ""
          
          // Get cover art if available
          const coverArt = item.relationships.find(
            (rel: any) => rel.type === 'cover_art' && rel.attributes?.fileName
          )
          const coverUrl = coverArt 
            ? `https://uploads.mangadx.org/covers/${item.id}/${coverArt.attributes?.fileName}.256.jpg`
            : ''

          // Extract genres
          const genres = item.attributes.tags
            .filter((tag: any) => tag.attributes.group === "genre")
            .map((tag: any) => tag.attributes.name?.en || Object.values(tag.attributes.name)[0])
            .filter(Boolean)

          return (
            <MangaCard
              key={item.id}
              id={item.id}
              title={title}
              posterUrl={posterUrl}
              coverUrl={coverUrl}
              description={description}
              status={item.attributes.status}
              year={item.attributes.year}
              contentRating={item.attributes.contentRating}
              genres={genres}
            />
          )
        })}
      </div>
    </section>
  )
}