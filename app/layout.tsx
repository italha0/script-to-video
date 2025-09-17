import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ChatVideo - Turn Chat Scripts into Viral Videos", icons: {
    icon: '/favicon.png',   // points to /public/favicon.ico
  },
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
    <html lang="en" suppressHydrationWarning>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2892825507816139" crossorigin="anonymous"></script>
        
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <Analytics/>
        </ThemeProvider>
      </body>
    </html>
  )
}
