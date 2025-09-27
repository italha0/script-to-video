"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { 
  Menu, 
  User, 
  Settings, 
  LogOut,
  MessageSquare 
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/appwrite/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { 
    isSidebarCollapsed, 
    setSidebarCollapsed, 
    user, 
    setUser 
  } = useAppStore()
  
  const router = useRouter()
  const { account } = createClient()

  const handleSignOut = async () => {
    try {
      await account.deleteSession("current")
      setUser(null)
      router.push("/")
    } catch (e) {
      // Optionally show error toast
      setUser(null)
      router.push("/")
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-16 border-b border-border/30 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 px-6 flex items-center justify-between relative z-50 shadow-sm"
    >
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 md:hidden rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">MockVideo</span>
              <span className="text-xs text-muted-foreground ml-2">AI</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-muted-foreground">Welcome back,</span>
                <span className="text-foreground font-semibold">
                  {user.name || user.email?.split("@")[0] || "User"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground hover:bg-red-50 hover:text-red-600 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </>
        )}
        
        {!user && (
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground rounded-xl"
                onClick={() => router.push("/auth/login")}
              >
                Sign In
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => router.push("/auth/signup")}
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}