'use client'

import Image from 'next/image'

interface MangaBannerProps {
  coverUrl: string | null
  title: string
}

export default function MangaBanner({ coverUrl, title }: MangaBannerProps) {
  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
      <Image
        src={coverUrl || '/placeholder.svg'}
        alt={`${title} banner`}
        fill
        className="object-cover object-center"
        unoptimized
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/60 to-transparent" />
    </div>
  )
}
