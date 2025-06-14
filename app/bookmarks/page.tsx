'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bookmark as BookmarkIcon, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBookmarks, removeBookmark, Bookmark as BookmarkType } from '@/lib/bookmark-utils'

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedBookmarks = getBookmarks()
    setBookmarks(savedBookmarks)
    setLoading(false)
  }, [])

  const handleRemoveBookmark = (id: string) => {
    if (removeBookmark(id)) {
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id))
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gray-800 rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookmarkIcon className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">No Bookmarks Found</h1>
          <p className="text-gray-400 mb-6">You haven't bookmarked any manga or anime yet.</p>
          <Button asChild>
            <Link href="/search">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Manga
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Bookmarks</h1>
          <span className="text-gray-400">{bookmarks.length} of 5 slots used</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="relative h-48 w-full">
                {bookmark.posterUrl ? (
                  <Image
                    src={bookmark.posterUrl}
                    alt={bookmark.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <BookmarkIcon className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-gray-900/80 hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemoveBookmark(bookmark.id)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white line-clamp-2 text-lg">{bookmark.title}</h3>
                  <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full">
                    {bookmark.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Bookmarked on {formatDate(bookmark.timestamp)}
                </p>
                <div className="mt-4">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/${bookmark.type}/${bookmark.slug}`}>
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Continue Reading
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
