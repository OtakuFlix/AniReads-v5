'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Heart, Reply, MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Comment {
  id: string
  user_id: string
  manga_id: string
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  user_profile: {
    username: string | null
    avatar_url: string | null
  }
  is_liked?: boolean
}

interface MangaCommentsProps {
  mangaId: string
  mangaTitle: string
}

export default function MangaComments({ mangaId, mangaTitle }: MangaCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [mangaId])

  const loadComments = async () => {
    try {
      setLoading(true)
      
      // Fetch comments with user profiles
      const { data: commentsData, error } = await supabase
        .from('manga_comments')
        .select(`
          *,
          user_profile:profiles(username, avatar_url)
        `)
        .eq('manga_id', mangaId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // If user is logged in, check which comments they've liked
      let commentsWithLikes = commentsData || []
      if (user && commentsData) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentsData.map(c => c.id))

        const likedCommentIds = new Set(likesData?.map(l => l.comment_id) || [])
        commentsWithLikes = commentsData.map(comment => ({
          ...comment,
          is_liked: likedCommentIds.has(comment.id)
        }))
      }

      setComments(commentsWithLikes)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('manga_comments')
        .insert({
          user_id: user.id,
          manga_id: mangaId,
          content: newComment.trim()
        })
        .select(`
          *,
          user_profile:profiles(username, avatar_url)
        `)
        .single()

      if (error) throw error

      setComments(prev => [data, ...prev])
      setNewComment('')
      toast.success('Comment posted!')
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments')
      return
    }

    try {
      const comment = comments.find(c => c.id === commentId)
      if (!comment) return

      if (comment.is_liked) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId)

        if (error) throw error

        // Update local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, likes_count: c.likes_count - 1, is_liked: false }
            : c
        ))
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          })

        if (error) throw error

        // Update local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, likes_count: c.likes_count + 1, is_liked: true }
            : c
        ))
      }
    } catch (error) {
      console.error('Error liking comment:', error)
      toast.error('Failed to like comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('manga_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id) // Ensure user can only delete their own comments

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getInitials = (username: string | null) => {
    if (!username) return 'U'
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="bg-gray-800/30 border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-red-600 text-white text-xs">
                  {getInitials(user.profile?.username || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`Share your thoughts about ${mangaTitle}...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="bg-gray-700/30 border-gray-600">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 mb-3">Sign in to join the discussion</p>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4" />
                    <div className="h-16 bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-700/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gray-600 text-white text-xs">
                      {getInitials(comment.user_profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white text-sm">
                        {comment.user_profile?.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <Badge variant="outline" className="text-xs">
                          Edited
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      {comment.content}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        className={`text-xs ${
                          comment.is_liked 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${comment.is_liked ? 'fill-current' : ''}`} />
                        {comment.likes_count}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                  
                  {user && user.id === comment.user_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-400 hover:text-gray-300">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}