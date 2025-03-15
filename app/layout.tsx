import type React from "react"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { CLERK_PUBLISHABLE_KEY } from "@/lib/env"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "YouTube Sync Player",
  description: "Watch YouTube videos together with friends in sync",
  generator: 'v0.dev'
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
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}