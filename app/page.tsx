import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, MessageSquare, Video, Zap, Star, Users, Download } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              ChatVideo
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
            >
              Pricing
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 bg-transparent"
              asChild
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/auth/signup">Start Creating</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="container mx-auto text-center max-w-4xl relative">
          <Badge
            variant="secondary"
            className="mb-4 animate-pulse bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-all duration-300"
          >
            <Zap className="w-3 h-3 mr-1" />
            Now in Beta
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Turn Chat Scripts into
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text"> Viral Videos</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Create engaging TikTok, Instagram Reels, and YouTube Shorts from chat conversations. No video editing skills
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
            <Button
              size="lg"
              className="text-lg px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/auth/signup">
                <Play className="w-5 h-5 mr-2" />
                Start Creating Free
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 bg-transparent hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 hover:scale-105"
            >
              <Video className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Demo Preview */}
          <div className="relative max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-border/50 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
              <div className="bg-background rounded-xl p-4 space-y-3 shadow-inner">
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-xs animate-in slide-in-from-left-4 duration-500 delay-800">
                    <p className="text-sm text-foreground">Hey, did you see the new iPhone?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl rounded-br-md px-4 py-2 max-w-xs animate-in slide-in-from-right-4 duration-500 delay-1000">
                    <p className="text-sm text-white">Yeah! The camera is insane 📸</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-xs animate-in slide-in-from-left-4 duration-500 delay-1200">
                    <p className="text-sm text-foreground">I'm definitely upgrading</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105">
                  <Video className="w-4 h-4 mr-2" />
                  Generate Video
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-br from-muted/20 via-transparent to-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Everything you need to create viral content
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              From script to video in minutes. Our tool handles the technical stuff so you can focus on creativity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Chat-Style Editor",
                description: "Familiar messaging interface with multiple characters and real-time preview",
              },
              {
                icon: Video,
                title: "9:16 Video Export",
                description: "Perfect vertical format for TikTok, Instagram Reels, and YouTube Shorts",
              },
              {
                icon: Zap,
                title: "One-Click Generation",
                description: "Generate professional videos instantly with our advanced rendering engine",
              },
              {
                icon: Star,
                title: "Custom Themes",
                description: "Choose from iMessage, WhatsApp, Telegram styles or create your own",
              },
              {
                icon: Users,
                title: "Multiple Characters",
                description: "Add unlimited characters with custom names and profile pictures",
              },
              {
                icon: Download,
                title: "HD Export",
                description: "Export in 720p free or upgrade to 1080p for crystal clear quality",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:scale-105 border-border/50 bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <feature.icon className="w-10 h-10 text-primary mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <CardTitle className="group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="container mx-auto text-center max-w-3xl relative">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Ready to create your first viral video?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Join thousands of creators who are already using ChatVideo to grow their audience.
          </p>
          <Button
            size="lg"
            className="text-lg px-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400"
            asChild
          >
            <Link href="/auth/signup">
              <Play className="w-5 h-5 mr-2" />
              Start Creating Now
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600">
            Free to start • No credit card required • Watermarked exports
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0 group">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded flex items-center justify-center shadow-md group-hover:shadow-primary/25 transition-all duration-300">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">ChatVideo</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-all duration-300 hover:scale-105">
                Privacy
              </Link>
              <Link href="#" className="hover:text-primary transition-all duration-300 hover:scale-105">
                Terms
              </Link>
              <Link href="#" className="hover:text-primary transition-all duration-300 hover:scale-105">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2024 ChatVideo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
