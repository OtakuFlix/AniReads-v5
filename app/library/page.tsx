'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { getUserLibrary, getUserCustomLists, getLibraryStats, type ReadingStatus } from '@/lib/library'
import { READING_STATUSES } from '@/lib/library'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Plus, Clock, Pause, X, Check, RotateCcw, List, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/loading-spinner'
import CustomListDialog from '@/components/library/custom-list-dialog'
import type { Database } from '@/lib/supabase'

type LibraryEntry = Database['public']['Tables']['user_manga_library']['Row']
type CustomList = Database['public']['Tables']['custom_lists']['Row']

const statusIcons = {
  reading: BookOpen,
  plan_to_read: Plus,
  on_hold: Pause,
  dropped: X,
  completed: Check,
  re_reading: RotateCcw,
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [library, setLibrary] = useState<LibraryEntry[]>([])
  const [customLists, setCustomLists] = useState<CustomList[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      loadLibraryData()
    }
  }, [user, authLoading, router])

  const loadLibraryData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [libraryData, customListsData, statsData] = await Promise.all([
        getUserLibrary(user.id),
        getUserCustomLists(user.id),
        getLibraryStats(user.id)
      ])

      setLibrary(libraryData)
      setCustomLists(customListsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading library data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLibrary = (status?: ReadingStatus, customListId?: string) => {
    let filtered = library

    if (status) {
      filtered = filtered.filter(entry => entry.status === status)
    }

    if (customListId) {
      filtered = filtered.filter(entry => entry.custom_list_id === customListId)
    }

    return filtered
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
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
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Library
            </h1>
            
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card className="bg-gray-800/30 border-gray-700/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-white">{stats.total || 0}</div>
                    <div className="text-sm text-gray-400">Total</div>
                  </CardContent>
                </Card>
                {READING_STATUSES.map((status) => {
                  const Icon = statusIcons[status.value]
                  const count = stats[status.value] || 0
                  return (
                    <Card key={status.value} className="bg-gray-800/30 border-gray-700/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Icon className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="text-xl font-bold text-white">{count}</div>
                        <div className="text-xs text-gray-400">{status.label}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-800/50 border border-gray-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-red-600">
                All ({library.length})
              </TabsTrigger>
              {READING_STATUSES.map((status) => {
                const Icon = statusIcons[status.value]
                const count = getFilteredLibrary(status.value).length
                return (
                  <TabsTrigger 
                    key={status.value} 
                    value={status.value}
                    className="data-[state=active]:bg-red-600"
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {status.label} ({count})
                  </TabsTrigger>
                )
              })}
              <TabsTrigger value="custom-lists" className="data-[state=active]:bg-red-600">
                <List className="w-4 h-4 mr-1" />
                Custom Lists
              </TabsTrigger>
            </TabsList>

            {/* All Library */}
            <TabsContent value="all" className="space-y-6">
              <LibraryGrid entries={library} />
            </TabsContent>

            {/* Status-specific tabs */}
            {READING_STATUSES.map((status) => (
              <TabsContent key={status.value} value={status.value} className="space-y-6">
                <LibraryGrid entries={getFilteredLibrary(status.value)} />
              </TabsContent>
            ))}

            {/* Custom Lists */}
            <TabsContent value="custom-lists" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Custom Lists</h2>
                  <CustomListDialog onListCreated={loadLibraryData} />
                </div>

                {customLists.length === 0 ? (
                  <Card className="bg-gray-800/30 border-gray-700/50">
                    <CardContent className="p-8 text-center">
                      <List className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Custom Lists</h3>
                      <p className="text-gray-400 mb-4">Create custom lists to organize your manga collection</p>
                      <CustomListDialog onListCreated={loadLibraryData} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {customLists.map((list) => {
                      const listEntries = getFilteredLibrary(undefined, list.id)
                      return (
                        <Card key={list.id} className="bg-gray-800/30 border-gray-700/50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-white">{list.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={list.is_public ? "default" : "secondary"}>
                                  {list.is_public ? "Public" : "Private"}
                                </Badge>
                                <Badge variant="outline">
                                  {listEntries.length} manga
                                </Badge>
                              </div>
                            </div>
                            {list.description && (
                              <p className="text-gray-400 text-sm">{list.description}</p>
                            )}
                          </CardHeader>
                          <CardContent>
                            <LibraryGrid entries={listEntries} />
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function LibraryGrid({ entries }: { entries: LibraryEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card className="bg-gray-800/30 border-gray-700/50">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No manga found</h3>
          <p className="text-gray-400">Start building your library by adding manga!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {entries.map((entry) => {
        const statusData = READING_STATUSES.find(s => s.value === entry.status)
        const StatusIcon = statusData ? statusIcons[statusData.value] : BookOpen

        return (
          <Link
            key={entry.id}
            href={`/manga/${entry.manga_slug}`}
            className="group relative"
          >
            <Card className="bg-gray-800/30 border-gray-700/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={entry.poster_url || "/placeholder.svg"}
                  alt={entry.manga_title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-600/90 text-white text-xs">
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusData?.label}
                  </Badge>
                </div>

                {/* Progress */}
                {entry.progress > 0 && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/50 rounded px-2 py-1">
                      <div className="text-white text-xs">
                        Ch. {entry.progress}
                        {entry.total_chapters && ` / ${entry.total_chapters}`}
                      </div>
                      {entry.total_chapters && (
                        <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                          <div 
                            className="bg-red-500 h-1 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min((entry.progress / entry.total_chapters) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-3">
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors text-sm line-clamp-2 leading-tight">
                  {entry.manga_title}
                </h3>
                {entry.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="text-yellow-400 text-xs">★</div>
                    <span className="text-gray-400 text-xs">{entry.rating}/10</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}