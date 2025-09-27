import Link from "next/link";
import Image from "next/image";
import { type Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { HomeSidebar } from "@/components/landing/HomeSidebar";
import { HomeCard } from "@/components/landing/HomeCard";
import { MessageSquare, Bookmark, Quote, Calendar, Mic2, PanelRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Creator Dashboard | Script to Video",
  description: "Your central hub for creating and managing AI-generated videos. Start a new project, view your renders, and access all tools.",
};
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <HomeSidebar />
        <main className="flex-1 overflow-auto pb-24 md:pb-8">
          <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-6 md:py-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-3xl md:text-5xl font-bold">Hello, <span className="text-primary">Creator</span></h2>
              <p className="text-muted-foreground mt-2">What are you creating today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">      
              <HomeCard
                title="AI Video Creation"
                description="Transform text conversations into viral videos with AI-powered automation - just like Opus.pro but for chat messages"
                href="/editor"
                gradient="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                icon={<MessageSquare className="w-5 h-5" />}
                imageSrc="/text.jpg"
              />
              
              {/* Future card placeholders for additional features */}
              <div className="opacity-60 cursor-not-allowed">
                <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-slate-50 to-gray-50 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="rounded-2xl bg-white/90 p-3 text-muted-foreground shadow-lg">
                      <Quote className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-muted-foreground mb-2">
                        AI Highlights
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground/70 leading-relaxed">
                        Coming soon: Extract the best moments from long videos automatically
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-muted-foreground font-medium">
                        <span className="text-sm">Coming soon</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
