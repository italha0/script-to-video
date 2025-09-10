"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Video, Loader2, Save, FolderOpen, LogOut, Trash2 } from "lucide-react"
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
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight leading-tight">
          CREATE A FAKE <br /> <span className="text-blue-600">iMESSAGE VIDEO</span>
        </h1>
        <p className="text-muted-foreground mt-2 mb-8">Type in any story you’d like to be told in the video</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-8">
            {/* Contact Name */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Name</Label>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/30 transition shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-700 select-none">
                  {contactName.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() || "JD"}
                </div>
                <Input
                  value={contactName}
                  onChange={(e)=>setContactName(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none text-base"
                  placeholder="Contact name"
                />
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Conversation</h2>
              <div className="space-y-4">
                {messages.map((m, idx) => {
                  const isThem = m.characterId === "them";
                  return (
                    <div key={m.id} className="group relative rounded-xl border border-border/60 bg-card/50 px-3 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/30 transition">
                      <Textarea
                        value={m.text}
                        onChange={(e)=>updateMessageText(m.id, e.target.value)}
                        autoFocus={idx === messages.length -1}
                        placeholder={isThem ? "Their message..." : "Your message..."}
                        className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[70px] text-sm"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex bg-muted rounded-full p-0.5 text-xs font-medium">
                          <button
                            onClick={()=>toggleMessageSpeaker(m.id, "them")}
                            className={`px-3 py-1 rounded-full transition ${isThem?"bg-blue-600 text-white shadow":"text-muted-foreground hover:text-foreground"}`}
                          >Them</button>
                          <button
                            onClick={()=>toggleMessageSpeaker(m.id, "you")}
                            className={`px-3 py-1 rounded-full transition ${!isThem?"bg-blue-600 text-white shadow":"text-muted-foreground hover:text-foreground"}`}
                          >You</button>
                        </div>
                        <button onClick={()=>deleteMessage(m.id)} className="text-red-500/70 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <Button onClick={addMessage} variant="outline" className="w-full border-dashed hover:border-blue-500/50 hover:bg-blue-50/40 text-sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Message
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={downloadFramesJson}
                disabled={messages.length===0 || isGeneratingVideo}
                className="flex-1 bg-blue-600 hover:bg-blue-600/90 text-white shadow-lg hover:shadow-blue-600/30"
              >
                {isGeneratingVideo ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Generating...</>) : (<><Video className="w-4 h-4 mr-2"/>Generate Video</>)}
              </Button>
              <Button
                variant="outline"
                onClick={()=>setMessages([])}
                className="hover:bg-red-50 hover:border-red-300 text-red-600 border-red-200"
                disabled={messages.length===0}
              >Clear</Button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:pl-4">
            <div className="sticky top-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Preview</h3>
                <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/30">{messages.length} msgs</Badge>
              </div>
              <div className="relative mx-auto w-[300px] md:w-[340px] aspect-[390/744]">
                <div className="absolute inset-0 rounded-[40px] border border-black/20 bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] p-3 flex flex-col">
                  <div className="relative flex-1 rounded-[32px] bg-white overflow-hidden flex flex-col">
                    <div className="h-14 pt-2 px-4 flex flex-col items-center justify-start bg-gradient-to-b from-white to-white/80 border-b border-slate-200">
                      <div className="w-12 h-2 rounded-full bg-slate-300 mb-1" />
                      <div className="flex items-center w-full justify-between text-[13px] font-medium text-slate-600">
                        <span className="text-blue-600 font-semibold text-sm">&lt; Back</span>
                        <span className="text-[15px] font-semibold text-slate-800">{contactName || "Contact"}</span>
                        <span className="text-blue-600 text-sm">99+</span>
                      </div>
                    </div>
                    <div className="flex-1 px-3 pb-4 pt-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Your conversation will appear here...</div>
                      ) : (
                        messages.map((m,i)=>{
                          const isOwn = m.characterId === "you"; const prev=messages[i-1]; const next=messages[i+1]; const prevSame=prev && prev.characterId===m.characterId; const nextSame=next && next.characterId===m.characterId; const base="text-[14px] leading-snug px-3 py-2 inline-block shadow-sm"; const ownColors="bg-[#007AFF] text-white"; const otherColors="bg-[#E5E5EA] text-black"; const radiusOwn=`rounded-2xl ${prevSame?"rounded-tr-md":""} ${nextSame?"rounded-br-md":""}`; const radiusOther=`rounded-2xl ${prevSame?"rounded-tl-md":""} ${nextSame?"rounded-bl-md":""}`; return (<div key={m.id} className={`flex w-full ${isOwn?"justify-end":"justify-start"}`}><div className={`max-w-[78%] ${isOwn?ownColors:otherColors} ${isOwn?radiusOwn:radiusOther} ${base}`}>{m.text || <span className="opacity-40">(empty)</span>}</div></div>) })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Save / Load Section */}
        <div className="mt-12 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Save / Load (optional)</h3>
          <div className="flex gap-2">
            <Input placeholder="Script title" value={scriptTitle} onChange={e=>setScriptTitle(e.target.value)} className="max-w-xs" />
            <Button size="sm" onClick={saveScript} disabled={!scriptTitle.trim() || isSaving}>{isSaving? <Loader2 className="w-4 h-4 animate-spin"/>: <Save className="w-4 h-4"/>}</Button>
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><FolderOpen className="w-4 h-4 mr-1"/>Load</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Saved Scripts</DialogTitle></DialogHeader>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isLoadingScripts ? <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div> : savedScripts.length===0 ? <div className="text-center py-4 text-sm text-muted-foreground">None</div> : savedScripts.map(s => (
                    <Button key={s.id} variant="outline" className="w-full justify-start text-left" onClick={()=>loadScript(s)}>
                      <div>
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.messages.length} messages • {new Date(s.updated_at).toLocaleDateString()}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            {user && <Button size="sm" variant="ghost" onClick={handleSignOut} className="ml-auto text-red-500">Sign out</Button>}
          </div>
        </div>
      </div>
    </div>
  )
}
