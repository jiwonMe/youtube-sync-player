"use client"

import { Youtube, Heart, Twitter, Github, Mail } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Wave } from "@/components/ui/wave"

/**
 * Footer 섹션 컴포넌트
 * 웹사이트 하단에 표시되는 푸터 영역
 */
export function FooterSection() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const links = [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ]
  
  const socialLinks = [
    { href: "https://twitter.com", label: "Twitter", icon: <Twitter className="h-4 w-4" /> },
    { href: "https://github.com", label: "GitHub", icon: <Github className="h-4 w-4" /> },
    { href: "mailto:info@example.com", label: "Email", icon: <Mail className="h-4 w-4" /> },
  ]
  
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="w-full py-8 bg-background border-t border-red-500/10 relative overflow-hidden">
      {/* Wave animation at the top of the footer */}
      <div className="absolute top-0 left-0 w-full rotate-180" style={{ transform: "rotate(180deg)", marginTop: "-8px" }}>
        <Wave height={8} opacity={3} absolute={false} />
      </div>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
      </div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Youtube className="h-6 w-6 text-red-600 mr-2" />
              <span className="font-medium text-lg">YouTube Sync Player</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Watch YouTube videos together with friends in perfect synchronization, no matter where they are.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((link) => (
                <Link 
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-red-500 transition-colors duration-200"
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="font-medium mb-4 text-sm tracking-wider uppercase">Quick Links</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={cn(
                      "text-sm text-muted-foreground hover:text-red-500 transition-all duration-200 relative group",
                      hoveredLink === link.href && "text-red-500"
                    )}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    <span className="relative">
                      {link.label}
                      <span className={cn(
                        "absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 transition-all duration-300",
                        hoveredLink === link.href && "w-full"
                      )}></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Get started */}
          <div>
            <h3 className="font-medium mb-4 text-sm tracking-wider uppercase">Get Started</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/create-room"
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors duration-200 group flex items-center"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Create a Room
                </Link>
              </li>
              <li>
                <Link 
                  href="/join-room"
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors duration-200 group flex items-center"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Join a Room
                </Link>
              </li>
              <li>
                <Link 
                  href="/features"
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors duration-200 group flex items-center"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  Features
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-red-500/10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Que. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-sm text-muted-foreground flex items-center">
              Made with 
              <Heart className={cn(
                "h-3 w-3 mx-1 text-red-500",
                isMounted && "animate-pulse"
              )} /> 
              by Que Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
} 