"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Sparkles } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

// Theme selection is fixed to iMessage per new design

export function ControlPanel() {
  const {
    contactName,
    setContactName,
    selectedTheme,
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
    // First, ensure the user is authenticated; otherwise redirect to login
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const redirect = encodeURIComponent('/editor')
        window.location.href = `/auth/login?redirect=${redirect}`
        return
      }
    } catch {
      // On any auth check error, fall back to login redirect as a safe default
      const redirect = encodeURIComponent('/editor')
      window.location.href = `/auth/login?redirect=${redirect}`
      return
    }

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

      if (response.status === 401) {

        const redirect = encodeURIComponent('/editor')
        window.location.href = `/auth/login?redirect=${redirect}`
        return
      }

      if (response.status === 202) {
        const { jobId, statusUrl } = await response.json()
        setRenderProgress({ jobId, status: 'rendering' })
        
        // Start polling for status
        pollRenderStatus(jobId)
      } else if (response.ok) {
        // Direct download (rare path) -> open in new tab using blob URL
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        // We intentionally do not revoke immediately to allow the tab to load
        setTimeout(() => URL.revokeObjectURL(url), 30000)
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
  <div className="p-6 space-y-6 h-full pb-28 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
            CREATE A FAKE
            <br />
            <span className="">iMESSAGE VIDEO</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Type in any story you’d like to be told in the video
          </p>
        </div>
      </motion.div>

      {/* Contact Name */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Label className="text-sm font-semibold text-foreground">Name</Label>
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-xs">
            {contactName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "C"}
          </div>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-foreground placeholder:text-muted-foreground text-sm"
            placeholder="Enter contact name"
          />
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 flex-1 overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Conversation</Label>
          <Button
            onClick={addMessage}
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
  <div className="space-y-3 max-h-[28rem] md:max-h-[30rem] overflow-y-auto pr-1">
          {messages.map((message, index) => {
            const isThem = message.characterId === "them"
            
            return (
              <motion.div
                key={message.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className={
                  `rounded-lg border border-border bg-card relative flex items-stretch gap-0`
                }
              >
                {/* Left accent bar */}
                <div className={`w-[3px] rounded-l-lg ${isThem ? 'bg-blue-500' : 'bg-green-500'}`} />
                {/* Text area */}
                <div className="flex-1 p-3">
                  <Textarea
                    value={message.text}
                    onChange={(e) => updateMessage(message.id, e.target.value)}
                    placeholder={isThem ? "Type here..." : "Type here..."}
                    className="resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none text-foreground min-h-[72px] text-sm"
                  />
                </div>
                {/* Controls */}
                <div className="pr-3 py-3 flex flex-col items-end gap-2 w-[112px]">
                  <div className="inline-flex p-1 bg-muted rounded-full">
                    <button
                      onClick={() => toggleMessageSpeaker(message.id, "them")}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                        isThem ? "bg-blue-500 text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Them
                    </button>
                    <button
                      onClick={() => toggleMessageSpeaker(message.id, "you")}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                        !isThem ? "bg-green-500 text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      You
                    </button>
                  </div>
                  <Button
                    onClick={() => deleteMessage(message.id)}
                    size="icon"
                    variant="ghost"
                    className="text-red-600 hover:text-red-600/80 hover:bg-red-100 w-8 h-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
          
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Click "Add" to create your first message</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Generate Button - desktop */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-4 border-t border-border hidden md:block"
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

      {/* Sticky Generate Button - mobile */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 z-40 px-4">
        <Button
          onClick={handleRender}
          disabled={messages.length === 0}
          className="w-full h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold text-base shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Video
        </Button>
      </div>
    </div>
  )
}