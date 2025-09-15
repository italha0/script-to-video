"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"

export function RendersView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full p-8 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Renders</h1>
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No renders yet</h2>
          <p className="text-gray-400">
            Your completed video renders will be listed here for easy access.
          </p>
        </div>
      </div>
    </motion.div>
  )
}