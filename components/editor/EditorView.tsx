"use client"

import { motion } from "framer-motion"
import { ControlPanel } from "./ControlPanel"
import { PreviewPanel } from "./PreviewPanel"
import { DownloadModal } from "./DownloadModal"
import { useAppStore } from "@/lib/store"

export function EditorView() {
  const { renderProgress } = useAppStore()

  return (
    <div className="h-full flex">
      {/* Control Panel - Left Side */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-96 border-r border-gray-800 bg-gray-950 overflow-y-auto"
      >
        <ControlPanel />
      </motion.div>

      {/* Preview Panel - Right Side */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 flex items-center justify-center bg-gray-900"
      >
        <PreviewPanel />
      </motion.div>

      {/* Download Modal */}
      {renderProgress.isRendering && <DownloadModal />}
    </div>
  )
}