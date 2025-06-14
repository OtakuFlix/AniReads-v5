'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Star, Eye, Calendar, Bookmark } from 'lucide-react'
import QuickAddDialog from '@/components/library/quick-add-dialog'

interface MangaCardProps {
  id: string
  title: string
  slug?: string
  posterUrl: string
  coverUrl?: string
  description?: string
  rating?: string | number
  status?: string
  year?: number
  contentRating?: string
  showAddButton?: boolean
  className?: string
  genres?: string[]
}

export default function MangaCard({
  id,
  title,
  slug,
  posterUrl,
  coverUrl = '',
  description = '',
  rating,
  status,
  year,
  contentRating,
  showAddButton = true,
  className = '',
  genres = []
}: MangaCardProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Always use MangaDx ID for routing
  const linkHref = `/manga/${id}`

  const mangaData = {
    manga_id: id,
    manga_title: title,
    manga_slug: id, // Use MangaDx ID as slug for consistency
    poster_url: posterUrl,
    cover_url: coverUrl,
    description: description,
    year: year,
    content_rating: contentRating || ''
  }
  
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowQuickAdd(true)
  }

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return {
          color: 'from-emerald-500 to-green-400',
          bg: 'bg-emerald-500/90',
          text: 'text-white',
          border: 'border-emerald-400/60',
          shadow: 'shadow-emerald-500/50',
          icon: '🔥'
        }
      case 'completed':
        return {
          color: 'from-blue-500 to-cyan-400',
          bg: 'bg-blue-500/90',
          text: 'text-white',
          border: 'border-blue-400/60',
          shadow: 'shadow-blue-500/50',
          icon: '✓'
        }
      case 'hiatus':
        return {
          color: 'from-amber-500 to-yellow-400',
          bg: 'bg-amber-500/90',
          text: 'text-white',
          border: 'border-amber-400/60',
          shadow: 'shadow-amber-500/50',
          icon: '⏸'
        }
      case 'cancelled':
        return {
          color: 'from-red-500 to-rose-400',
          bg: 'bg-red-500/90',
          text: 'text-white',
          border: 'border-red-400/60',
          shadow: 'shadow-red-500/50',
          icon: '✕'
        }
      default:
        return {
          color: 'from-gray-500 to-slate-400',
          bg: 'bg-gray-500/90',
          text: 'text-white',
          border: 'border-gray-400/60',
          shadow: 'shadow-gray-500/50',
          icon: '?'
        }
    }
  }

  const getContentRatingConfig = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'safe':
        return {
          bg: 'bg-green-500/95',
          text: 'text-white',
          border: 'border-green-400/70',
          shadow: 'shadow-green-500/40'
        }
      case 'suggestive':
        return {
          bg: 'bg-amber-500/95',
          text: 'text-white',
          border: 'border-amber-400/70',
          shadow: 'shadow-amber-500/40'
        }
      case 'erotica':
      case 'nsfw':
        return {
          bg: 'bg-red-500/95',
          text: 'text-white',
          border: 'border-red-400/70',
          shadow: 'shadow-red-500/40'
        }
      default:
        return {
          bg: 'bg-gray-500/95',
          text: 'text-white',
          border: 'border-gray-400/70',
          shadow: 'shadow-gray-500/40'
        }
    }
  }

  const statusConfig = status ? getStatusConfig(status) : null
  const ratingConfig = contentRating ? getContentRatingConfig(contentRating) : null

  return (
    <>
      <div className={`group relative transform transition-all duration-700 hover:scale-[1.03] ${className}`}>
        <Link href={linkHref} className="block">
          <div className="relative bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-600/20 hover:border-red-400/40 transition-all duration-700 hover:shadow-2xl hover:shadow-red-500/20 group-hover:bg-gradient-to-br group-hover:from-slate-800/70 group-hover:to-slate-900/80">
            
            {/* Premium Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={posterUrl || "/placeholder.svg"}
                alt={title}
                fill
                className={`object-cover transition-all duration-1000 ease-out ${imageLoaded ? 'scale-100' : 'scale-110'} group-hover:scale-110 group-hover:brightness-110`}
                onLoad={() => setImageLoaded(true)}
                unoptimized
              />
              
              {/* Multi-layered sophisticated overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-black/40 group-hover:from-red-900/10 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
              
              {/* Enhanced Status Badge with Crystal Clear Backdrop */}
              {status && statusConfig && (
                <div className="absolute top-4 left-4 z-20">
                  <div className="relative">
                    {/* Background blur container with enhanced visibility */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${statusConfig.color} opacity-20 rounded-xl`} />
                    
                    {/* Status content */}
                    <div className="relative px-3 py-2 flex items-center space-x-2">
                      <span className="text-sm">{statusConfig.icon}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.text} border-2 ${statusConfig.border} shadow-lg ${statusConfig.shadow} backdrop-blur-sm`}
                      >
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium Add to Library Button */}
              {showAddButton && (
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                    <Button
                      onClick={handleAddClick}
                      size="icon"
                      className="relative bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl w-11 h-11 shadow-2xl backdrop-blur-sm border border-red-400/30 hover:border-red-300/50 transition-all duration-300 hover:shadow-red-500/40"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Enhanced Content Rating */}
              <div className="absolute bottom-4 right-4 z-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl" />
                  {ratingConfig && (
                    <Badge 
                      variant="outline" 
                      className={`relative text-xs font-black px-3 py-2 rounded-xl border-2 ${ratingConfig.bg} ${ratingConfig.text} ${ratingConfig.border} shadow-lg ${ratingConfig.shadow} backdrop-blur-sm`}
                    >
                      {contentRating ? contentRating.toUpperCase() : 'N/A'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Premium Rating Display */}
              {rating && (
                <div className="absolute bottom-4 left-4 z-20">
                  <div className="relative">
                    
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl" />
                    <div className="relative flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white rounded-xl backdrop-blur-sm border border-amber-400/40 shadow-lg shadow-amber-500/30">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold">{rating}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hover overlay with premium effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/0 via-transparent to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-700" />
            </div>

            {/* Premium Content Section */}
            <div className="relative p-5 space-y-4 bg-gradient-to-b from-slate-800/30 to-slate-900/50 backdrop-blur-sm">
              <div className="space-y-3">
                <h3 className="font-black text-white text-lg leading-tight line-clamp-2 group-hover:text-red-100 transition-colors duration-500 tracking-tight">
                  {title}
                </h3>
                
                {description && (
                  <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed group-hover:text-slate-200 transition-colors duration-500 font-medium">
                    {description}
                  </p>
                )}

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {genres.slice(0, 2).map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="bg-gray-700/50 text-gray-300 text-xs"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Premium Footer */}
              <div className="flex justify-between items-center pt-3 mt-4 border-t border-slate-600/30">
                <div className="flex items-center space-x-2">
                  {year && (
                    <div className="flex items-center space-x-1 text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs font-semibold">{year}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-red-500 via-red-400 to-red-500 rounded-full opacity-60 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-red-500/30 transition-all duration-500"></div>
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors duration-300" />
                </div>
              </div>
            </div>

            {/* Premium shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>
          </div>
        </Link>
      </div>

      <QuickAddDialog
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        mangaData={mangaData}
      />
    </>
  )
}