"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useUser, UserButton, SignInButton } from "@clerk/nextjs"
import { Menu, X, Youtube, Home, PlusCircle, LogIn, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Navigation item type definition
 */
type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

/**
 * Navbar component
 * Renders the top navigation bar of the website
 */
export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Define navigation items
  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    { href: "/create-room", label: "Create Room", icon: <PlusCircle className="h-4 w-4" /> },
    { href: "/join-room", label: "Join Room", icon: <LogIn className="h-4 w-4" /> },
    { href: "/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  ]

  // Close mobile menu when clicking outside
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

  // Prevent scrolling when mobile menu is open
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const closeMenu = () => setIsMenuOpen(false)

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink 
              key={item.href} 
              item={item} 
              isActive={
                item.href === "/" 
                  ? pathname === "/" 
                  : pathname.startsWith(item.href)
              }
            />
          ))}
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
            aria-expanded={isMenuOpen}
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
        onClick={closeMenu}
        aria-hidden="true"
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
            {navItems.map((item) => (
              <MobileNavLink 
                key={item.href} 
                item={item} 
                onClick={closeMenu}
                isActive={
                  item.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </nav>
          
          {/* Quick actions in mobile menu */}
          {isSignedIn && (
            <div className="border-t mt-4 pt-4 px-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline" className="justify-start">
                  <Link href="/create-room">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Room
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="justify-start">
                  <Link href="/join-room">
                    <LogIn className="h-4 w-4 mr-2" />
                    Join Room
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * Desktop navigation link component
 * @param item - Navigation item information
 * @param isActive - Whether the link is active
 */
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link 
      href={item.href} 
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-muted text-foreground/80 hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  )
}

/**
 * Mobile navigation link component
 * @param item - Navigation item information
 * @param onClick - Click event handler
 * @param isActive - Whether the link is active
 */
function MobileNavLink({ item, onClick, isActive }: { item: NavItem; onClick: () => void; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-muted text-foreground/80 hover:text-foreground"
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

