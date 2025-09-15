"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Menu, 
  User, 
  Settings, 
  LogOut,
  MessageSquare 
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { 
    isSidebarCollapsed, 
    setSidebarCollapsed, 
    user, 
    setUser 
  } = useAppStore()
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-16 border-b border-border bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95 px-4 flex items-center justify-between relative z-50"
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white hidden sm:block">
            ChatVideo
          </span>
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
              <span>Welcome back,</span>
              <span className="text-white font-medium">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
        
        {!user && (
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
            onClick={() => router.push("/auth/login")}
          >
            Sign In
          </Button>
        )}
      </div>
    </motion.nav>
  )
}