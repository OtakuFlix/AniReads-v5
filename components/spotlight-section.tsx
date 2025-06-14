"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Star, BookOpen, Calendar, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { getMangaDxTrendingWithKitsuPosters } from "@/lib/mangadx-api"

export default function SpotlightSection() {
  const [spotlightManga, setSpotlightManga] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpotlightManga = async () => {
      try {
        const data = await getMangaDxTrendingWithKitsuPosters(10)
        setSpotlightManga(data || [])
      } catch (error) {
        console.error("Error fetching spotlight manga:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpotlightManga()
  }, [])

  // Auto-rotate spotlight every 8 seconds
  useEffect(() => {
    if (spotlightManga.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % spotlightManga.length)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [spotlightManga.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlightManga.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlightManga.length) % spotlightManga.length)
  }

  if (loading) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-3xl overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gray-800" />
        <div className="absolute bottom-8 left-8 space-y-4">
          <div className="h-8 bg-gray-700 rounded w-64" />
          <div className="h-4 bg-gray-700 rounded w-96" />
          <div className="h-12 bg-gray-700 rounded w-32" />
        </div>
      </div>
    )
  }

  if (spotlightManga.length === 0) {
    return null
  }

  const currentManga = spotlightManga[currentIndex]
  const title = currentManga.attributes.title.en || Object.values(currentManga.attributes.title)[0] || "Unknown Title"
  const description = currentManga.attributes.description?.en || Object.values(currentManga.attributes.description)[0] || "No description available."
  const coverArt = currentManga.relationships.find((rel: any) => rel.type === 'cover_art' && rel.attributes?.fileName)
  const coverUrl = coverArt ? `https://uploads.mangadx.org/covers/${currentManga.id}/${coverArt.attributes?.fileName}.512.jpg` : "/placeholder.svg?height=600&width=1200"
  const posterUrl = currentManga.kitsuPoster || "/placeholder.svg"
  const genres: string[] = Array.isArray(currentManga.attributes.tags)
    ? currentManga.attributes.tags
        .filter((tag: any) => tag.attributes.group === "genre")
        .map((tag: any) => tag?.attributes?.name?.en || Object.values(tag?.attributes?.name || {})[0] || '')
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const contentRating = currentManga.attributes.contentRating

  return (
    <section className="relative h-[70vh] rounded-3xl overflow-hidden group shadow-2xl shadow-red-900/50">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={coverUrl || "/placeholder.svg?height=600&width=1200"}
          alt={`${title} cover`}
          fill
          className="object-cover object-center transition-all duration-1000 group-hover:scale-105"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="container mx-auto px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            {/* Poster */}
            <div className="hidden lg:block">
              <div className="relative w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                <Image src={posterUrl || "/placeholder.svg"} alt={title} fill className="object-cover" unoptimized />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 text-white animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-600 hover:bg-red-600 text-white px-3 py-1">
                    <Play className="w-3 h-3 mr-1" />
                    Spotlight
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>
                      {currentManga.attributes.averageRating
                        ? Number.parseFloat(currentManga.attributes.averageRating).toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl font-black leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
                  {title}
                </h1>

                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 4).map((genre) => (
                    <Badge
                      key={genre}
                      variant="secondary"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>

                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl line-clamp-3">{description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{typeof currentManga.attributes.chapterCount === 'number' ? currentManga.attributes.chapterCount : "?"} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {currentManga.attributes.year
                        ? currentManga.attributes.year
                        : "Unknown"}
                    </span>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                    {currentManga.attributes.status
                      ? currentManga.attributes.status.charAt(0).toUpperCase() + currentManga.attributes.status.slice(1)
                      : "Unknown"}
                  </Badge>
                  <Badge variant="outline" className={`text-xs px-2 py-1 rounded-full font-bold border-2 ${contentRating ? (contentRating.toLowerCase() === 'safe' ? 'border-green-500 text-green-400' : contentRating.toLowerCase() === 'suggestive' ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400') : 'border-gray-500 text-gray-300'}`}>
                    {contentRating ? contentRating.toUpperCase() : 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href={`/manga/${currentManga.id}`}>
                  <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Read Now
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-6 py-3 rounded-xl backdrop-blur-sm shadow-md hover:shadow-white/10"
                >
                  Add to List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full backdrop-blur-sm shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full backdrop-blur-sm shadow-md hover:shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2">
          {spotlightManga.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-red-500 scale-125 shadow-sm" : "bg-white/30 hover:bg-white/50 shadow-sm"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
          {currentIndex + 1} / {spotlightManga.length}
        </div>
      </div>
    </section>
  )
}