'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, X } from 'lucide-react'
import { createCustomList } from '@/lib/library'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface CustomListDialogProps {
  onListCreated?: () => void
}

export default function CustomListDialog({ onListCreated }: CustomListDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim()) return

    setLoading(true)
    try {
      const { error } = await createCustomList(
        user.id,
        formData.name.trim(),
        formData.description.trim() || undefined,
        formData.visibility === 'public'
      )

      if (error) throw error

      toast.success('Custom list created successfully!')
      setOpen(false)
      setFormData({ name: '', description: '', visibility: 'private' })
      onListCreated?.()
    } catch (error) {
      console.error('Error creating custom list:', error)
      toast.error('Failed to create custom list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Plus className="w-4 h-4 mr-2" />
          Create Custom List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Custom List
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">Name</Label>
            <Input
              id="list-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter list name"
              required
              className="border-red-200 focus:border-red-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-description">Description (Optional)</Label>
            <Textarea
              id="list-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your list..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <RadioGroup
              value={formData.visibility}
              onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="text-sm">Public</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="text-sm">Private</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Create List
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}