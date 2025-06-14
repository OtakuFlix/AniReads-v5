// MangaDx API types
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

// Helper function to get primary English title - ALWAYS use title.en first
export function getPrimaryEnglishTitle(manga: Manga): string {
  // ALWAYS prioritize the primary English title from title.en
  if (manga.attributes.title.en) {
    return manga.attributes.title.en
  }
  
  // If no primary English title, try other languages in order of preference
  const titleKeys = Object.keys(manga.attributes.title)
  const preferredOrder = ['en-us', 'ja-ro', 'ja']
  
  for (const lang of preferredOrder) {
    if (manga.attributes.title[lang]) {
      return manga.attributes.title[lang]
    }
  }
  
  // Fallback to first available title
  return Object.values(manga.attributes.title)[0] || 'Unknown Title'
}

// Helper function to correctly format query parameters for MangaDx API
function formatMangaDxQueryParams(params: Record<string, any>): string {
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
export async function searchMangaDxManga(query: string, limit = 20, offset = 0) {
  const params = {
    title: query,
    limit: limit.toString(),
    offset: offset.toString(),
    includes: ["cover_art", "author", "artist"],
    contentRating: ["safe", "suggestive", "erotica"],
    order: { relevance: "desc" },
  }
  const queryString = formatMangaDxQueryParams(params)

  const response = await fetch(`/api/proxy/mangadx/manga?${queryString}`)
  return response.json() as Promise<MangaList>
}

export async function getMangaDxManga(id: string) {
  const params = {
    includes: ["cover_art", "author", "artist", "tag"],
  }
  const queryString = formatMangaDxQueryParams(params)

  const response = await fetch(`/api/proxy/mangadx/manga/${id}?${queryString}`)
  return response.json() as Promise<MangaResponse>
}

export async function getMangaDxChapters(mangaId: string, limit = 100, offset = 0, translatedLanguage = "en") {
  const params = {
    limit: limit.toString(),
    offset: offset.toString(),
    translatedLanguage: [translatedLanguage],
    order: { volume: "asc", chapter: "asc" },
  }
  const queryString = formatMangaDxQueryParams(params)

  const response = await fetch(`/api/proxy/mangadx/manga/${mangaId}/feed?${queryString}`)
  return response.json() as Promise<ChapterList>
}

export async function getMangaDxChapter(id: string) {
  const response = await fetch(`/api/proxy/mangadx/chapter/${id}?includes[]=scanlation_group`)
  return response.json()
}

export async function getMangaDxChapterPages(id: string) {
  await atHomeRateLimiter.acquire() // Acquire a slot from the rate limiter
  const response = await fetch(`/api/proxy/mangadx/at-home/server/${id}`)
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`MangaDx Chapter Pages API Error (${response.status}):`, errorText)
    throw new Error(`Failed to fetch chapter pages: ${response.statusText}`)
  }
  return response.json()
}

export function getMangaDxCoverImage(mangaId: string, filename: string) {
  return `https://uploads.mangadx.org/covers/${mangaId}/${filename}`
}

export function getCoverImage(mangaId: string, filename: string) {
  return getMangaDxCoverImage(mangaId, filename)
}

export async function getMangaDxPopularManga(limit = 20, offset = 0) {
  const params = {
    limit: limit.toString(),
    offset: offset.toString(),
    includes: ["cover_art"],
    contentRating: ["safe", "suggestive", "erotica"],
    order: { followedCount: "desc" },
  }
  const queryString = formatMangaDxQueryParams(params)

  const response = await fetch(`/api/proxy/mangadx/manga?${queryString}`)
  return response.json() as Promise<MangaList>
}

export async function getLatestUpdates(limit = 20, offset = 0) {
  const params = {
    limit: limit.toString(),
    offset: offset.toString(),
    includes: ["cover_art", "manga"],
    contentRating: ["safe", "suggestive", "erotica"],
    order: { updatedAt: "desc" },
  }
  const queryString = formatMangaDxQueryParams(params)

  const response = await fetch(`/api/proxy/mangadx/chapter?${queryString}`)
  return response.json()
}

export async function getMangaDxLatestUpdates(limit = 20, offset = 0) {
  return getLatestUpdates(limit, offset)
}

export async function getMangaDxRecentWithKitsuPosters(limit = 20) {
  try {
    // First, get recent updates from MangaDx
    const response = await getMangaDxLatestUpdates(limit)
    
    if (!response?.data) {
      console.error('No data returned from MangaDx for recent updates')
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
        const mangaResponse = await getMangaDxManga(mangaId)
        const manga = mangaResponse.data
        
        if (!manga) continue
        
        const title = getPrimaryEnglishTitle(manga)
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
    console.error('Error in getMangaDxRecentWithKitsuPosters:', error)
    return []
  }
}

export async function getMangaDxTrendingWithKitsuPosters(limit = 20) {
  try {
    // First, get trending manga from MangaDx
    const mangadxResponse = await getMangaDxPopularManga(limit)
    
    if (!mangadxResponse?.data) {
      console.error('No data returned from MangaDx')
      return []
    }

    // Create a set to track unique titles (case-insensitive)
    const uniqueTitles = new Set()
    const uniqueManga: any[] = []

    // Process each manga to get Kitsu poster
    for (const manga of mangadxResponse.data) {
      try {
        const title = getPrimaryEnglishTitle(manga)
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
    console.error('Error in getMangaDxTrendingWithKitsuPosters:', error)
    return []
  }
}

// New function to search manga by title and return MangaDx ID
export async function findMangaDxIdByTitle(title: string): Promise<string | null> {
  try {
    const searchResults = await searchMangaDxManga(title, 1)
    if (searchResults.data && searchResults.data.length > 0) {
      return searchResults.data[0].id
    }
    return null
  } catch (error) {
    console.error('Error finding MangaDx ID by title:', error)
    return null
  }
}

// Helper function to convert slug to MangaDx ID
export async function slugToMangaDxId(slug: string): Promise<string | null> {
  // Check if slug is already a MangaDx ID (UUID format)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  
  if (isUUID) {
    return slug
  }
  
  // Convert slug back to searchable title
  const searchTitle = slug.replace(/-/g, ' ')
  
  // Search MangaDx for the manga
  try {
    const searchResults = await searchMangaDxManga(searchTitle, 1)
    if (searchResults.data && searchResults.data.length > 0) {
      return searchResults.data[0].id
    }
    return null
  } catch (error) {
    console.error('Error converting slug to MangaDx ID:', error)
    return null
  }
}