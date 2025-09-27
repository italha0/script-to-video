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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">      
              <HomeCard
                title="Fake Text Messages"
                description="Use AI Text to Speech to bring text messages to life"
                href="/editor"
                gradient="bg-gradient-to-r from-cyan-200 to-cyan-300/70"
                icon={<MessageSquare className="w-4 h-4" />}
                imageSrc="/text.jpg"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
