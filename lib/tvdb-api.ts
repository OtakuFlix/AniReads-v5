// TVDB API types (simplified, as direct manga chapter data is unlikely)
// This is a placeholder for potential future use or if a very specific mapping is intended.
export interface TVDBAuthResponse {
  token: string
}

export interface TVDBSeriesResponse {
  data: {
    id: number
    name: string
    image: string // Main series poster
    // ... other series details
  }
}

export interface TVDBEpisodeResponse {
  data: {
    id: number
    name: string
    image: string // Episode poster/thumbnail
    overview: string
    airedSeason: number
    airedEpisodeNumber: number
    // ... other episode details
  }[]
}

let tvdbToken: string | null = null

async function getTVDBToken(): Promise<string> {
  if (tvdbToken) return tvdbToken

  const response = await fetch("https://api.thetvdb.com/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apikey: process.env.TVDB_API_KEY }),
  })

  if (!response.ok) {
    console.error("Failed to get TVDB token:", response.statusText)
    throw new Error("Failed to authenticate with TVDB")
  }

  const data: TVDBAuthResponse = await response.json()
  tvdbToken = data.token
  return tvdbToken
}

// TVDB API functions (highly unlikely to have direct manga chapter data)
export async function searchTVDBSeries(query: string): Promise<TVDBSeriesResponse | null> {
  try {
    const token = await getTVDBToken()
    const response = await fetch(`https://api.thetvdb.com/search/series?name=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.warn(`TVDB search for "${query}" failed:`, response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error searching TVDB series:", error)
    return null
  }
}

export async function getTVDBSeriesEpisodes(
  seriesId: number,
  season?: number,
  episode?: number,
): Promise<TVDBEpisodeResponse | null> {
  try {
    const token = await getTVDBToken()
    let url = `https://api.thetvdb.com/series/${seriesId}/episodes`
    const params = new URLSearchParams()
    if (season) params.append("airedSeason", season.toString())
    if (episode) params.append("airedEpisode", episode.toString())
    if (params.toString()) url += `?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.warn(`TVDB episodes for series ${seriesId} failed:`, response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching TVDB episodes:", error)
    return null
  }
}

// Placeholder for chapter poster - TVDB is not suitable for manga chapters.
// This function will always return a placeholder.
export function getTVDBChapterPoster(chapterIdentifier: string): string {
  console.warn(
    `Attempted to get TVDB chapter poster for "${chapterIdentifier}". TVDB is not designed for manga chapters. Returning placeholder.`,
  )
  return "/placeholder.svg?height=1200&width=800&text=Chapter+Image+Unavailable"
}
