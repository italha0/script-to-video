import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import Script from "next/script"

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
   
        
      <body className="font-sans antialiased">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2892825507816139"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-5Y77DDK7X4"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5Y77DDK7X4');
          `}
        </Script>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <Analytics/>
        </ThemeProvider>
      </body>
    </html>
  )
}
