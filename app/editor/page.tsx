"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Send, Video, User, MessageSquare, ArrowLeft, Loader2, Save, FolderOpen, LogOut } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface Character {
  id: string
  name: string
  color: string
  avatar?: string
}

interface Message {
  id: string
  characterId: string
  text: string
  timestamp: number
}

interface SavedScript {
  id: string
  title: string
  characters: Character[]
  messages: Message[]
  created_at: string
  updated_at: string
}

export default function EditorPage() {
  const [characters, setCharacters] = useState<Character[]>([
    { id: "1", name: "Alex", color: "bg-primary" },
    { id: "2", name: "Sam", color: "bg-secondary" },
  ])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("1")
  const [currentMessage, setCurrentMessage] = useState("")
  const [newCharacterName, setNewCharacterName] = useState("")
  const [isAddingCharacter, setIsAddingCharacter] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scriptTitle, setScriptTitle] = useState("")
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingScripts, setIsLoadingScripts] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (user) {
        loadSavedScripts()
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadSavedScripts()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadSavedScripts = async () => {
    setIsLoadingScripts(true)
    try {
      const { data, error } = await supabase.from("saved_scripts").select("*").order("updated_at", { ascending: false })

      if (error) throw error
      setSavedScripts(data || [])
    } catch (error) {
      console.error("Error loading scripts:", error)
      toast({
        title: "Error loading scripts",
        description: "Could not load your saved scripts.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingScripts(false)
    }
  }

  const saveScript = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your scripts.",
        variant: "destructive",
      })
      return
    }

    if (!scriptTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your script.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from("saved_scripts").insert({
        user_id: user.id,
        title: scriptTitle.trim(),
        characters,
        messages,
      })

      if (error) throw error

      toast({
        title: "Script saved!",
        description: "Your chat script has been saved successfully.",
      })

      setScriptTitle("")
      loadSavedScripts()
    } catch (error) {
      console.error("Error saving script:", error)
      toast({
        title: "Error saving script",
        description: "Could not save your script. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const loadScript = (script: SavedScript) => {
    setCharacters(script.characters)
    setMessages(script.messages)
    setShowLoadDialog(false)
    toast({
      title: "Script loaded!",
      description: `Loaded "${script.title}" successfully.`,
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId)

  const addCharacter = () => {
    if (newCharacterName.trim()) {
      const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"]
      const newCharacter: Character = {
        id: Date.now().toString(),
        name: newCharacterName.trim(),
        color: colors[characters.length % colors.length],
      }
      setCharacters([...characters, newCharacter])
      setNewCharacterName("")
      setIsAddingCharacter(false)
    }
  }

  const sendMessage = () => {
    if (currentMessage.trim() && selectedCharacter) {
      const newMessage: Message = {
        id: Date.now().toString(),
        characterId: selectedCharacterId,
        text: currentMessage.trim(),
        timestamp: Date.now(),
      }
      setMessages([...messages, newMessage])
      setCurrentMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const generateVideo = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to render",
        description: "Add some messages to your chat before generating a video.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingVideo(true)

    try {
      console.log("[v0] Starting video generation request...")
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characters,
          messages,
          isPro: false, // For now, all users are free users
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to generate video"
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
          console.log("[v0] Server error details:", errorData)
        } catch (parseError) {
          console.log("[v0] Could not parse error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const videoBlob = await response.blob()
      console.log("[v0] Video blob received, size:", videoBlob.size)

      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(videoBlob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `chat-video-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Video downloaded successfully!",
        description: `Your chat video has been downloaded to your device.`,
      })

      console.log("[v0] Video download completed")
    } catch (error) {
      console.error("[v0] Video generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Video generation failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  const getCharacterById = (id: string) => characters.find((c) => c.id === id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Back</span>
            </Link>
            <div className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">Chat Editor</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Badge variant="secondary" className="hidden sm:flex bg-primary/10 text-primary border-primary/20">
              {messages.length} messages
            </Badge>
            <Button
              className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateVideo}
              disabled={isGeneratingVideo || messages.length === 0}
            >
              {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              <span className="hidden sm:inline">{isGeneratingVideo ? "Generating..." : "Generate Video"}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Characters</span>
                  <Dialog open={isAddingCharacter} onOpenChange={setIsAddingCharacter}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 hover:scale-105 bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Character
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Character</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="character-name">Character Name</Label>
                          <Input
                            id="character-name"
                            value={newCharacterName}
                            onChange={(e) => setNewCharacterName(e.target.value)}
                            placeholder="Enter character name"
                            onKeyPress={(e) => e.key === "Enter" && addCharacter()}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddingCharacter(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addCharacter}>Add Character</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {characters.map((character) => (
                    <Button
                      key={character.id}
                      variant={selectedCharacterId === character.id ? "default" : "outline"}
                      className={`justify-start transition-all duration-300 hover:scale-105 ${
                        selectedCharacterId === character.id
                          ? "bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-primary/25"
                          : "hover:bg-primary/5 hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedCharacterId(character.id)}
                    >
                      <div className={`w-3 h-3 rounded-full ${character.color} mr-2 shadow-sm`} />
                      {character.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Speaking as: {selectedCharacter?.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message-input">Message</Label>
                  <Textarea
                    id="message-input"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Type ${selectedCharacter?.name}'s message...`}
                    className="min-h-[100px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/25 transition-all duration-300"
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  disabled={!currentMessage.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setMessages([])}
                >
                  Clear All Messages
                </Button>
                {user ? (
                  <>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Script title..."
                        value={scriptTitle}
                        onChange={(e) => setScriptTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={saveScript} disabled={isSaving || !scriptTitle.trim()} size="sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Load Script
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Load Saved Script</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {isLoadingScripts ? (
                            <div className="text-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Loading scripts...</p>
                            </div>
                          ) : savedScripts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No saved scripts found.</p>
                          ) : (
                            savedScripts.map((script) => (
                              <Button
                                key={script.id}
                                variant="outline"
                                className="w-full justify-start text-left bg-transparent"
                                onClick={() => loadScript(script)}
                              >
                                <div>
                                  <div className="font-medium">{script.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {script.messages.length} messages •{" "}
                                    {new Date(script.updated_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </Button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Sign in to save and load scripts</p>
                    <Button size="sm" asChild>
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="h-[600px] flex flex-col group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Chat Preview</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {messages.length} messages
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Phone Frame */}
                <div className="flex-1 bg-gradient-to-br from-muted/20 to-muted/40 rounded-2xl p-4 overflow-hidden shadow-inner">
                  <div className="bg-background rounded-xl h-full flex flex-col shadow-2xl border border-border/50">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border/50 bg-gradient-to-r from-card to-card/80">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center shadow-sm">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Chat Preview</h3>
                          <p className="text-xs text-muted-foreground">{characters.map((c) => c.name).join(", ")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center animate-pulse">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Start typing to see your chat preview</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message, index) => {
                          const character = getCharacterById(message.characterId)
                          const isFirstMessage = index === 0
                          const prevMessage = index > 0 ? messages[index - 1] : null
                          const isNewSpeaker = !prevMessage || prevMessage.characterId !== message.characterId
                          const isOwnMessage = character?.id === "1" // Assuming first character is "user"

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                            >
                              <div className={`max-w-[80%] ${isNewSpeaker ? "mt-2" : ""}`}>
                                {isNewSpeaker && (
                                  <div
                                    className={`text-xs text-muted-foreground mb-1 ${isOwnMessage ? "text-right" : "text-left"}`}
                                  >
                                    {character?.name}
                                  </div>
                                )}
                                <div
                                  className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${
                                    isOwnMessage
                                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-md"
                                      : "bg-muted text-foreground rounded-bl-md hover:bg-muted/80"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
