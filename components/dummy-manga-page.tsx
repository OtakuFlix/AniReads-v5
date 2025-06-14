export default function DummyMangaPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative w-[800px] h-[1200px] max-w-full max-h-full bg-gray-800 rounded-lg overflow-hidden shadow-xl animate-breathe">
        {/* Simple pulsating background */}
        <div className="absolute inset-0 bg-gray-700 opacity-70" />
      </div>
    </div>
  )
}
