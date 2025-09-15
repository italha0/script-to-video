"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Video, 
  FolderOpen, 
  Settings, 
  Plus,
  Zap,
  Star
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const navItems = [
  { id: 'editor', label: 'Editor', icon: Video },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'renders', label: 'Renders', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export function Sidebar() {
  const { 
    isSidebarCollapsed, 
    activeTab, 
    setActiveTab 
  } = useAppStore()

  const sidebarVariants = {
    expanded: { width: 280, opacity: 1 },
    collapsed: { width: 0, opacity: 0 }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isSidebarCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col bg-gray-950 border-r border-gray-800 overflow-hidden relative"
      >
        <div className="p-6 space-y-6 h-full flex flex-col">
          {/* Create New Button */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              size="lg"
              onClick={() => setActiveTab('editor')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </motion.div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 transition-colors",
                    activeTab === item.id && "bg-gray-800 text-white"
                  )}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </motion.div>
            ))}
          </nav>

          {/* Upgrade Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-700/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Go Pro</span>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              Unlock unlimited renders and premium features
            </p>
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:from-yellow-500 hover:to-orange-500 font-medium"
            >
              Upgrade Now
            </Button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 p-4"
      >
        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              className={cn(
                "text-gray-400 hover:text-white",
                activeTab === item.id && "text-white bg-gray-800"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </motion.div>
    </>
  )
}