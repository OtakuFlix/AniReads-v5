'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Plus, BookOpen, Clock, Pause, X, Check, RotateCcw } from 'lucide-react'
import { READING_STATUSES, type ReadingStatus } from '@/lib/library'
import { useAuth } from '@/contexts/auth-context'
import { addToLibrary, updateLibraryEntry, removeFromLibrary, getLibraryEntry } from '@/lib/library'
import { toast } from 'sonner'
import QuickAddDialog from './quick-add-dialog'

interface LibraryStatusSelectorProps {
  mangaData: {
    manga_id: string
    manga_title: string
    manga_slug: string
    poster_url?: string
    total_chapters?: number
  }
  onStatusChange?: (status: ReadingStatus | null) => void
}

const statusIcons = {
  reading: BookOpen,
  plan_to_read: Plus,
  on_hold: Pause,
  dropped: X,
  completed: Check,
  re_reading: RotateCcw,
}

export default function LibraryStatusSelector({ 
  mangaData, 
  onStatusChange 
}: LibraryStatusSelectorProps) {
  const { user } = useAuth()
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  useEffect(() => {
    if (user) {
      checkLibraryStatus()
    }
  }, [user, mangaData.manga_id])

  const checkLibraryStatus = async () => {
    if (!user) return

    try {
      const entry = await getLibraryEntry(user.id, mangaData.manga_id)
      setCurrentStatus(entry?.status || null)
    } catch (error) {
      console.error('Error checking library status:', error)
    }
  }

  const handleStatusChange = async (newStatus: ReadingStatus) => {
    if (!user) return

    setLoading(true)
    try {
      if (currentStatus) {
        // Update existing entry
        const { error } = await updateLibraryEntry(user.id, mangaData.manga_id, {
          status: newStatus
        })
        if (error) throw error
      } else {
        // Add new entry
        const { error } = await addToLibrary(user.id, mangaData, newStatus)
        if (error) throw error
      }

      setCurrentStatus(newStatus)
      onStatusChange?.(newStatus)
      toast.success(`Added to ${READING_STATUSES.find(s => s.value === newStatus)?.label}`)
    } catch (error) {
      console.error('Error updating library status:', error)
      toast.error('Failed to update library status')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromLibrary = async () => {
    if (!user || !currentStatus) return

    setLoading(true)
    try {
      const { error } = await removeFromLibrary(user.id, mangaData.manga_id)
      if (error) throw error

      setCurrentStatus(null)
      onStatusChange?.(null)
      toast.success('Removed from library')
    } catch (error) {
      console.error('Error removing from library:', error)
      toast.error('Failed to remove from library')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Button 
        onClick={() => setShowQuickAdd(true)}
        variant="outline" 
        className="border-gray-600 hover:border-red-500 text-gray-300 px-6 py-3"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add to Library
      </Button>
    )
  }

  const currentStatusData = currentStatus 
    ? READING_STATUSES.find(s => s.value === currentStatus)
    : null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={currentStatus ? "default" : "outline"}
            className={currentStatus ? "bg-green-600 hover:bg-green-700" : "border-gray-600 hover:border-red-500 text-gray-300 px-6 py-3"}
            disabled={loading}
          >
            {currentStatus ? (
              <>
                {React.createElement(statusIcons[currentStatus], { className: "w-4 h-4 mr-2" })}
                {currentStatusData?.label}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Library
              </>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {READING_STATUSES.map((status) => {
            const Icon = statusIcons[status.value]
            return (
              <DropdownMenuItem
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {status.label}
                {currentStatus === status.value && (
                  <Badge variant="secondary" className="ml-auto">
                    Current
                  </Badge>
                )}
              </DropdownMenuItem>
            )
          })}
          {currentStatus && (
            <>
              <div className="border-t my-1" />
              <DropdownMenuItem
                onClick={handleRemoveFromLibrary}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Remove from Library
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <QuickAddDialog
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        mangaData={mangaData}
      />
    </>
  )
}