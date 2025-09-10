"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { MessageSquare, MessageCircleMore, Video, CalendarClock, Bookmark, Type, Layers, LogOut } from "lucide-react"

interface ToolDef {
  id: string
  title: string
  description: string
  icon: any
  href: string
  colorClass: string
  special?: boolean
  previewImg?: string
}
// Single tool only (updated preview image path). Place your screenshot at /public/screenshots/fake-text-preview.png
const TOOLS: ToolDef[] = [
  { id: "fake-text", title: "Fake Text Messages", description: "Use AI Text to Speech to bring text messages to life", icon: MessageCircleMore, href: "/editor", colorClass: "bg-gradient-to-r from-[#c8c9ff] to-[#9fa2ff]", special: true, previewImg: "/fake-text-preview.png" }
]

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Creator"
  
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col min-w-[16rem] md:max-w-[300px] shrink-0 border-r border-border/60 bg-background-light/40 backdrop-blur p-4 gap-4">
        <div className="flex items-center gap-2 px-1 pb-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_14px_-4px_rgba(138,43,226,0.6)]">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">ClipGOAT</span>
        </div>
        <Button className="w-full text-sm font-medium shadow-none" size="sm">
          + Create new
        </Button>
        <Link href="/editor" className="group block rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-medium hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(138,43,226,0.4)] transition-colors">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            <span>Content Publisher</span>
          </div>
        </Link>
        <div className="rounded-xl p-4 bg-gradient-to-br from-pink-50 to-purple-50 border border-primary/20 flex flex-col gap-3">
          <div className="text-sm font-semibold text-foreground">Get more credits</div>
          <p className="text-xs leading-relaxed text-foreground-muted">Get access to all features on ClipGOAT and create more viral clips</p>
          <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-none">Upgrade Now</Button>
        </div>
        <Link href="#" className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-medium hover:border-primary/50">
          Affiliate Program
        </Link>
        <Link href="#" className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-medium hover:border-primary/50">
          Join our Discord
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="text-[10px] px-2 py-1 rounded-md bg-background/60 border border-border/60 text-foreground-muted">0 credits</div>
          <Button size="sm" variant="outline" className="text-xs h-7 px-3" onClick={()=>supabase.auth.signOut()}>
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sign out
          </Button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 min-w-0 px-4 md:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Hello, <span className="bg-gradient-to-r from-primary via-primary-hover to-primary/80 bg-clip-text text-transparent">{name}</span>
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">What are you creating today?</p>
          </header>
          <div className="grid lg:grid-cols-2 gap-6">
            {TOOLS.map(tool => tool.special ? (
              <Link key={tool.id} href={tool.href} className={`group relative overflow-hidden rounded-2xl p-5 md:p-6 flex items-stretch gap-4 ${tool.colorClass} text-[#0d0d0d] shadow-[0_4px_18px_-6px_rgba(0,0,0,0.25)] transition-transform hover:scale-[1.01]`}> 
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <tool.icon className="w-5 h-5 text-[#4b14b4]" />
                    <span className="text-xs font-semibold tracking-wide px-2 py-0.5 rounded-md bg-white/40 backdrop-blur-sm text-[#2b2b2b]">AI</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2">{tool.title}</h2>
                  <p className="text-sm md:text-base leading-relaxed font-medium text-[#143241]/80 max-w-md">{tool.description}</p>
                </div>
                {tool.previewImg && (
                  <div className="w-32 md:w-40 h-[130px] max-w-[80px] rounded-xl overflow-hidden ring-4 ring-white/30 shadow-lg self-center bg-white/60 flex items-center justify-center">
                    <img src={tool.previewImg} alt="tool preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </Link>
            ) : (
              <Link key={tool.id} href={tool.href} className={`group relative rounded-2xl p-5 flex items-center gap-5 ${tool.colorClass} text-[#0e0e0e] shadow-[0_4px_16px_-6px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_22px_-6px_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.01]`}> 
                <div className="flex-1 min-w-0">
                  <tool.icon className="w-5 h-5 mb-2 text-[#4b14b4]" />
                  <h2 className="text-lg md:text-xl font-semibold mb-1 truncate">{tool.title}</h2>
                  <p className="text-sm font-medium leading-snug text-[#272727]/80 line-clamp-2">{tool.description}</p>
                </div>
                {tool.previewImg && (
                  <div className="hidden sm:block w-24 aspect-[9/16] rounded-lg overflow-hidden ring-2 ring-white/30 shadow bg-white/60">
                    <img src={tool.previewImg} alt="preview" className="h-full w-full object-cover" />
                  </div>
                  )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
