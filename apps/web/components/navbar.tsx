"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser, UserButton, SignInButton } from "@clerk/nextjs"
import { Menu, X, Youtube } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Image src="/logo.svg" alt="Que Logo" width={32} height={32} />
          <span className="hidden sm:inline-block">Que</span>
        </Link>

        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
            Home
          </Link>
          <Link href="/create-room" className="text-sm font-medium hover:underline underline-offset-4">
            Create Room
          </Link>
          <Link href="/join-room" className="text-sm font-medium hover:underline underline-offset-4">
            Join Room
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:underline underline-offset-4">
            Profile
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!isLoaded ? (
            <Button variant="outline" size="sm" disabled>
              <span className="animate-pulse">Loading...</span>
            </Button>
          ) : isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                <Youtube className="mr-2 h-4 w-4 text-red-600" />
                Sign In
              </Button>
            </SignInButton>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t p-4">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-sm font-medium hover:underline underline-offset-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/create-room"
              className="text-sm font-medium hover:underline underline-offset-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Room
            </Link>
            <Link
              href="/join-room"
              className="text-sm font-medium hover:underline underline-offset-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Join Room
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium hover:underline underline-offset-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

