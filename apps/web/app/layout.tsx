import type React from "react"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CLERK_PUBLISHABLE_KEY } from "@/lib/env"
import "./globals.css"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "rtB Sync",
  description: "Watch videos together with friends in sync",
  generator: 'v0.dev',
  openGraph: {
    title: "rtB Sync",
    description: "Watch videos together with friends in sync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "rtB Sync - YouTube Sync Player"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "rtB Sync",
    description: "Watch videos together with friends in sync",
    images: ["/og-image.png"]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider defaultTheme="system">
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <ClientFooter />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

// Client component에서 경로 기반 조건부 렌더링
"use client"

function ClientFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith("/room")) {
    return null
  }
  return <Footer />
}