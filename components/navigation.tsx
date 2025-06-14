"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Search, Bookmark, Download, Menu, X, User, LogOut, Library, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "@/components/auth/auth-modal"
import UserProfile from "@/components/user-profile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  const navItems = [
    { href: "/", label: "Home", icon: BookOpen },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Library", icon: Library, requireAuth: true },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark, requireAuth: false },
    { href: "/downloads", label: "Downloads", icon: Download, requireAuth: true },
  ]

  // Hide navigation on reader pages
  if (pathname.startsWith("/reader/")) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
                AniReads
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                // Skip auth-required items if user is not logged in
                if (item.requireAuth && !user) return null
                
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Menu / Auth */}
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-red-600 text-white">
                          {user.profile?.username 
                            ? getInitials(user.profile.username)
                            : getInitials(user.email || 'U')
                          }
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user.profile?.username || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/library" className="flex items-center">
                        <Library className="mr-2 h-4 w-4" />
                        <span>My Library</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="flex items-center">
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>Bookmarks</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/downloads" className="flex items-center">
                        <Download className="mr-2 h-4 w-4" />
                        <span>Downloads</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-white hover:bg-gray-800"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              <div className="space-y-2">
                {navItems.map((item) => {
                  // Skip auth-required items if user is not logged in
                  if (item.requireAuth && !user) return null
                  
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <UserProfile onClose={() => setProfileModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}