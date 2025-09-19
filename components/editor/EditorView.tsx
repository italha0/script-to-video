"use client"

import { motion } from "framer-motion"
import { ControlPanel } from "./ControlPanel"
import { PreviewPanel } from "./PreviewPanel"
import { DownloadModal } from "./DownloadModal"
import { useAppStore } from "@/lib/store"
import { useState } from "react"

export function EditorView() {
  const { renderProgress } = useAppStore()
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="h-full flex flex-col md:flex-row bg-gradient-to-br from-background to-background/95">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="grid grid-cols-2 p-1 m-2 bg-muted/50 rounded-xl">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
              mobileTab === 'edit' 
                ? 'text-foreground bg-background shadow-lg shadow-primary/20 border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => setMobileTab('edit')}
          >
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
              mobileTab === 'preview' 
                ? 'text-foreground bg-background shadow-lg shadow-primary/20 border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => setMobileTab('preview')}
          >
            Preview
          </motion.button>
        </div>
      </div>
      {/* Control Panel - Left Side */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
        className={`w-full md:w-[40rem] md:border-r border-border/50 bg-card/50 backdrop-blur-sm overflow-y-auto md:block ${mobileTab === 'edit' ? 'block' : 'hidden'} md:shadow-xl md:shadow-black/5`}
      >
        <ControlPanel />
      </motion.div>

      {/* Preview Panel - Right Side */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.320, 1] }}
        className={`flex-1 flex items-center justify-center bg-gradient-to-br from-background/50 to-background md:block ${mobileTab === 'preview' ? 'block' : 'hidden'}`}
      >
        <PreviewPanel />
      </motion.div>

      {/* Download Modal */}
      {renderProgress.isRendering && <DownloadModal />}
    </div>
  )
}