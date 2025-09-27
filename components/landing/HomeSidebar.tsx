"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  ChevronRight, 
  Plus, 
  Video, 
  Zap, 
  TrendingUp, 
  Linkedin, 
  Instagram,
  Clock,
  BarChart3
} from "lucide-react"

export function HomeSidebar() {
  const sidebarVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  }

  return (
    <motion.aside 
      className="hidden md:flex w-[280px] shrink-0 flex-col gap-4 border-r border-border/50 bg-card/50 backdrop-blur-sm p-6"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Button 
          className="w-full bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-xl transition-all duration-300" 
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Create New Video
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link href="/editor" className="flex items-center justify-between rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-4 text-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
          <span className="flex items-center gap-3">
            <Video className="w-4 h-4 text-primary" /> 
            Video Editor
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link href="#" className="flex items-center justify-between rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-4 text-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
          <span className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-green-500" /> 
            Analytics
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link href="#" className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-4 text-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
          <Linkedin className="w-4 h-4 text-blue-600" /> 
          Connect LinkedIn
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link href="https://www.instagram.com/italha.0/" target="_blank" className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-4 text-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
          <Instagram className="w-4 h-4 text-pink-500" /> 
          Connect Instagram
        </Link>
      </motion.div>

      <motion.div className="mt-auto space-y-4" variants={itemVariants}>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> 
            <span className="font-medium">0 credits</span>
          </span>
          <Link href="#" className="text-primary hover:text-primary-hover font-medium transition-colors">
            Upgrade
          </Link>
        </div>

        <motion.div 
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="text-lg font-bold text-foreground">Unlock Pro Features</div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            AI-powered editing, unlimited exports, and advanced analytics
          </p>
          <Button className="mt-4 w-full bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-xl transition-all duration-300">
            Upgrade Now
          </Button>
        </motion.div>
      </motion.div>
    </motion.aside>
  )
}
