'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BookOpen, Plus, Clock, Pause, X, Check, RotateCcw, List } from 'lucide-react'
import { READING_STATUSES, type ReadingStatus } from '@/lib/library'
import { useAuth } from '@/contexts/auth-context'
import { addToLibrary, createCustomList } from '@/lib/library'
import { toast } from 'sonner'

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mangaData: {
    manga_id: string
    manga_title: string
    manga_slug: string
    poster_url?: string
    total_chapters?: number
  }
}

const statusIcons = {
  reading: BookOpen,
  plan_to_read: Plus,
  on_hold: Pause,
  dropped: X,
  completed: Check,
  re_reading: RotateCcw,
}

export default function QuickAddDialog({ open, onOpenChange, mangaData }: QuickAddDialogProps) {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>('plan_to_read')
  const [showCustomListForm, setShowCustomListForm] = useState(false)
  const [customListName, setCustomListName] = useState('')
  const [customListVisibility, setCustomListVisibility] = useState<'public' | 'private'>('private')
  const [loading, setLoading] = useState(false)

  const handleAddToLibrary = async () => {
    if (!user) {
      toast.error('Please sign in to add manga to your library')
      return
    }

    setLoading(true)
    try {
      const { error } = await addToLibrary(user.id, mangaData, selectedStatus)
      
      if (error) throw error

      const statusLabel = READING_STATUSES.find(s => s.value === selectedStatus)?.label
      toast.success(`Added to ${statusLabel}!`)
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding to library:', error)
      toast.error('Failed to add to library')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomList = async () => {
    if (!user || !customListName.trim()) return

    setLoading(true)
    try {
      const { error } = await createCustomList(
        user.id,
        customListName.trim(),
        undefined,
        customListVisibility === 'public'
      )

      if (error) throw error

      // Add manga to library first, then we can add custom list functionality later
      await handleAddToLibrary()
      
      toast.success('Custom list created and manga added!')
      setShowCustomListForm(false)
      setCustomListName('')
    } catch (error) {
      console.error('Error creating custom list:', error)
      toast.error('Failed to create custom list')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Sign In Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-300 mb-4">Please sign in to add manga to your library</p>
            <Button onClick={() => onOpenChange(false)} className="bg-red-600 hover:bg-red-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {showCustomListForm ? 'Create New Custom List' : 'Reading List'}
          </DialogTitle>
        </DialogHeader>

        {showCustomListForm ? (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Create a new custom list and add "{mangaData.manga_title}" to it.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="list-name" className="text-white">Name</Label>
              <Input
                id="list-name"
                value={customListName}
                onChange={(e) => setCustomListName(e.target.value)}
                placeholder="Enter list name"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white">Visibility</Label>
              <RadioGroup
                value={customListVisibility}
                onValueChange={(value: 'public' | 'private') => setCustomListVisibility(value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="text-white text-sm">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="text-white text-sm">Private</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCustomListForm(false)}
                className="flex-1 border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomList}
                disabled={loading || !customListName.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Create List
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reading Status Options */}
            <div className="space-y-2">
              {READING_STATUSES.map((status) => {
                const Icon = statusIcons[status.value]
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedStatus === status.value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{status.label}</span>
                  </button>
                )
              })}
              
              {/* Create Custom List Option */}
              <button
                onClick={() => setShowCustomListForm(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors border-t border-gray-700 mt-2 pt-4"
              >
                <List className="w-5 h-5" />
                <span>Create Custom List</span>
              </button>
            </div>

            <Button
              onClick={handleAddToLibrary}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Adding...' : `Add to ${READING_STATUSES.find(s => s.value === selectedStatus)?.label}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}