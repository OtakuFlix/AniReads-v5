'use client'

import { useEffect, useState } from 'react'
import { Clock, BookOpen, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

interface ContinueReadingItem {
  lastTime: string
  mangaId: string
  mangaSlug: string
  mangaName: string
  chapterPage: {
    chapter: string
    page: number
    totalPages?: number
  }
  posterUrl?: string
}

export default function ContinueReadingSection() {
  const [continueReading, setContinueReading] = useState<ContinueReadingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContinueReading = () => {
      try {
        const readingHistory = JSON.parse(localStorage.getItem('readingHistory') || '{}')
        const items: ContinueReadingItem[] = []

        for (const [mangaSlug, data] of Object.entries(readingHistory)) {
          if (data && typeof data === 'object' && 'lastRead' in data) {
            const historyData = data as any
            items.push({
              lastTime: historyData.lastRead,
              mangaId: historyData.chapterId || mangaSlug,
              mangaSlug: mangaSlug,
              mangaName: historyData.mangaTitle || mangaSlug.replace(/-/g, ' '),
              chapterPage: {
                chapter: historyData.chapter || 'Unknown',
                page: historyData.page || 1,
                totalPages: historyData.totalPages
              },
              posterUrl: historyData.posterUrl
            })
          }
        }

        // Sort by last read time (most recent first)
        items.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
        
        // Take only the most recent 6 items
        setContinueReading(items.slice(0, 6))
      } catch (error) {
        console.error('Error loading continue reading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContinueReading()
  }, [])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-red-500" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            Continue Reading
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3 animate-pulse">
              <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-2 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (continueReading.length === 0) {
    return null
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-red-500" />
        <h2 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
          Continue Reading
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {continueReading.map((item) => (
          <Link
            key={`${item.mangaSlug}-${item.lastTime}`}
            href={`/manga/${item.mangaSlug}`}
            className="group relative"
          >
            <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={item.posterUrl || "/placeholder.svg"}
                  alt={item.mangaName}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Continue Reading Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-600/90 text-white text-xs">
                    <Play className="w-3 h-3 mr-1" />
                    Continue
                  </Badge>
                </div>

                {/* Progress Info */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/70 rounded px-2 py-1 space-y-1">
                    <div className="text-white text-xs font-medium">
                      Ch. {item.chapterPage.chapter}
                    </div>
                    <div className="text-gray-300 text-xs">
                      Page {item.chapterPage.page}
                      {item.chapterPage.totalPages && ` / ${item.chapterPage.totalPages}`}
                    </div>
                    {item.chapterPage.totalPages && (
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div 
                          className="bg-red-500 h-1 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((item.chapterPage.page / item.chapterPage.totalPages) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors text-sm line-clamp-2 leading-tight">
                  {item.mangaName}
                </h3>
                
                <div className="text-xs text-gray-400">
                  {formatTimeAgo(item.lastTime)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}