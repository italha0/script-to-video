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
    <div className="h-full flex flex-col md:flex-row">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden sticky top-0 z-10 bg-background border-b border-border">
        <div className="grid grid-cols-2">
          <button
            className={`py-3 text-sm font-medium ${mobileTab === 'edit' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setMobileTab('edit')}
          >
            Edit
          </button>
          <button
            className={`py-3 text-sm font-medium ${mobileTab === 'preview' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setMobileTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>
      {/* Control Panel - Left Side */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full md:w-[35rem] md:border-r border-border bg-card overflow-y-auto md:block ${mobileTab === 'edit' ? 'block' : 'hidden'}`}
      >
        <ControlPanel />
      </motion.div>

      {/* Preview Panel - Right Side */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`flex-1 flex items-center justify-center bg-background md:block ${mobileTab === 'preview' ? 'block' : 'hidden'}`}
      >
        <PreviewPanel />
      </motion.div>

      {/* Download Modal */}
      {renderProgress.isRendering && <DownloadModal />}
    </div>
  )
}