"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useUser, UserButton, SignInButton } from "@clerk/nextjs"
import { Menu, X, Youtube, Home, PlusCircle, LogIn, User, ChevronRight } from "lucide-react"

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
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
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

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className={cn(
      "w-full border-b sticky top-0 z-50 transition-all duration-500",
      isScrolled 
        ? "bg-background/95 backdrop-blur-sm border-red-500/10 shadow-md shadow-red-500/5" 
        : "bg-background border-red-500/5"
    )}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center group">
          <div className="flex items-center gap-2 relative">
            <Youtube className="h-6 w-6 text-red-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <span className="font-semibold text-lg relative">
              YouTube 
              <span className="text-red-600 transition-colors duration-300 group-hover:text-red-500">Sync</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent group-hover:w-full transition-all duration-300"></span>
            </span>
          </div>
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
              isHovered={hoveredItem === item.href}
              onHover={() => setHoveredItem(item.href)}
              onLeave={() => setHoveredItem(null)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isLoaded ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isSignedIn ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full opacity-0 group-hover:opacity-70 blur transition duration-300 group-hover:duration-200"></div>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <SignInButton mode="modal">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-red-500/20 hover:bg-red-500/5 shadow-sm shadow-red-500/10 transition-all duration-300 hover:shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 overflow-hidden group"
              >
                <Youtube className="h-4 w-4 text-red-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                <span className="relative">
                  Sign In
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Button>
            </SignInButton>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:bg-red-500/5 transition-transform duration-300 hover:rotate-3" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 animate-in zoom-in-50 duration-300" />
            ) : (
              <Menu className="h-5 w-5 animate-in zoom-in-50 duration-300" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-all duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
        aria-hidden="true"
      >
        <div 
          ref={menuRef}
          className={cn(
            "absolute right-0 top-16 w-full max-w-xs bg-background border-l border-red-500/10 shadow-xl h-[calc(100vh-4rem)] transition-all duration-500",
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradient elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 -z-10 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 -z-10 animate-pulse" style={{ animationDelay: "1s" }}></div>
          
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item, index) => (
              <MobileNavLink 
                key={item.href} 
                item={item} 
                onClick={closeMenu}
                isActive={
                  item.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.href)
                }
                animationDelay={index * 100}
              />
            ))}
          </nav>
          
          {/* Quick actions in mobile menu */}
          <div className="border-t border-red-500/10 mt-4 pt-4 px-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 animate-in fade-in-50 duration-300" style={{ animationDelay: "400ms" }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                asChild 
                size="sm" 
                variant="outline" 
                className="justify-start border-red-500/20 hover:bg-red-500/5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-red-500/10 hover:-translate-y-0.5 animate-in fade-in-50 slide-in-from-left-5 duration-300" 
                style={{ animationDelay: "500ms" }}
              >
                <Link href="/create-room">
                  <PlusCircle className="h-4 w-4 mr-2 text-red-500 group-hover:animate-spin" />
                  <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                    New Room
                  </span>
                </Link>
              </Button>
              <Button 
                asChild 
                size="sm" 
                variant="outline" 
                className="justify-start border-red-500/20 hover:bg-red-500/5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-red-500/10 hover:-translate-y-0.5 animate-in fade-in-50 slide-in-from-right-5 duration-300" 
                style={{ animationDelay: "600ms" }}
              >
                <Link href="/join-room">
                  <LogIn className="h-4 w-4 mr-2 text-red-500" />
                  <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                    Join Room
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Desktop navigation link component
 * @param item - Navigation item information
 * @param isActive - Whether the link is active
 * @param isHovered - Whether the link is being hovered
 * @param onHover - Function to call when hovering starts
 * @param onLeave - Function to call when hovering ends
 */
function NavLink({ 
  item, 
  isActive, 
  isHovered, 
  onHover, 
  onLeave 
}: { 
  item: NavItem; 
  isActive: boolean; 
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <Link 
      href={item.href} 
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-1.5 relative group",
        isActive 
          ? "bg-red-500/10 text-red-600 shadow-sm shadow-red-500/10" 
          : "hover:bg-red-500/5 text-foreground/80 hover:text-red-600"
      )}
      aria-current={isActive ? "page" : undefined}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span className={cn(
        "transition-transform duration-300",
        (isHovered || isActive) && "scale-110"
      )}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></span>
      )}
      {!isActive && (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent group-hover:w-full transition-all duration-300"></span>
      )}
    </Link>
  )
}

/**
 * Mobile navigation link component
 * @param item - Navigation item information
 * @param onClick - Click event handler
 * @param isActive - Whether the link is active
 * @param animationDelay - Delay for entrance animation
 */
function MobileNavLink({ 
  item, 
  onClick, 
  isActive,
  animationDelay = 0
}: { 
  item: NavItem; 
  onClick: () => void; 
  isActive: boolean;
  animationDelay?: number;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 group relative overflow-hidden animate-in fade-in-50 slide-in-from-right-5",
        isActive 
          ? "bg-red-500/10 text-red-600 shadow-sm shadow-red-500/10" 
          : "hover:bg-red-500/5 text-foreground/80 hover:text-red-600 hover:translate-x-1"
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <span className={cn(
        "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
        isActive && "text-red-600"
      )}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <ChevronRight className="h-4 w-4 ml-auto text-red-500 animate-bounce-x" />
      )}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></span>
      )}
      {!isActive && (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent group-hover:w-full transition-all duration-300"></span>
      )}
    </Link>
  )
}

// 애니메이션 효과를 위한 CSS 추가
// tailwind.config.js에 다음 내용 추가 필요:
// animation: {
//   "bounce-x": "bounce-x 1s infinite",
//   pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
// },
// keyframes: {
//   "bounce-x": {
//     "0%, 100%": {
//       transform: "translateX(0)",
//       "animation-timing-function": "cubic-bezier(0.8, 0, 1, 1)",
//     },
//     "50%": {
//       transform: "translateX(25%)",
//       "animation-timing-function": "cubic-bezier(0, 0, 0.2, 1)",
//     },
//   },
// },

