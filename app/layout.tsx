import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import Script from "next/script"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// --- NEW SEO-OPTIMIZED METADATA ---
export const metadata: Metadata = {
  // Core Metadata
  title: "ChatVideo | Turn Text & iMessage Chats into Viral Videos",
  description: "Instantly create viral videos from fake iMessage chats and text scripts. Perfect for TikTok, Reels, & Shorts. No editing skills needed. Try our chat video maker now!",
  keywords: [
    "chat video maker",
    "fake iMessage chat video",
    "texting story video creator",
    "iMessage story generator",
    "text to video for TikTok",
    "viral chat reels",
    "chat script to video",
    "social media video maker",
  ],

  // Technical SEO
  metadataBase: new URL("https://your-domain.com"), // IMPORTANT: Change to your domain
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons (ensure these files are in your /public folder)
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',

  // Social Media (Open Graph & Twitter Cards)
  openGraph: {
    title: "ChatVideo: Turn Text Scripts into Viral Videos",
    description: "Go viral on TikTok, Reels, & Shorts by turning chat conversations into engaging videos. Fast, easy, and no editing required.",
    url: "https://your-domain.com", // IMPORTANT: Change to your domain
    siteName: "ChatVideo",
    images: [
      {
        url: "/og-image.png", // In /public (1200x630px)
        width: 1200,
        height: 630,
        alt: "ChatVideo app interface showing a chat being converted to a video.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatVideo: Turn Text Scripts into Viral Videos",
    description: "Go viral on TikTok, Reels, & Shorts by turning chat conversations into engaging videos. Fast, easy, and no editing required.",
    images: ["/twitter-image.png"], // In /public (1200x630px)
  },

  // Optional but Recommended
  applicationName: "ChatVideo",
  referrer: 'origin-when-cross-origin',
  authors: [{ name: "Your Name or Company", url: "https://your-domain.com" }], // IMPORTANT: Change this
  creator: 'Your Name or Company', // IMPORTANT: Change this
  publisher: 'Your Name or Company', // IMPORTANT: Change this
};

// --- Web Application Structured Data (JSON-LD) ---
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ChatVideo',
  description: 'Instantly create viral videos from fake iMessage chats and text scripts for TikTok, Reels, & Shorts.',
  url: 'https://your-domain.com', // IMPORTANT: Change this
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Windows, macOS, Linux, Android, iOS',
  browserRequirements: 'Requires HTML5 support. Modern browser recommended.',
  offers: {
    '@type': 'Offer',
    price: '0', // Or your starting price if not free
    priceCurrency: 'USD',
  },
  // Optional: Add this once you have reviews
  // aggregateRating: {
  //   '@type': 'AggregateRating',
  //   ratingValue: '4.8',
  //   reviewCount: '150',
  // },
  creator: {
    '@type': 'Organization',
    name: 'Your Company Name', // IMPORTANT: Change this
    url: 'https://your-domain.com', // IMPORTANT: Change this
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">

        {/* --- NEW: Structured Data Script --- */}
        <Script
          id="app-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google AdSense */}
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

        {/* Your App Components */}
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}