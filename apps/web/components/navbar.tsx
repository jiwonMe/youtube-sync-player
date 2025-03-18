"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useUser, UserButton, SignInButton } from "@clerk/nextjs"
import { Menu, X, Youtube, Home, PlusCircle, LogIn, User, ChevronRight } from "lucide-react"
import { useTrackEvent } from "@/hooks/use-track-event"
import { Events } from "@/lib/mixpanel"

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
  
  // Mixpanel 이벤트 추적 초기화
  const analytics = useTrackEvent('Navbar')

  // Define navigation items
  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    { href: "/create-room", label: "Create Room", icon: <PlusCircle className="h-4 w-4" /> },
    { href: "/rooms", label: "Browse Rooms", icon: <Youtube className="h-4 w-4" /> },
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
      // 메뉴 열림 이벤트 추적
      analytics.trackFeatureUsed('mobile_menu_opened')
    } else {
      document.body.style.overflow = 'auto'
      // 메뉴 닫힘 이벤트 추적 (초기 렌더링 제외)
      if (isLoaded) {
        analytics.trackFeatureUsed('mobile_menu_closed')
      }
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMenuOpen, isLoaded, analytics])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const wasScrolled = isScrolled
      const newScrolled = window.scrollY > 10
      setIsScrolled(newScrolled)
      
      // 스크롤 상태 변경 시 이벤트 추적 (스크롤 시작/종료)
      if (wasScrolled !== newScrolled) {
        analytics.trackFeatureUsed(newScrolled ? 'header_scrolled' : 'header_at_top')
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isScrolled, analytics])

  const closeMenu = () => setIsMenuOpen(false)
  
  // 네비게이션 링크 클릭 추적 함수
  const trackNavClick = (label: string) => {
    analytics.trackButtonClick(`nav_${label.toLowerCase().replace(/\s+/g, '_')}`, { 
      current_path: pathname
    })
  }
  
  // 로고 클릭 추적 함수
  const trackLogoClick = () => {
    analytics.trackButtonClick('logo', {
      current_path: pathname
    })
  }

  return (
    <header className={cn(
      "w-full border-b sticky top-0 z-50 transition-all duration-500",
      isScrolled 
        ? "bg-background/95 backdrop-blur-sm border-red-500/10 shadow-md shadow-red-500/5" 
        : "bg-background border-red-500/5"
    )}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center group" onClick={trackLogoClick}>
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
              onClick={() => trackNavClick(item.label)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isLoaded ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isSignedIn ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full opacity-0 group-hover:opacity-70 blur transition duration-300 group-hover:duration-200"></div>
              <UserButton 
                afterSignOutUrl="/" 
                userProfileMode="navigation"
                userProfileUrl="/profile"
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: '32px',
                      height: '32px'
                    }
                  }
                }}
              />
            </div>
          ) : (
            <SignInButton mode="modal">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-red-500/20 hover:bg-red-500/5 shadow-sm shadow-red-500/10 transition-all duration-300 hover:shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 overflow-hidden group"
                onClick={() => analytics.track(Events.BUTTON_CLICKED, { buttonName: 'sign_in' })}
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
            onClick={() => {
              setIsMenuOpen(!isMenuOpen)
              analytics.trackButtonClick('mobile_menu_toggle', { action: isMenuOpen ? 'close' : 'open' })
            }}
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
                onClick={() => {
                  closeMenu() 
                  trackNavClick(`mobile_${item.label}`)
                }}
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
                onClick={() => analytics.trackButtonClick('quick_action_new_room')}
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
                onClick={() => analytics.trackButtonClick('quick_action_join_room')}
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
 * @param onClick - Function to call when link is clicked
 */
function NavLink({ 
  item, 
  isActive, 
  isHovered, 
  onHover, 
  onLeave,
  onClick
}: { 
  item: NavItem; 
  isActive: boolean; 
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative px-3 py-1.5 text-sm font-medium transition-all duration-300 rounded-md",
        isActive
          ? "text-foreground bg-muted hover:bg-muted"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {item.icon}
        <span>{item.label}</span>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <span 
          className={cn(
            "absolute inset-x-2 -bottom-[1px] h-[2px] bg-red-500 rounded-full transform transition-transform duration-300",
            isHovered ? "scale-x-110" : "scale-x-100"
          )}
        />
      )}
    </Link>
  )
}

/**
 * Mobile navigation link component
 * @param item - Navigation item information
 * @param onClick - Function to call when link is clicked
 * @param isActive - Whether the link is active
 * @param animationDelay - Delay for appearance animation
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
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 px-2 animate-in fade-in-50 slide-in-from-right-5 duration-300 border border-transparent",
        isActive ? 
          "bg-muted border-red-500/20" : 
          "hover:bg-muted/50"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <Link href={item.href} onClick={onClick} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md",
            isActive ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300" : "bg-muted"
          )}>
            {item.icon}
          </div>
          <span className={cn(
            "font-medium",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>{item.label}</span>
        </div>
        {isActive && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
      </Link>
    </Button>
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

