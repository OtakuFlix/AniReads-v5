// MangaDex API types
export interface MangaResponse {
  result: string
  response: string
  data: Manga
}

export interface MangaList {
  result: string
  response: string
  data: Manga[]
  limit: number
  offset: number
  total: number
}

export interface Manga {
  id: string
  type: string
  attributes: MangaAttributes
  relationships: Relationship[]
}

export interface MangaAttributes {
  title: Record<string, string>
  altTitles: Record<string, string>[]
  description: Record<string, string>
  isLocked: boolean
  links: Record<string, string>
  originalLanguage: string
  lastVolume: string | null
  lastChapter: string | null
  publicationDemographic: string | null
  status: string
  year: number | null
  contentRating: string
  tags: Tag[]
  state: string
  chapterNumbersResetOnNewVolume: boolean
  createdAt: string
  updatedAt: string
  availableTranslatedLanguages: string[]
  latestUploadedChapter: string
}

export interface Tag {
  id: string
  type: string
  attributes: {
    name: Record<string, string>
    description: Record<string, string>
    group: string
    version: number
  }
}

export interface Relationship {
  id: string
  type: string
  related?: string
  attributes?: any
}

export interface ChapterList {
  result: string
  response: string
  data: Chapter[]
  limit: number
  offset: number
  total: number
}

export interface Chapter {
  id: string
  type: string
  attributes: ChapterAttributes
  relationships: Relationship[]
}

export interface ChapterAttributes {
  title: string | null
  volume: string | null
  chapter: string | null
  pages: number
  translatedLanguage: string
  uploader: string
  externalUrl: string | null
  version: number
  createdAt: string
  updatedAt: string
  publishAt: string
  readableAt: string
}

// Helper function to correctly format query parameters for MangaDex API
function formatMangaDexQueryParams(params: Record<string, any>): string {
  const queryParts: string[] = []

  for (const key in params) {
    const value = params[key]

    if (Array.isArray(value)) {
      if (key === "manga") {
        // Special case for 'manga' parameter: it expects a comma-separated string
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(","))}`)
      } else {
        // For all other array parameters (e.g., translatedLanguage, includes, contentRating), use []
        value.forEach((item) => {
          queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`)
        })
      }
    } else if (typeof value === "object" && value !== null) {
      // Handle object parameters like order[field]
      for (const subKey in value) {
        queryParts.push(
          `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(value[subKey])}`,
        )
      }
    } else {
      // Handle simple key-value pairs
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }

  return queryParts.join("&")
}

// RateLimiter class for fixed window
class RateLimiter {
  private timestamps: number[] = [] // Stores timestamps of requests
  private readonly limit: number // Max requests allowed in the window
  private readonly windowMs: number // Time window in milliseconds

  constructor(limit: number, windowMinutes: number) {
    this.limit = limit
    this.windowMs = windowMinutes * 60 * 1000
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const checkAndExecute = () => {
        const now = Date.now()
        // Remove timestamps older than the current window
        this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs)

        if (this.timestamps.length < this.limit) {
          // If limit not reached, add current timestamp and resolve immediately
          this.timestamps.push(now)
          resolve()
        } else {
          // If limit reached, calculate time until the oldest request expires
          const oldestRequestTime = this.timestamps[0]
          const timeToWait = this.windowMs - (now - oldestRequestTime) + 50 // Add a small buffer
          setTimeout(checkAndExecute, timeToWait) // Wait and re-check
        }
      }
      checkAndExecute()
    })
  }
}

// Instantiate the rate limiter for AtHome endpoint (40 requests per 1 minute)
const atHomeRateLimiter = new RateLimiter(40, 1)

// API functions
export async function searchMangaDexManga(query: string, limit = 20, offset = 0) {
  const params = {
    title: query,
    limit: limit.toString(),
    offset: offset.toString(),
    includes: ["cover_art", "author", "artist"],
    contentRating: ["safe", "suggestive", "erotica"],
    order: { relevance: "desc" },
  }
  const queryString = formatMangaDexQueryParams(params)

  const response = await fetch(`/api/proxy/mangadex/manga?${queryString}`)
  return response.json() as Promise<MangaList>
}

export async function getMangaDexManga(id: string) {
  const params = {
    includes: ["cover_art", "author", "artist", "tag"],
  }
  const queryString = formatMangaDexQueryParams(params)

  const response = await fetch(`/api/proxy/mangadex/manga/${id}?${queryString}`)
  return response.json() as Promise<MangaResponse>
}

export async function getMangaDexChapters(mangaId: string, limit = 100, offset = 0, translatedLanguage = "en") {
  const params = {
    limit: limit.toString(),
    offset: offset.toString(),
    manga: [mangaId], // This will now be correctly formatted as manga=id1,id2
    translatedLanguage: [translatedLanguage], // This will continue to be formatted as translatedLanguage[]=en
    order: { volume: "asc", chapter: "asc" }, // Correct order: first by volume, then by chapter
  }
  const queryString = formatMangaDexQueryParams(params)

  const response = await fetch(`/api/proxy/mangadex/chapter?${queryString}`)
  return response.json() as Promise<ChapterList>
}

export async function getMangaDexChapter(id: string) {
  // The includes for chapter endpoint is simpler, can be done directly
  const response = await fetch(`/api/proxy/mangadex/chapter/${id}?includes[]=scanlation_group`)
  return response.json()
}

export async function getMangaDexChapterPages(id: string) {
  await atHomeRateLimiter.acquire() // Acquire a slot from the rate limiter
  const response = await fetch(`/api/proxy/mangadex/at-home/server/${id}`)
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`MangaDex Chapter Pages API Error (${response.status}):`, errorText)
    throw new Error(`Failed to fetch chapter pages: ${response.statusText}`)
  }
  return response.json()
}

export function getMangaDexCoverImage(mangaId: string, filename: string) {
  return `https://uploads.mangadex.org/covers/${mangaId}/${filename}`
}

export async function getMangaDexPopularManga(limit = 20, offset = 0) {
  const params = {
    limit: limit.toString(),
    offset: offset.toString(),
    includes: ["cover_art"],
    contentRating: ["safe", "suggestive", "erotica"],
    order: { followedCount: "desc" },
  }
  const queryString = formatMangaDexQueryParams(params)

  const response = await fetch(`/api/proxy/mangadex/manga?${queryString}`)
  return response.json() as Promise<MangaList>
}

export async function getMangaDexLatestUpdates(limit = 20, offset = 0) {
  const params = {
    limit: limit.toString(),
    offset: offset.toString(),
    includes: ["cover_art", "manga"],
    contentRating: ["safe", "suggestive", "erotica"],
    order: { updatedAt: "desc" }, // Correct order parameter for latest updates
  }
  const queryString = formatMangaDexQueryParams(params)

  const response = await fetch(`/api/proxy/mangadex/chapter?${queryString}`)
  return response.json()
}

export async function getMangaDexRecentWithKitsuPosters(limit = 20) {
  try {
    // First, get recent updates from MangaDex
    const response = await getMangaDexLatestUpdates(limit)
    
    if (!response?.data) {
      console.error('No data returned from MangaDex for recent updates')
      return []
    }

    // Create a set to track unique titles (case-insensitive)
    const uniqueTitles = new Set()
    const uniqueManga: any[] = []

    // Define a type for the chapter object
    interface ChapterWithRelationships {
      relationships: Array<{
        type: string;
        id?: string;
      }>;
    }

    // Extract manga IDs from the chapters
    const mangaIds = (response.data as ChapterWithRelationships[])
      .map(chapter => 
        chapter.relationships.find(rel => rel.type === 'manga')?.id
      )
      .filter((id): id is string => !!id)

    // Get unique manga IDs
    const uniqueMangaIds = Array.from(new Set(mangaIds))

    // Get manga details for each unique manga
    for (const mangaId of uniqueMangaIds) {
      try {
        const mangaResponse = await getMangaDexManga(mangaId)
        const manga = mangaResponse.data
        
        if (!manga) continue
        
        const title = Object.values(manga.attributes.title)[0] || 'Unknown Title'
        const normalizedTitle = title.toLowerCase().trim()
        
        // Skip if we've already seen this title (case-insensitive check)
        if (uniqueTitles.has(normalizedTitle)) continue
        
        // Search Kitsu for matching manga
        const kitsuSearchUrl = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(title)}&page[limit]=1`
        const kitsuResponse = await fetch(`/api/proxy/kitsu?url=${encodeURIComponent(kitsuSearchUrl)}`)
        const kitsuData = await kitsuResponse.json()
        
        let posterImage = ''
        if (kitsuData?.data?.[0]?.attributes?.posterImage) {
          posterImage = kitsuData.data[0].attributes.posterImage.large || 
                      kitsuData.data[0].attributes.posterImage.medium ||
                      ''
        }
        
        // Add to unique list
        uniqueTitles.add(normalizedTitle)
        uniqueManga.push({
          ...manga,
          kitsuPoster: posterImage
        })
        
        // Stop if we've reached the limit
        if (uniqueManga.length >= limit) break
        
      } catch (error) {
        console.error(`Error processing manga with ID ${mangaId}:`, error)
        continue
      }
    }
    
    return uniqueManga
    
  } catch (error) {
    console.error('Error in getMangaDexRecentWithKitsuPosters:', error)
    return []
  }
}

export async function getMangaDexTrendingWithKitsuPosters(limit = 20) {
  try {
    // First, get trending manga from MangaDex
    const mangadexResponse = await getMangaDexPopularManga(limit)
    
    if (!mangadexResponse?.data) {
      console.error('No data returned from MangaDex')
      return []
    }

    // Create a set to track unique titles (case-insensitive)
    const uniqueTitles = new Set()
    const uniqueManga: any[] = []

    // Process each manga to get Kitsu poster
    for (const manga of mangadexResponse.data) {
      try {
        const title = Object.values(manga.attributes.title)[0] || 'Unknown Title'
        const normalizedTitle = title.toLowerCase().trim()
        
        // Skip if we've already seen this title (case-insensitive check)
        if (uniqueTitles.has(normalizedTitle)) continue
        
        // Search Kitsu for matching manga
        const kitsuSearchUrl = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(title)}&page[limit]=1`
        const kitsuResponse = await fetch(`/api/proxy/kitsu?url=${encodeURIComponent(kitsuSearchUrl)}`)
        const kitsuData = await kitsuResponse.json()
        
        let posterImage = ''
        if (kitsuData?.data?.[0]?.attributes?.posterImage) {
          posterImage = kitsuData.data[0].attributes.posterImage.large || 
                      kitsuData.data[0].attributes.posterImage.medium ||
                      ''
        }
        
        // Add to unique list
        uniqueTitles.add(normalizedTitle)
        uniqueManga.push({
          ...manga,
          kitsuPoster: posterImage
        })
        
        // Stop if we've reached the limit
        if (uniqueManga.length >= limit) break
        
      } catch (error) {
        console.error(`Error processing manga:`, error)
        continue
      }
    }
    
    return uniqueManga
    
  } catch (error) {
    console.error('Error in getMangaDexTrendingWithKitsuPosters:', error)
    return []
  }
}
