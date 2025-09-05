import type React from "react"
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"

export interface Character {
  id: string
  name: string
  color: string
  avatar?: string
}

export interface Message {
  id: string
  characterId: string
  text: string
  timestamp: number
}

interface ChatVideoSceneProps {
  characters: Character[]
  messages: Message[]
  showWatermark: boolean
  userCharacterId?: string
}

const TypingIndicator: React.FC<{ isVisible: boolean; color: string }> = ({ isVisible, color }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (!isVisible) return null

  const dot = (offset: number) =>
    interpolate((frame + offset) % (fps * 0.6), [0, fps * 0.2, fps * 0.4], [0.3, 1, 0.3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      {[0, fps * 0.1, fps * 0.2].map((o, i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, opacity: dot(o) }} />
      ))}
    </div>
  )
}

export const ChatVideoScene: React.FC<ChatVideoSceneProps> = ({ characters, messages, showWatermark, userCharacterId }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const getCharacterById = (id: string) => characters.find((c) => c.id === id)

  const getMessageTiming = (messageIndex: number) => {
    let totalFrames = 0
    for (let i = 0; i <= messageIndex; i++) {
      const message = messages[i]
      if (!message) continue
      const wordCount = message.text.split(/\s+/).filter(Boolean).length
      const typingDuration = Math.max(30, wordCount * 15)
      if (i === messageIndex) {
        return {
          typingStart: totalFrames,
          typingEnd: totalFrames + typingDuration,
          messageStart: totalFrames + typingDuration,
          messageEnd: totalFrames + typingDuration + 30,
        }
      }
      totalFrames += typingDuration + 30 + 15
    }
    return { typingStart: 0, typingEnd: 0, messageStart: 0, messageEnd: 0 }
  }

  return (
    <AbsoluteFill>
      <div style={{ width: "100%", height: "100%", background: "#e5e7eb", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#f8f9fb",
            display: "flex",
            flexDirection: "column",
            paddingTop: 120,
            paddingBottom: 120,
          }}
        >
          <StatusBar />
          {/* iOS-like header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 100,
              background: "#f8f9fb",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 20,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Messages</div>
          </div>

          <div style={{ flex: 1, padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((message, index) => {
              const character = getCharacterById(message.characterId) || { id: "_", name: "User", color: "#3074f2" }
              const isOwnMessage = userCharacterId ? message.characterId === userCharacterId : index % 2 === 1
              const timing = getMessageTiming(index)

              return (
                <div key={message.id}>
                  <Sequence from={timing.typingStart} durationInFrames={timing.typingEnd - timing.typingStart}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, justifyContent: isOwnMessage ? "flex-end" : "flex-start" }}>
                      <TypingIndicator isVisible={true} color={isOwnMessage ? "#0a84ff" : "#a1a1aa"} />
                    </div>
                  </Sequence>

                  {/* Keyboard typing overlay during own-message typing */}
                  {isOwnMessage && (
                    <Sequence from={timing.typingStart} durationInFrames={timing.typingEnd - timing.typingStart}>
                      <KeyboardTyping text={message.text} />
                    </Sequence>
                  )}

                  <Sequence from={timing.messageStart} durationInFrames={timing.messageEnd - timing.messageStart}>
                    <MessageBubble
                      message={message}
                      character={character}
                      isOwnMessage={isOwnMessage}
                      animationFrame={frame - timing.messageStart}
                    />
                  </Sequence>
                </div>
              )
            })}
          </div>

          {showWatermark && (
            <div style={{ position: "absolute", bottom: 20, right: 20, color: "#9ca3af", fontSize: 14 }}>Made with ChatVideo</div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}

const MessageBubble: React.FC<{
  message: Message
  character: Character | undefined
  isOwnMessage: boolean
  animationFrame: number
}> = ({ message, isOwnMessage, animationFrame }) => {
  const { fps } = useVideoConfig()

  const opacity = interpolate(animationFrame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const translateY = interpolate(animationFrame, [0, 20], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const scale = spring({ frame: animationFrame, fps, config: { damping: 15, stiffness: 150 }, from: 0.8, to: 1 })

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      <div style={{ maxWidth: "78%" }}>
        <div
          style={{
            display: "inline-block",
            padding: "14px 18px",
            borderRadius: 20,
            backgroundColor: isOwnMessage ? "#0a84ff" : "#e9e9eb",
            color: isOwnMessage ? "#ffffff" : "#111827",
            fontSize: isEmojiOnly(message.text) ? 32 : 20,
            lineHeight: 1.35,
            fontWeight: 500,
            borderBottomRightRadius: isOwnMessage ? 6 : 20,
            borderBottomLeftRadius: isOwnMessage ? 20 : 6,
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          {message.text}
        </div>
        {isOwnMessage && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, textAlign: "right" }}>Delivered</div>}
      </div>
    </div>
  )
}

// Helpers and additional UI components
const isEmojiOnly = (text: string) => {
  const stripped = text.replace(/\s+/g, "")
  if (!stripped) return false
  // Basic emoji range check
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  return [...stripped].every((ch) => emojiRe.test(ch)) && stripped.length <= 6
}

const StatusBar: React.FC = () => {
  // Simple static status bar
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        color: "#111827",
        fontWeight: 600,
        fontSize: 16,
      }}
    >
      <div>9:41</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 18, height: 10, border: "2px solid #111827", borderRadius: 2 }} />
        <div style={{ width: 14, height: 10, background: "#111827", borderRadius: 2 }} />
        <div style={{ width: 24, height: 12, border: "2px solid #111827", borderRadius: 3, position: "relative" }}>
          <div style={{ position: "absolute", right: -4, top: 2, width: 2, height: 8, background: "#111827" }} />
        </div>
      </div>
    </div>
  )
}

const KeyboardTyping: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = Math.min(1, Math.max(0, frame / (fps * 2))) // 2s full type default; actual timing is controlled by Sequence
  const typedCount = Math.floor(progress * text.length)
  const typed = text.slice(0, typedCount)

  const caretVisible = Math.floor((frame / (fps / 2)) % 2) === 0

  const currentChar = text[typedCount] || ""
  const highlightKey = (ch: string) => {
    if (ch === " ") return "SPACE"
    const letter = ch.toUpperCase()
    if (letter >= "A" && letter <= "Z") return letter
    return null
  }
  const activeKey = highlightKey(currentChar)

  const Key: React.FC<{ label: string; flex?: number }> = ({ label, flex = 1 }) => {
    const isActive = label === activeKey
    return (
      <div
        style={{
          flex,
          height: 54,
          margin: 3,
          borderRadius: 8,
          background: label === "SPACE" ? "#e1e1e5" : "#f0f0f3",
          boxShadow: isActive ? "inset 0 0 0 2px #0a84ff" : "inset 0 -1px 0 rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#111827",
          fontWeight: 600,
        }}
      >
        {label === "SPACE" ? "" : label}
      </div>
    )
  }

  const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "center", padding: "0 6px" }

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 280, background: "#eaeaf0", borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}>
      {/* Input bar */}
      <div style={{ padding: 10, paddingTop: 12 }}>
        <div style={{ height: 40, borderRadius: 20, background: "#ffffff", display: "flex", alignItems: "center", padding: "0 14px", boxShadow: "inset 0 0 0 1px #ececf1" }}>
          <div style={{ fontSize: 16, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
            {typed}
            {caretVisible && <span style={{ display: "inline-block", width: 2, height: 20, background: "#111827", marginLeft: 2 }} />}
          </div>
        </div>
      </div>

      {/* Keys */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={rowStyle}>
          {"QWERTYUIOP".split("").map((k) => (
            <Key key={k} label={k} />
          ))}
        </div>
        <div style={rowStyle}>
          {"ASDFGHJKL".split("").map((k) => (
            <Key key={k} label={k} />
          ))}
        </div>
        <div style={rowStyle}>
          {"ZXCVBNM".split("").map((k) => (
            <Key key={k} label={k} />
          ))}
        </div>
        <div style={{ ...rowStyle, paddingBottom: 8 }}>
          <Key label="SPACE" flex={6} />
        </div>
      </div>
    </div>
  )
}
