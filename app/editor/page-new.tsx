"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Video, Loader2, Save, FolderOpen, LogOut, Trash2, ArrowLeft } from "lucide-react"
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
  // Contact name (the other person). We keep two logical characters: them + you
  const [contactName, setContactName] = useState("John Doe")
  const [characters, setCharacters] = useState<Character[]>([
    { id: "them", name: "John Doe", color: "bg-blue-500" },
    { id: "you", name: "You", color: "bg-green-500" },
  ])
  const [messages, setMessages] = useState<Message[]>([])
  const [isAddingCharacter, setIsAddingCharacter] = useState(false) // retained for compatibility with save/load (unused visually)
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
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
      if (user) loadSavedScripts()
    }
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadSavedScripts()
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadSavedScripts = async () => {
    setIsLoadingScripts(true)
    try {
      const { data, error } = await supabase.from("saved_scripts").select("*").order("updated_at", { ascending: false })
      if (error) throw error
      setSavedScripts(data || [])
    } catch (e) {
      console.error(e)
      toast({ title: "Error loading scripts", description: "Could not load your saved scripts.", variant: "destructive" })
    } finally { setIsLoadingScripts(false) }
  }

  const saveScript = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to save.", variant: "destructive" }); return }
    if (!scriptTitle.trim()) { toast({ title: "Title required", description: "Enter a title.", variant: "destructive" }); return }
    setIsSaving(true)
    try {
      const { error } = await supabase.from("saved_scripts").insert({ user_id: user.id, title: scriptTitle.trim(), characters, messages })
      if (error) throw error
      toast({ title: "Saved", description: "Script saved." })
      setScriptTitle("")
      loadSavedScripts()
    } catch (e) {
      console.error(e)
      toast({ title: "Save failed", description: "Could not save script.", variant: "destructive" })
    } finally { setIsSaving(false) }
  }

  const loadScript = (script: SavedScript) => {
    setCharacters(script.characters.map(c => c.id === script.characters[0].id ? { ...c, id: "them" } : { ...c, id: "you" }))
    setContactName(script.characters[0]?.name || "Contact")
    setMessages(mapLegacyMessages(script.messages, script.characters))
    setShowLoadDialog(false)
    toast({ title: "Script loaded" })
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/") }

  // Helpers for inline editor (originally added earlier but removed in patch cleanup)
  const addMessage = () => {
    setMessages(m => [...m, { id: Date.now().toString(), characterId: "them", text: "", timestamp: Date.now() }])
  }
  const updateMessageText = (id: string, text: string) => setMessages(ms => ms.map(m => m.id === id ? { ...m, text } : m))
  const toggleMessageSpeaker = (id: string, who: "them" | "you") => setMessages(ms => ms.map(m => m.id === id ? { ...m, characterId: who } : m))
  const deleteMessage = (id: string) => setMessages(ms => ms.filter(m => m.id !== id))
  const mapLegacyMessages = (incoming: Message[], legacyChars: Character[]) => {
    if (!legacyChars.length) return incoming
    const first = legacyChars[0].id
    return incoming.map(m => ({ ...m, characterId: m.characterId === first ? "them" : "you" }))
  }

  const downloadFramesJson = async () => {
    if (messages.length === 0) { toast({ title: "No messages", variant: "destructive" }); return }
    setIsGeneratingVideo(true)
    try {
      const res = await fetch("/api/generate-video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characters, messages, isPro: false }) })
      if (!res.ok) {
        let msg = "Failed to generate video"
        try { const e = await res.json(); msg = e.details || e.error || msg } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`chat-video-${Date.now()}.mp4`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      toast({ title: "Video ready", description: "Download started" })
    } catch (e:any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" })
    } finally { setIsGeneratingVideo(false) }
  }
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            CREATE A FAKE<br />
            iMESSAGE VIDEO
          </h1>
          <p className="text-base text-foreground-muted max-w-2xl">
            Type in any story you'd like to be told in the video
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Left Column - Controls */}
          <div className="space-y-8">
            {/* Name Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground-muted">Name</Label>
              <div className="bg-input border rounded-lg flex items-center p-2 gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-300 flex items-center justify-center font-medium text-gray-600 text-sm">
                  {contactName.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() || "JD"}
                </div>
                <Input
                  value={contactName}
                  onChange={(e)=>setContactName(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-base"
                  placeholder="Contact name"
                />
              </div>
            </div>

            {/* Conversation Section */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground-muted">Conversation</Label>
              <div className="space-y-4">
                {messages.map((m, idx) => {
                  const isThem = m.characterId === "them";
                  return (
                    <div key={m.id} className="bg-white border rounded-lg p-3 space-y-3">
                      <Textarea
                        value={m.text}
                        onChange={(e)=>updateMessageText(m.id, e.target.value)}
                        autoFocus={idx === messages.length -1}
                        placeholder={isThem ? "Their message..." : "Your message..."}
                        className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[60px] text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <div className="inline-flex p-1 bg-gray-200 rounded-full">
                          <button
                            onClick={()=>toggleMessageSpeaker(m.id, "them")}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition ${isThem?"bg-gray-800 text-white shadow":"text-gray-600 hover:text-gray-800"}`}
                          >
                            Them
                          </button>
                          <button
                            onClick={()=>toggleMessageSpeaker(m.id, "you")}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition ${!isThem?"bg-gray-800 text-white shadow":"text-gray-600 hover:text-gray-800"}`}
                          >
                            You
                          </button>
                        </div>
                        <button 
                          onClick={()=>deleteMessage(m.id)} 
                          className="text-red-400/70 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <Button onClick={addMessage} variant="outline" className="w-full border-dashed text-sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Message
                </Button>
              </div>
            </div>

            {/* Generate Video Button */}
            <Button
              onClick={downloadFramesJson}
              disabled={messages.length===0 || isGeneratingVideo}
              className="w-full h-12 text-base font-medium"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin"/>
                  Generate conversation with AI
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2"/>
                  Generate conversation with AI
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div className="sticky top-10">
            {/* Phone Mockup */}
            <div className="bg-zinc-800 rounded-[40px] p-3 shadow-2xl">
              <div className="bg-white rounded-[32px] overflow-hidden aspect-[375/812]">
                {/* iPhone Status Bar */}
                <div className="h-14 pt-2 px-4 flex flex-col items-center justify-start bg-gradient-to-b from-white to-white/85">
                  <div className="w-12 h-2 rounded-full bg-slate-300 mb-1" />
                  <div className="flex items-center w-full justify-between text-[13px] font-medium text-slate-600">
                    <span className="text-[#007AFF] font-semibold text-sm">&lt; Back</span>
                    <span className="text-[15px] font-semibold text-slate-800 truncate max-w-[140px]">{contactName || "Contact"}</span>
                    <span className="text-[#007AFF] text-sm">JD</span>
                  </div>
                </div>
                
                {/* Messages Container */}
                <div className="flex-1 px-3 pb-4 pt-3 space-y-1.5 overflow-y-auto min-h-[600px]">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      Your conversation will appear here...
                    </div>
                  ) : (
                    messages.map((m,i)=>{
                      const isOwn = m.characterId === "you"
                      const prev = messages[i-1]
                      const next = messages[i+1]
                      const prevSame = prev && prev.characterId === m.characterId
                      const nextSame = next && next.characterId === m.characterId
                      const base = "text-[14px] leading-snug px-3 py-2 inline-block shadow-sm"
                      const ownColors = "bg-[#007AFF] text-white"
                      const otherColors = "bg-[#E5E5EA] text-black"
                      const radiusOwn = `rounded-2xl ${prevSame?"rounded-tr-md":""} ${nextSame?"rounded-br-md":""}`
                      const radiusOther = `rounded-2xl ${prevSame?"rounded-tl-md":""} ${nextSame?"rounded-bl-md":""}`
                      
                      return (
                        <div key={m.id} className={`flex w-full ${isOwn?"justify-end":"justify-start"}`}>
                          <div className={`max-w-[78%] ${isOwn?ownColors:otherColors} ${isOwn?radiusOwn:radiusOther} ${base}`}>
                            {m.text || <span className="opacity-40">(empty)</span>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Low-res preview text */}
            <div className="text-center mt-4">
              <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
                Low-res preview
              </span>
            </div>
          </div>
        </div>

        {/* Save / Load Section */}
        <div className="mt-16 space-y-4">
          <h3 className="font-semibold text-xs tracking-wide text-foreground-muted uppercase">Save / Load (optional)</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Script title" value={scriptTitle} onChange={e=>setScriptTitle(e.target.value)} className="max-w-xs" />
            <Button size="sm" onClick={saveScript} disabled={!scriptTitle.trim() || isSaving}>
              {isSaving? <Loader2 className="w-4 h-4 animate-spin"/>: <Save className="w-4 h-4"/>}
            </Button>
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <FolderOpen className="w-4 h-4 mr-1"/>Load
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Saved Scripts</DialogTitle></DialogHeader>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isLoadingScripts ? (
                    <div className="text-center py-4 text-sm text-foreground-muted">Loading...</div>
                  ) : savedScripts.length===0 ? (
                    <div className="text-center py-4 text-sm text-foreground-muted">None</div>
                  ) : savedScripts.map(s => (
                    <Button key={s.id} variant="outline" className="w-full justify-start text-left" onClick={()=>loadScript(s)}>
                      <div>
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-foreground-muted">{s.messages.length} messages • {new Date(s.updated_at).toLocaleDateString()}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            {user && (
              <Button size="sm" variant="ghost" onClick={handleSignOut} className="ml-auto text-red-400 hover:text-red-300">
                <LogOut className="w-4 h-4 mr-1"/>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
