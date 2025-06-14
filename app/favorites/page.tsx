"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getKitsuMangaDetails, getKitsuPosterImage, type KitsuManga } from "@/lib/kitsu-api"
import LoadingSpinner from "@/components/loading-spinner"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { slugify } from "@/lib/slugify"

interface FavoriteMangaItem {
  id: string
  slug: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<KitsuManga[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const favoriteItems: FavoriteMangaItem[] = JSON.parse(localStorage.getItem("favorites") || "[]")

        if (favoriteItems.length === 0) {
          setLoading(false)
          setFavorites([])
          return
        }

        const mangaPromises = favoriteItems.map((item) => getKitsuMangaDetails(item.id))
        const mangaResponses = await Promise.all(mangaPromises)
        // Kitsu returns an array, so we need to extract the first item from each response
        const mangaData = mangaResponses.map((response) => response.data[0]).filter(Boolean) as KitsuManga[]

        setFavorites(mangaData)
      } catch (error) {
        console.error("Error fetching favorites:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  const removeFavorite = (id: string) => {
    const favoriteItems: FavoriteMangaItem[] = JSON.parse(localStorage.getItem("favorites") || "[]")
    const updatedFavorites = favoriteItems.filter((item) => item.id !== id)
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites))

    setFavorites((prev) => prev.filter((manga) => manga.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-8">
          My Favorites
        </h1>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-2">No favorites added yet.</h3>
            <p className="text-gray-400">Start exploring manga and add your favorites!</p>
            <Button onClick={() => router.push("/")} className="mt-4 bg-red-600 hover:bg-red-700">
              Browse Manga
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map((manga) => {
              const posterUrl = getKitsuPosterImage(manga.attributes.posterImage)
              const title = manga.attributes.canonicalTitle || manga.attributes.titles.en_jp || "Unknown Title"
              const genres = manga.relationships.genres?.data?.map((g: any) => g.attributes.name) || []
              const mangaSlug = slugify(title) // Generate slug for linking

              return (
                <div
                  key={manga.id}
                  className="group relative bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-700/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
                >
                  <Link href={`/manga/${mangaSlug}`}>
                    {" "}
                    {/* Use slug for navigation */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={posterUrl || "/placeholder.svg"}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault() // Prevent navigating to manga detail page
                            removeFavorite(manga.id)
                          }}
                          className="text-red-400 hover:text-red-500 bg-black/50 rounded-full p-1"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between text-white/90 text-xs">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>
                              {manga.attributes.averageRating
                                ? Number.parseFloat(manga.attributes.averageRating).toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                          <span>Ch.{manga.attributes.chapterCount || "?"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors text-sm line-clamp-2 leading-tight">
                      {title}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="secondary" className="bg-gray-700/50 text-gray-300 text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
