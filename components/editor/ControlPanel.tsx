"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Download, Sparkles } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef } from "react"

const themes = [
  { id: 'imessage', name: 'iMessage', color: 'bg-blue-500', accent: 'border-blue-500' },
  { id: 'whatsapp', name: 'WhatsApp', color: 'bg-green-500', accent: 'border-green-500' },
  { id: 'snapchat', name: 'Snapchat', color: 'bg-yellow-400', accent: 'border-yellow-400' }
] as const

export function ControlPanel() {
  const {
    contactName,
    setContactName,
    selectedTheme,
    setSelectedTheme,
    messages,
    addMessage,
    updateMessage,
    toggleMessageSpeaker,
    deleteMessage,
    setRenderProgress,
    resetRender
  } = useAppStore()
  
  const { toast } = useToast()
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [])

  const handleRender = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "Add some messages first!",
        variant: "destructive"
      })
      return
    }

    setRenderProgress({
      isRendering: true,
      status: 'pending',
      progress: 0
    })

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: [
            { id: "them", name: contactName, color: "bg-blue-500" },
            { id: "you", name: "You", color: "bg-green-500" },
          ],
          messages,
          theme: selectedTheme,
          contactName,
          isPro: false
        }),
      })

      if (response.status === 202) {
        const { jobId, statusUrl } = await response.json()
        setRenderProgress({ jobId, status: 'rendering' })
        
        // Start polling for status
        pollRenderStatus(jobId)
      } else if (response.ok) {
        // Direct download
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-video-${Date.now()}.mp4`
        a.click()
        URL.revokeObjectURL(url)
        resetRender()
      }
    } catch (error) {
      console.error('Render error:', error)
      setRenderProgress({
        status: 'error',
        error: 'Failed to start render'
      })
    }
  }

  const pollRenderStatus = async (jobId: string) => {
    const poll = async () => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return
      }

      try {
        const response = await fetch(`/api/render/${jobId}/status`)
        if (response.ok) {
          const { status, url, error } = await response.json()
          
          // Check again if component is still mounted before updating state
          if (!isMountedRef.current) {
            return
          }
          
          if (status === 'done' && url) {
            setRenderProgress({ status: 'done', downloadUrl: url })
            return
          }
          
          if (status === 'error') {
            setRenderProgress({ status: 'error', error })
            return
          }
          
          // Continue polling only if component is still mounted
          if (isMountedRef.current) {
            pollTimeoutRef.current = setTimeout(poll, 2000)
          }
        }
      } catch (error) {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setRenderProgress({ 
            status: 'error', 
            error: 'Failed to check render status' 
          })
        }
      }
    }
    
    poll()
  }

  return (
    <div className="p-6 space-y-6 h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">Create Video</h1>
        <p className="text-gray-400 text-sm">
          Design your chat conversation and generate a viral video
        </p>
      </motion.div>

      {/* Contact Name */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Label className="text-sm font-semibold text-gray-300">Contact Name</Label>
        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
            {contactName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "C"}
          </div>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-white"
            placeholder="Enter contact name"
          />
        </div>
      </motion.div>

      {/* Theme Selection */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <Label className="text-sm font-semibold text-gray-300">Chat Style</Label>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme, index) => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => setSelectedTheme(theme.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedTheme === theme.id 
                  ? `${theme.accent} bg-gray-800` 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${theme.color} mx-auto mb-1`} />
              <div className="text-xs font-medium text-gray-300">{theme.name}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 flex-1 overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-gray-300">Messages</Label>
          <Button
            onClick={addMessage}
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((message, index) => {
            const isThem = message.characterId === "them"
            
            return (
              <motion.div
                key={message.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`p-3 rounded-lg border border-gray-700 bg-gray-800 relative ${
                  isThem ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'
                }`}
              >
                <Textarea
                  value={message.text}
                  onChange={(e) => updateMessage(message.id, e.target.value)}
                  placeholder={isThem ? "Their message..." : "Your message..."}
                  className="resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none text-white min-h-[60px] text-sm"
                />
                
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex p-1 bg-gray-700 rounded-full">
                    <button
                      onClick={() => toggleMessageSpeaker(message.id, "them")}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                        isThem ? "bg-blue-500 text-white" : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Them
                    </button>
                    <button
                      onClick={() => toggleMessageSpeaker(message.id, "you")}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                        !isThem ? "bg-green-500 text-white" : "text-gray-300 hover:text-white"
                      }`}
                    >
                      You
                    </button>
                  </div>
                  
                  <Button
                    onClick={() => deleteMessage(message.id)}
                    size="icon"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 w-8 h-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
          
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Click "Add" to create your first message</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Generate Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-4 border-t border-gray-700"
      >
        <Button
          onClick={handleRender}
          disabled={messages.length === 0}
          className="w-full h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold text-base shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Video
        </Button>
      </motion.div>
    </div>
  )
}