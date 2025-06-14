"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Filter, Grid, List, X, TrendingUp, Star, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { searchMangaDxManga, getPrimaryEnglishTitle, type Manga } from "@/lib/mangadx-api"
import { searchKitsuManga, getKitsuPosterImage, type KitsuManga } from "@/lib/kitsu-api"
import LoadingSpinner from "@/components/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"
import MangaCard from "@/components/manga-card"

interface SearchResultManga extends Manga {
  kitsuPosterUrl?: string
  kitsuManga?: KitsuManga
}

interface SearchFilters {
  status: string[]
  genres: string[]
  year: [number, number]
  rating: [number, number]
  sortBy: string
  contentRating: string[]
}

const POPULAR_SEARCHES = [
  "One Piece",
  "Naruto",
  "Attack on Titan",
  "Demon Slayer",
  "My Hero Academia",
  "Chainsaw Man",
  "Jujutsu Kaisen",
  "Death Note",
]

const MANGA_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Psychological",
]

const STATUS_OPTIONS = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" },
]

const CONTENT_RATINGS = [
  { value: "safe", label: "Safe" },
  { value: "suggestive", label: "Suggestive" },
  { value: "erotica", label: "Erotica" },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [results, setResults] = useState<SearchResultManga[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<SearchFilters>({
    status: [],
    genres: [],
    year: [1990, new Date().getFullYear()],
    rating: [0, 10],
    sortBy: "relevance",
    contentRating: ["safe", "suggestive"],
  })

  useEffect(() => {
    const query = searchParams.get("q")
    if (query) {
      setSearchQuery(query)
    }
  }, [searchParams])

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery.trim())
      setShowSuggestions(false)
    } else {
      setResults([])
      setTotalResults(0)
    }
  }, [debouncedSearchQuery, filters, currentPage])

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.length > 0 && searchQuery.length < 3) {
      const suggestions = POPULAR_SEARCHES.filter((search) =>
        search.toLowerCase().includes(searchQuery.toLowerCase()),
      ).slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [searchQuery])

  const performSearch = async (query: string) => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * 20
      const mangadxData = await searchMangaDxManga(query, 20, offset)
      const mangadxMangaList = mangadxData.data || []
      setTotalResults(mangadxData.total || 0)

      const enrichedResults = await Promise.all(
        mangadxMangaList.map(async (mdManga) => {
          const mdTitle = getPrimaryEnglishTitle(mdManga)
          let kitsuPosterUrl: string | undefined
          let foundKitsuManga: KitsuManga | undefined

          if (mdTitle) {
            try {
              const kitsuSearchData = await searchKitsuManga(mdTitle, 1)
              foundKitsuManga = kitsuSearchData.data[0]

              if (foundKitsuManga) {
                kitsuPosterUrl = getKitsuPosterImage(foundKitsuManga.attributes.posterImage)
              }
            } catch (kitsuError) {
              console.warn(`Could not find Kitsu poster for MangaDx title "${mdTitle}":`, kitsuError)
            }
          }

          return {
            ...mdManga,
            kitsuPosterUrl: kitsuPosterUrl || "/placeholder.svg?height=300&width=225",
            kitsuManga: foundKitsuManga,
          }
        }),
      )

      // Apply client-side filters
      let filteredResults = enrichedResults

      if (filters.status.length > 0) {
        filteredResults = filteredResults.filter((manga) => filters.status.includes(manga.attributes.status))
      }

      if (filters.genres.length > 0) {
        filteredResults = filteredResults.filter((manga) => {
          const mangaGenres = manga.attributes.tags
            .filter((tag: any) => tag.attributes.group === "genre")
            .map((tag: any) => tag.attributes.name?.en || tag.attributes.name?.[Object.keys(tag.attributes.name)[0]])
          return filters.genres.some((genre) => mangaGenres.includes(genre))
        })
      }

      setResults(filteredResults)
    } catch (error) {
      console.error("Error searching manga:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setCurrentPage(1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      genres: [],
      year: [1990, new Date().getFullYear()],
      rating: [0, 10],
      sortBy: "relevance",
      contentRating: ["safe", "suggestive"],
    })
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Search Header */}
        <div className="space-y-8 mb-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
              Discover Manga
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Search through thousands of manga titles and find your next favorite read
            </p>
          </div>

          {/* Search Bar with Suggestions */}
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <Input
                  type="text"
                  placeholder="Search for manga titles, authors, or genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-16 pr-6 py-6 text-xl bg-gray-800/50 border-gray-700 focus:border-red-500 focus:ring-red-500/20 rounded-2xl backdrop-blur-sm"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchQuery("")
                      setResults([])
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-800/95 backdrop-blur-md border-gray-700">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <TrendingUp className="w-4 h-4" />
                      Popular Searches
                    </div>
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Popular Searches */}
          {!searchQuery && (
            <div className="text-center space-y-4">
              <p className="text-gray-400">Popular searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.map((search) => (
                  <Button
                    key={search}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(search)}
                    className="border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        {(searchQuery || results.length > 0) && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <div className={`lg:w-80 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
              <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      Filters
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </Button>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Sort By */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="title">Title A-Z</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="popularity">Most Popular</SelectItem>
                        <SelectItem value="latest">Latest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <div className="space-y-2">
                      {STATUS_OPTIONS.map((status) => (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={status.value}
                            checked={filters.status.includes(status.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFilter("status", [...filters.status, status.value])
                              } else {
                                updateFilter(
                                  "status",
                                  filters.status.filter((s) => s !== status.value),
                                )
                              }
                            }}
                          />
                          <label htmlFor={status.value} className="text-sm text-gray-300">
                            {status.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Genres Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Genres</label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {MANGA_GENRES.map((genre) => (
                        <div key={genre} className="flex items-center space-x-2">
                          <Checkbox
                            id={genre}
                            checked={filters.genres.includes(genre)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFilter("genres", [...filters.genres, genre])
                              } else {
                                updateFilter(
                                  "genres",
                                  filters.genres.filter((g) => g !== genre),
                                )
                              }
                            }}
                          />
                          <label htmlFor={genre} className="text-sm text-gray-300">
                            {genre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Year Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">
                      Publication Year ({filters.year[0]} - {filters.year[1]})
                    </label>
                    <Slider
                      value={filters.year}
                      onValueChange={(value) => updateFilter("year", value)}
                      min={1950}
                      max={new Date().getFullYear()}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Content Rating */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Content Rating</label>
                    <div className="space-y-2">
                      {CONTENT_RATINGS.map((rating) => (
                        <div key={rating.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={rating.value}
                            checked={filters.contentRating.includes(rating.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFilter("contentRating", [...filters.contentRating, rating.value])
                              } else {
                                updateFilter(
                                  "contentRating",
                                  filters.contentRating.filter((r) => r !== rating.value),
                                )
                              }
                            }}
                          />
                          <label htmlFor={rating.value} className="text-sm text-gray-300">
                            {rating.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  {searchQuery && <h2 className="text-2xl font-bold text-white">Search results for "{searchQuery}"</h2>}
                  <p className="text-gray-400">
                    {loading ? "Searching..." : `${totalResults.toLocaleString()} results found`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden border-gray-700 text-gray-300"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-red-600 hover:bg-red-700" : "border-gray-700 text-gray-300"}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-red-600 hover:bg-red-700" : "border-gray-700 text-gray-300"}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(filters.status.length > 0 || filters.genres.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {filters.status.map((status) => (
                    <Badge key={status} variant="secondary" className="bg-red-600/20 text-red-400 border-red-600/30">
                      {status}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() =>
                          updateFilter(
                            "status",
                            filters.status.filter((s) => s !== status),
                          )
                        }
                      />
                    </Badge>
                  ))}
                  {filters.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                      {genre}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() =>
                          updateFilter(
                            "genres",
                            filters.genres.filter((g) => g !== genre),
                          )
                        }
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Results */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : results.length > 0 ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                      : "space-y-4"
                  }
                >
                  {results.map((manga) => {
                    const mdTitle = getPrimaryEnglishTitle(manga)
                    const posterUrl = manga.kitsuPosterUrl || "/placeholder.svg?height=300&width=225"

                    const genres = manga.attributes.tags
                      .filter((tag: any) => tag.attributes.group === "genre")
                      .map(
                        (tag: any) =>
                          tag.attributes.name?.en || tag.attributes.name?.[Object.keys(tag.attributes.name)[0]],
                      )
                      .filter(Boolean)

                    const rating = manga.kitsuManga?.attributes.averageRating
                      ? Number.parseFloat(manga.kitsuManga.attributes.averageRating)
                      : undefined

                    if (viewMode === "grid") {
                      return (
                        <MangaCard
                          key={manga.id}
                          id={manga.id}
                          title={mdTitle}
                          posterUrl={posterUrl}
                          rating={rating}
                          status={manga.attributes.status}
                          genres={genres}
                          year={manga.attributes.year || undefined}
                          contentRating={manga.attributes.contentRating}
                          manga={manga}
                        />
                      )
                    }

                    return (
                      <div key={manga.id} className="flex gap-4 bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-300">
                        <div className="relative w-24 aspect-[3/4] rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={posterUrl || "/placeholder.svg"}
                            alt={mdTitle}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2">
                              {mdTitle}
                            </h3>
                            {rating && (
                              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                {rating.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {genres.slice(0, 4).map((genre) => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="bg-gray-700/50 text-gray-300 text-xs"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>
                              {manga.attributes.status.charAt(0).toUpperCase() + manga.attributes.status.slice(1)}
                            </span>
                            {manga.attributes.year && <span>{manga.attributes.year}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : searchQuery && !loading ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
                    <Search className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">No results found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Try adjusting your search terms or filters to find what you're looking for
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="border-gray-700 text-gray-300">
                    Clear Filters
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}