import { Suspense } from "react"
import Hero from "@/components/hero"
import SpotlightSection from "@/components/spotlight-section"
import ContinueReadingSection from "@/components/continue-reading-section"
import TrendingMangaSection from "@/components/trending-manga-section"
import RecentMangaSection from "@/components/recent-manga-section"
import LoadingSpinner from "@/components/loading-spinner"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-16">
        <Suspense fallback={<LoadingSpinner />}>
          <SpotlightSection />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <ContinueReadingSection />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <TrendingMangaSection />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <RecentMangaSection />
        </Suspense>
      </div>
    </div>
  )
}