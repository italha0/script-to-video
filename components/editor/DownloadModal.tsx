"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Download, AlertCircle, Loader2 } from "lucide-react"
import { useAppStore } from "@/lib/store"

export function DownloadModal() {
  const { renderProgress, resetRender } = useAppStore()
  const { isRendering, status, progress, downloadUrl, error } = renderProgress

  const createAndClickDownload = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => a.remove(), 0)
  }

  const handleDownload = async () => {
    if (!downloadUrl) return
    try {
      const u = new URL(downloadUrl)
      const isAzure = u.hostname.endsWith('.blob.core.windows.net')
      if (isAzure) {
        const pathParts = u.pathname.split('/').filter(Boolean)
        if (pathParts.length >= 2 && pathParts[0] === 'videos') {
          const blobName = decodeURIComponent(pathParts.slice(1).join('/'))
          // Prefer proxy streaming endpoint to hide storage host and force download
          const proxyUrl = `/api/download?blobName=${encodeURIComponent(blobName)}&filename=${encodeURIComponent('chat-video.mp4')}`
          createAndClickDownload(proxyUrl, 'chat-video.mp4')
          return
        }
      }
      // Fallback to original URL if not Azure or re-sign failed
      createAndClickDownload(downloadUrl, 'chat-video.mp4')
    } catch {
      // Any parsing/fetch issues -> fallback
      createAndClickDownload(downloadUrl, 'chat-video.mp4')
    }
  }

  const handleClose = () => {
    // Only allow closing when done or error, not during rendering
    if (status === 'done' || status === 'error') {
      resetRender()
    }
  }

  const canClose = status === 'done' || status === 'error'

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'rendering':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      case 'done':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Starting render...'
      case 'rendering':
        return 'Creating your video...'
      case 'done':
        return 'Video is ready!'
      case 'error':
        return error || 'Something went wrong'
      default:
        return 'Processing...'
    }
  }

  const getProgressValue = () => {
    switch (status) {
      case 'pending':
        return 10
      case 'rendering':
        return Math.max(20, Math.min(90, progress))
      case 'done':
        return 100
      case 'error':
        return 0
      default:
        return 0
    }
  }

  return (
    <Dialog open={isRendering} onOpenChange={canClose ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {status === 'done' ? 'Download Ready' : 'Generating Video'}
          </DialogTitle>
        </DialogHeader>
        
        <motion.div 
          className="flex flex-col items-center space-y-6 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Status Icon */}
          <motion.div
            key={status}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {getStatusIcon()}
          </motion.div>

          {/* Status Message */}
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-lg font-medium">
              {getStatusMessage()}
            </p>
            
            {status !== 'error' && status !== 'done' && (
              <p className="text-sm text-muted-foreground">
                This usually takes 30-60 seconds
              </p>
            )}
          </motion.div>

          {/* Progress Bar */}
          <AnimatePresence>
            {status !== 'done' && status !== 'error' && (
              <motion.div 
                className="w-full space-y-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Progress 
                  value={getProgressValue()} 
                  className="w-full h-2 bg-muted"
                />
                <p className="text-center text-xs text-muted-foreground">
                  {getProgressValue()}% complete
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-3 pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {status === 'done' && (
              <Button
                onClick={handleDownload}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            )}
            
            {status === 'error' && (
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              >
                Try Again
              </Button>
            )}
            
            {/* Only show close/cancel button when appropriate */}
            {canClose && (
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              >
                {status === 'done' ? 'Close' : 'Cancel'}
              </Button>
            )}
            
            {/* Show a disabled button during rendering to indicate process is ongoing */}
            {!canClose && (
              <Button
                disabled
                variant="outline"
                className="border-border text-muted-foreground cursor-not-allowed opacity-50"
              >
                Processing...
              </Button>
            )}
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}