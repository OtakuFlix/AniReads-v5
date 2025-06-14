// Kitsu API types (simplified for relevant fields)
export interface KitsuResponse<T> {
  data: T[]
  links?: {
    first?: string
    next?: string
    last?: string
  }
  meta?: {
    count: number
  }
}

export interface KitsuManga {
  id: string
  type: "manga" | "anime"
  attributes: {
    canonicalTitle: string
    titles: {
      en?: string
      en_jp?: string
      ja_jp?: string
      [key: string]: string | undefined
    }
    description: string
    posterImage: {
      tiny?: string
      small?: string
      medium?: string
      large?: string
      original?: string
    }
    coverImage: {
      tiny?: string
      small?: string
      large?: string
      original?: string
    } | null
    startDate: string
    endDate: string | null
    averageRating: string | null
    ratingRank: number | null
    popularityRank: number | null
    status: string // "finished", "publishing", "unreleased", "cancelled", "hiatus"
    chapterCount: number | null
    volumeCount: number | null
    serialization: string | null
    mangaType: string // "manga", "novel", "one_shot", "doujin", "manhwa", "manhua"
  }
  relationships: {
    genres?: {
      links: {
        related: string
        self: string
      }
      data?: {
        id: string
        type: "genres"
      }[]
    }
    categories?: {
      links: {
        related: string
        self: string
      }
    }
    castings?: {
      links: {
        related: string
        self: string
      }
    }
    staff?: {
      links: {
        related: string
        self: string
      }
      data?: {
        id: string
        type: "staff"
      }[]
    }
    // Add other relationships as needed
  }
}

export interface KitsuGenre {
  id: string
  type: "genres"
  attributes: {
    name: string
  }
}

// Helper function to correctly format query parameters for Kitsu API
function formatKitsuQueryParams(params: Record<string, any>): string {
  const queryParts: string[] = []

  for (const key in params) {
    const value = params[key]

    if (Array.isArray(value)) {
      value.forEach((item) => {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
      })
    } else if (typeof value === "object" && value !== null) {
      for (const subKey in value) {
        queryParts.push(
          `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(value[subKey])}`,
        )
      }
    } else {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }

  return queryParts.join("&")
}

// Kitsu API functions
export async function searchKitsuManga(query: string, limit = 20, offset = 0): Promise<KitsuResponse<KitsuManga>> {
  const params = {
    "filter[text]": query,
    "page[limit]": limit.toString(),
    "page[offset]": offset.toString(),
    "fields[manga]":
      "canonicalTitle,titles,description,posterImage,coverImage,startDate,averageRating,status,chapterCount,volumeCount,mangaType",
    include: "genres", // Include genres for filtering/display
    sort: "-popularityRank", // Sort by popularity for search relevance
  }
  const queryString = formatKitsuQueryParams(params)
  const response = await fetch(`/api/proxy/kitsu/manga?${queryString}`)
  return response.json()
}

export async function getKitsuMangaDetails(id: string): Promise<KitsuResponse<KitsuManga>> {
  const params = {
    "fields[manga]":
      "canonicalTitle,titles,description,posterImage,coverImage,startDate,endDate,averageRating,status,chapterCount,volumeCount,serialization,mangaType",
    include: "genres,staff", // Include genres and staff (authors/artists)
  }
  const queryString = formatKitsuQueryParams(params)
  const response = await fetch(`/api/proxy/kitsu/manga/${id}?${queryString}`)
  return response.json()
}

// New function to get manga by slug (canonicalTitle)
import { slugify } from "./slugify" // Import slugify helper

export async function getKitsuMangaBySlug(slug: string): Promise<KitsuManga | null> {
  console.log("getKitsuMangaBySlug: Input slug:", slug) // Debug log
  const filterText = slug.replace(/-/g, " ") // Convert slug back to spaces for broader search
  console.log("getKitsuMangaBySlug: filter[text] sent to Kitsu:", filterText) // Debug log

  const params = {
    "filter[text]": filterText,
    "page[limit]": "10", // Fetch a few more results to increase chances of finding exact match
    "fields[manga]":
      "canonicalTitle,titles,description,posterImage,coverImage,startDate,endDate,averageRating,status,chapterCount,volumeCount,serialization,mangaType",
    include: "genres,staff",
  }
  const queryString = formatKitsuQueryParams(params)
  const response = await fetch(`/api/proxy/kitsu/manga?${queryString}`)
  const data: KitsuResponse<KitsuManga> = await response.json()

  console.log("getKitsuMangaBySlug: Kitsu API response data:", data.data) // Debug log the raw data

  // Manually filter to find the exact slug match
  const foundManga = data.data.find((manga) => {
    const titleToSlugify = manga.attributes.canonicalTitle || manga.attributes.titles.en_jp || ""
    const generatedSlug = slugify(titleToSlugify)
    console.log(
      `  Kitsu Manga ID: ${manga.id}, Title: "${titleToSlugify}", Generated Slug: "${generatedSlug}", Matches Input Slug: ${generatedSlug === slug}`,
    ) // Detailed debug log for each item
    return generatedSlug === slug
  })

  console.log("getKitsuMangaBySlug: Found manga after filtering:", foundManga) // Debug log the final found manga
  return foundManga || null
}

export async function getKitsuTrendingManga(limit = 20): Promise<KitsuResponse<KitsuManga>> {
  const params = {
    "page[limit]": limit.toString(),
    "fields[manga]":
      "canonicalTitle,titles,description,posterImage,coverImage,startDate,averageRating,status,chapterCount,volumeCount,mangaType",
    include: "genres",
  }
  const queryString = formatKitsuQueryParams(params)
  const response = await fetch(`/api/proxy/kitsu/trending/manga?${queryString}`)
  return response.json()
}

export async function getKitsuRecentManga(limit = 20, offset = 0): Promise<KitsuResponse<KitsuManga>> {
  const params = {
    "page[limit]": limit.toString(),
    "page[offset]": offset.toString(),
    sort: "-createdAt", // Sort by creation date for recent additions
    "fields[manga]":
      "canonicalTitle,titles,description,posterImage,coverImage,startDate,averageRating,status,chapterCount,volumeCount,mangaType",
    include: "genres",
  }
  const queryString = formatKitsuQueryParams(params)
  const response = await fetch(`/api/proxy/kitsu/manga?${queryString}`)
  return response.json()
}

// Utility to get the best available image URL
export function getKitsuPosterImage(posterImage: KitsuManga["attributes"]["posterImage"]): string {
  return posterImage?.large || posterImage?.medium || posterImage?.small || posterImage?.tiny || "/placeholder.svg"
}

export function getKitsuCoverImage(coverImage: KitsuManga["attributes"]["coverImage"]): string {
  return coverImage?.original || coverImage?.large || coverImage?.small || coverImage?.tiny || "/placeholder.svg"
}
