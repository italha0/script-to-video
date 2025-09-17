"use client"

import { motion } from "framer-motion"
import { Player } from "@remotion/player"
import { MessageConversation } from "@/remotion/MessageConversation"
import { useAppStore } from "@/lib/store"
import { Smartphone, Play, Pause } from "lucide-react"
import { useState, useMemo, useRef, useCallback } from "react"

export function PreviewPanel() {
  const { 
    messages, 
    characters, 
    contactName, 
    selectedTheme 
  } = useAppStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef<any>(null)

  const inputProps = useMemo(() => ({
    messages: messages.map((m, index) => ({
      id: index + 1,
      text: m.text || "(empty message)",
      sent: m.characterId === "you",
      time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    })),
    characters: [
      { id: "them", name: contactName, color: "bg-blue-500" },
      { id: "you", name: "You", color: "bg-green-500" },
    ],
    theme: selectedTheme,
    contactName,
    isPro: false
  }), [messages, characters, contactName, selectedTheme])

  const durationInFrames = Math.max(300, messages.length * 120) // At least 10 seconds, +4 seconds per message

  const handlePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
        setIsPlaying(false)
      } else {
        playerRef.current.play()
        setIsPlaying(true)
      }
    }
  }, [isPlaying])

  const handlePlayerPlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Preview</h2>
          <p className="text-muted-foreground text-sm">
            See how your video will look
          </p>
        </div>

        {/* Phone Frame with Preview */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Phone Frame */}
          <div className="relative bg-black rounded-[2.5rem] p-3 md:p-4 shadow-2xl shadow-black/50">
            <div
              className="bg-black rounded-[2rem] overflow-hidden relative w-[280px] h-[497px] sm:w-[300px] sm:h-[533px] md:w-[320px] md:h-[568px]"
            >
              {/* Video Preview */}
              {messages.length > 0 ? (
                <div className="w-full h-full">
                  <Player
                    ref={playerRef}
                    component={MessageConversation}
                    durationInFrames={durationInFrames}
                    fps={30}
                    compositionWidth={390}
                    compositionHeight={844}
                    inputProps={inputProps}
                    controls={false}
                    autoPlay={false}
                    loop
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Smartphone className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm text-center px-8">
                    Add messages to see your video preview
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Play/Pause Button Overlay */}
          {messages.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-black/20 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </div>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}