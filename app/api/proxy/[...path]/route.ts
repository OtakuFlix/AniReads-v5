import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
  try {
    const searchParams = request.nextUrl.searchParams
    const directUrl = searchParams.get("url")

    // Case 1: If `url` param is provided, do a direct fetch
    if (directUrl) {
      const decodedUrl = decodeURIComponent(directUrl)
      try {
        const response = await fetch(decodedUrl)
        const data = await response.text()
        return new Response(data, {
          status: response.status,
          headers: {
            "content-type": response.headers.get("content-type") ?? "application/json",
          },
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: "API request failed", details: String(err) }), {
          status: 500,
        })
      }
    }

    // Case 2: Fallback to dynamic proxy based on path
    if (!params?.path || params.path.length === 0) {
      return NextResponse.json({ error: "Missing API path parameters" }, { status: 400 })
    }

    const [apiName, ...apiPathSegments] = params.path
    const apiPath = apiPathSegments.join("/")
    const baseSearchParams = searchParams.toString()

    let baseUrl: string | undefined
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    switch (apiName) {
      case "mangadx":
      case "mangadex":
        baseUrl = process.env.MANGADX_API_URL || "https://api.mangadex.org"
        break
      case "kitsu":
        baseUrl = process.env.KITSU_API_URL || "https://kitsu.io/api/edge"
        break
      default:
        return NextResponse.json({ error: "Invalid API name" }, { status: 400 })
    }

    if (!baseUrl) {
      return NextResponse.json({ error: `Base URL for ${apiName} not configured` }, { status: 500 })
    }

    const url = `${baseUrl}/${apiPath}${baseSearchParams ? `?${baseSearchParams}` : ""}`

    console.log("Proxy GET Fetching URL:", url)

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error("Proxy GET error:", error)
    return NextResponse.json({ error: "Failed to fetch data via proxy" }, { status: 500 })
  }
}


export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const [apiName, ...apiPathSegments] = params.path
    const apiPath = apiPathSegments.join("/")
    const body = await request.json()

    let baseUrl: string | undefined
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    switch (apiName) {
      case "mangadx":
      case "mangadex":
        baseUrl = process.env.MANGADX_API_URL || "https://api.mangadex.org"
        break
      case "kitsu":
        baseUrl = process.env.KITSU_API_URL || "https://kitsu.io/api/edge"
        break
      default:
        return NextResponse.json({ error: "Invalid API name" }, { status: 400 })
    }

    if (!baseUrl) {
      return NextResponse.json({ error: `Base URL for ${apiName} not configured` }, { status: 500 })
    }

    const url = `${baseUrl}/${apiPath}`

    console.log("Proxy POSTing to URL:", url)
    console.log("Proxy POST Request Body:", body)

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    })

    // Check if the response is not OK (e.g., 404, 500)
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Proxy POST Error Response (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Proxy POST Received Response:", data)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Proxy POST error:", error)
    return NextResponse.json({ error: "Failed to post data via proxy" }, { status: 500 })
  }
}