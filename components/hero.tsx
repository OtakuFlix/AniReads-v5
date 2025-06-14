"use client"

import type React from "react"

import { useState } from "react"
import { Search, BookOpen, TrendingUp, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-900/20 via-black to-red-900/20">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-10" />
      <div className="relative container mx-auto px-4 py-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              AniReads
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
              Discover, read, and immerse yourself in the world's best manga collection
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for manga titles, authors, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-gray-800/50 border-gray-700 focus:border-red-500 focus:ring-red-500/20 rounded-xl backdrop-blur-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg px-6"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <div className="flex items-center gap-2 bg-gray-800/30 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">10,000+ Manga</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/30 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Daily Updates</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/30 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
              <Star className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">HD Quality</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
