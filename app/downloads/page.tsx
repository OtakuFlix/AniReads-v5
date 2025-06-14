'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Trash2, FolderOpen, HardDrive, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface DownloadedChapter {
  id: string
  mangaId: string
  mangaTitle: string
  mangaSlug: string
  chapterId: string
  chapterNumber: string
  chapterTitle: string
  posterUrl: string
  pages: string[]
  downloadedAt: string
  size: number
}

export default function DownloadsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [downloads, setDownloads] = useState<DownloadedChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSize, setTotalSize] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      loadDownloads()
    }
  }, [user, authLoading, router])

  const loadDownloads = () => {
    try {
      const savedDownloads = JSON.parse(localStorage.getItem('manga_downloads') || '[]')
      setDownloads(savedDownloads)
      
      const size = savedDownloads.reduce((acc: number, download: DownloadedChapter) => acc + download.size, 0)
      setTotalSize(size)
    } catch (error) {
      console.error('Error loading downloads:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteDownload = (downloadId: string) => {
    try {
      const updatedDownloads = downloads.filter(d => d.id !== downloadId)
      localStorage.setItem('manga_downloads', JSON.stringify(updatedDownloads))
      setDownloads(updatedDownloads)
      
      const size = updatedDownloads.reduce((acc, download) => acc + download.size, 0)
      setTotalSize(size)
      
      toast.success('Download deleted successfully')
    } catch (error) {
      console.error('Error deleting download:', error)
      toast.error('Failed to delete download')
    }
  }

  const clearAllDownloads = () => {
    try {
      localStorage.removeItem('manga_downloads')
      setDownloads([])
      setTotalSize(0)
      toast.success('All downloads cleared')
    } catch (error) {
      console.error('Error clearing downloads:', error)
      toast.error('Failed to clear downloads')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gray-800 rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Downloads
              </h1>
              <p className="text-gray-400 mt-2">
                {downloads.length} chapters • {formatSize(totalSize)}
              </p>
            </div>
            
            {downloads.length > 0 && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={clearAllDownloads}
                  className="border-red-600 text-red-400 hover:bg-red-600/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Storage Info */}
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-full">
                  <HardDrive className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Storage Usage</h3>
                  <p className="text-gray-400">
                    {formatSize(totalSize)} used • {downloads.length} chapters downloaded
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Downloads List */}
          {downloads.length === 0 ? (
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Downloads Yet</h3>
                <p className="text-gray-400 mb-6">Download chapters to read offline</p>
                <Button asChild>
                  <Link href="/search">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Browse Manga
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {downloads.map((download) => (
                <Card key={download.id} className="bg-gray-800/30 border-gray-700/50 hover:border-red-500/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={download.posterUrl || "/placeholder.svg"}
                          alt={download.mangaTitle}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white truncate">
                              {download.mangaTitle}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              Chapter {download.chapterNumber}
                              {download.chapterTitle && `: ${download.chapterTitle}`}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{download.pages.length} pages</span>
                              <span>{formatSize(download.size)}</span>
                              <span>{formatDate(download.downloadedAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                              Downloaded
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDownload(download.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/reader/${download.mangaSlug}/${download.chapterId}`}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Read Offline
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/manga/${download.mangaSlug}`}>
                          View Manga
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}