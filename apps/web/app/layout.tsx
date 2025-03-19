import type React from "react"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CLERK_PUBLISHABLE_KEY } from "@/lib/env"
import { AnalyticsProvider } from "@/lib/analytics-context"
import "./globals.css"
import { SupabaseProvider } from "./supabase-provider"
import { ClientFooter } from "../components/client-footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Youtube Sync Player",
  description: "Watch videos together with friends in sync",
  generator: 'v0.dev',
  openGraph: {
    title: "Youtube Sync Player",
    description: "Watch videos together with friends in sync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Youtube Sync  - YouTube Sync Player"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Youtube Sync Player ",
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
            <AnalyticsProvider>
              <SupabaseProvider>
                <Navbar />
                <main className="min-h-[calc(100vh-4rem)]">{children}</main>
                <ClientFooter />
              </SupabaseProvider>
            </AnalyticsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}