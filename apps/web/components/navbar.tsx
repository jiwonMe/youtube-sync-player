"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser, UserButton, SignInButton } from "@clerk/nextjs"
import { Menu, X, Youtube, Home, PlusCircle, LogIn, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 모바일 메뉴 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // 모바일 메뉴가 열려있을 때 스크롤 방지
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMenuOpen])

  return (
    <header className="w-full border-b bg-background sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo.svg" 
            alt="Que Logo" 
            width={87} 
            height={24} 
            className="transition-transform hover:scale-110 text-primary"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link href="/create-room" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span>Create Room</span>
          </Link>
          <Link href="/join-room" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-1.5">
            <LogIn className="h-4 w-4" />
            <span>Join Room</span>
          </Link>
          <Link href="/profile" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!isLoaded ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Youtube className="h-4 w-4 text-red-600" />
                <span>Sign In</span>
              </Button>
            </SignInButton>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
          ref={menuRef}
          className={cn(
            "absolute right-0 top-16 w-full max-w-xs bg-background border-l shadow-xl h-[calc(100vh-4rem)] transition-transform duration-300",
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <nav className="flex flex-col p-4 space-y-2">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/create-room"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <PlusCircle className="h-4 w-4" />
              Create Room
            </Link>
            <Link
              href="/join-room"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Join Room
            </Link>
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

