"use client"

import { useEffect, useState } from "react"
import { Clock, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { getLatestUpdates, getCoverImage } from "@/lib/mangadex-api"

export default function LatestUpdatesSection() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const data = await getLatestUpdates(12)
        setUpdates(data.data || [])
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
        <h2 className="text-3xl font-bold text-white">Latest Updates</h2>
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
          Latest Updates
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {updates.map((chapter) => {
          const mangaRelationship = chapter.relationships.find((rel: any) => rel.type === "manga")
          const manga = mangaRelationship?.attributes

          if (!manga) return null

          const coverRelationship = chapter.relationships.find((rel: any) => rel.type === "cover_art")
          const coverFilename = coverRelationship?.attributes?.fileName
          const coverUrl = coverFilename
            ? getCoverImage(mangaRelationship.id, coverFilename)
            : "/placeholder.svg?height=300&width=225"

          const title = manga.title?.en || manga.title?.[Object.keys(manga.title)[0]] || "Unknown Title"

          return (
            <Link key={chapter.id} href={`/manga/${mangaRelationship.id}`} className="group relative">
              <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={coverUrl || "/placeholder.svg"}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized // Added unoptimized prop
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center justify-between text-white/90 text-xs">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Ch.{chapter.attributes.chapter || "?"}</span>
                      </div>
                      <Badge className="bg-red-600/80 text-white text-xs px-1 py-0">NEW</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors text-sm line-clamp-2 leading-tight">
                    {title}
                  </h3>

                  <div className="text-xs text-gray-400">
                    {new Date(chapter.attributes.publishAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
