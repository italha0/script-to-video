import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ChatVideo - Turn Chat Scripts into Viral Videos",
  description:
    "Create engaging TikTok, Instagram Reels, and YouTube Shorts from chat conversations. No video editing skills required.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
        <Analytics/>
      </body>
    </html>
  )
}
