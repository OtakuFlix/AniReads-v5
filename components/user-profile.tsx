'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, Save, User, Mail, Calendar, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
]

interface UserProfileProps {
  onClose?: () => void
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user, refreshUser } = useAuth()
  const [username, setUsername] = useState(user?.profile?.username || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await updateProfile(user.id, {
        username: username.trim() || null,
        avatar_url: avatarUrl || null,
      })

      if (error) throw error

      await refreshUser()
      toast.success('Profile updated successfully!')
      onClose?.()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
      toast.success('Avatar uploaded successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gray-800/30 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-red-600 text-white text-xl">
                  {getInitials(username || user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 bg-gray-800 border-gray-600"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {showAvatarPicker && (
              <Card className="w-full bg-gray-700/50 border-gray-600">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Choose Avatar</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAvatarPicker(false)}
                      className="text-gray-400"
                    >
                      ×
                    </Button>
                  </div>

                  {/* Upload Custom Avatar */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-gray-600 text-gray-300"
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Custom Avatar
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-400">Max 2MB, JPG/PNG only</p>
                  </div>

                  {/* Preset Avatars */}
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Or choose a preset:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_PRESETS.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setAvatarUrl(preset)
                            setShowAvatarPicker(false)
                          }}
                          className={`relative rounded-full overflow-hidden border-2 transition-colors ${
                            avatarUrl === preset
                              ? 'border-red-500'
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={preset}
                            alt={`Avatar ${index + 1}`}
                            className="w-12 h-12 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-md border border-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{user.email}</span>
                <Badge variant="outline" className="ml-auto">
                  {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Member Since</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-md border border-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}