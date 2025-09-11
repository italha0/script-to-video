"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Video, Loader2, Save, FolderOpen, LogOut, Trash2, ArrowLeft, Sparkles } from "lucide-react"
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
      // Request a render job
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters, messages, isPro: false }),
      });

      // New flow: API enqueues and returns 202 with a jobId and statusUrl
      let jobId: string | null = null;
      let statusUrl: string | null = null;

      const contentType = res.headers.get('content-type') || '';
      if (res.status === 202 && contentType.includes('application/json')) {
        const j = await res.json();
        jobId = j.jobId;
        statusUrl = j.statusUrl;
      } else if (res.ok && contentType.startsWith('video/')) {
        // Back-compat: if server returns video directly
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `chat-video-${Date.now()}.mp4`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        toast({ title: 'Video ready', description: 'Download started' });
        return;
      } else {
        let msg = 'Failed to start render';
        try { const e = await res.json(); msg = e.details || e.error || msg } catch { }
        throw new Error(msg);
      }

  if (!jobId || !statusUrl) {
        throw new Error('Invalid response from server (no jobId)');
      }

  // New approach: ask the server to wait and 302-redirect to the SAS URL when ready
  const downloadUrl = `/api/render/${jobId}/download?maxWaitMs=180000`; // wait up to 3 minutes
  // Use a hidden iframe to trigger the download without navigating away
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = downloadUrl;
  document.body.appendChild(iframe);
  // Clean up the iframe later
  setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 2 * 60 * 1000);
  toast({ title: 'Rendering started', description: 'Your download will start automatically when ready.' });
  return;
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingVideo(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-10">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Page Title */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            CREATE A FAKE<br />
            iMESSAGE VIDEO
          </h1>
          <p className="text-base text-foreground-muted max-w-2xl">
            Type in any story you'd like to be told in the video
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="lg:grid lg:grid-cols-[1fr_420px] gap-12 xl:gap-32">
          {/* Left Column - Controls */}
          <div className="flex flex-col gap-4 p-0 lg:p-6 xl:p-8 2xl:gap-6 w-full space-y-8 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:text-card-foreground lg:shadow-sm">
            {/* Name Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground-muted">Name</Label>
              <div className="bg-input border rounded-lg flex items-center p-2 gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-300 flex items-center justify-center font-medium text-gray-600 text-sm">
                  {contactName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "JD"}
                </div>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
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
                    <div key={m.id} className={`bg-white border rounded-lg p-3 space-y-3 relative pl-4 after:absolute after:inset-y-0 after:left-0 after:w-1 after:rounded-l-md after:${m.characterId === 'you' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <Textarea
                        value={m.text}
                        onChange={(e) => updateMessageText(m.id, e.target.value)}
                        autoFocus={idx === messages.length - 1}
                        placeholder={isThem ? "Their message..." : "Your message..."}
                        className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[60px] text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <div className="inline-flex p-1 bg-gray-200 rounded-full">
                          <button
                            onClick={() => toggleMessageSpeaker(m.id, "them")}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition ${isThem ? "bg-gray-800 text-white shadow" : "text-gray-600 hover:text-gray-800"}`}
                          >
                            Them
                          </button>
                          <button
                            onClick={() => toggleMessageSpeaker(m.id, "you")}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition ${!isThem ? "bg-gray-800 text-white shadow" : "text-gray-600 hover:text-gray-800"}`}
                          >
                            You
                          </button>
                        </div>
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="text-red-400/70 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <Button onClick={addMessage} variant="outline" className="w-full border-dashed text-sm  lg:inline-flex">
                  <Plus className="w-4 h-4 mr-2" /> Add Message
                </Button>
              </div>
            </div>

            {/* Generate Video Button */}
            <Button
              onClick={downloadFramesJson}
              disabled={messages.length === 0 || isGeneratingVideo}
              className="hidden lg:inline-flex w-full h-12 text-base font-medium relative overflow-hidden bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 hover:opacity-90 transition text-white shadow-lg"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating conversation...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview (matches Remotion video) */}
          <div className="mt-8 lg:mt-0 lg:fixed lg:top-10 lg:right-0 lg:left-[50rem]">
            <div className="relative mx-auto" style={{ width:'100%', maxWidth:360 }}>
              <div style={{
                width:'100%',
                height:700,
                background:'#FFFFFF',
                borderRadius:48,
                position:'relative',
                overflow:'hidden',
                boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
                border:'6px solid #000'
              }}>
                {/* Top overlay to fully mask any underlying bubbles (covers status + nav area) */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:96, background:'#F2F2F7', zIndex:15, pointerEvents:'none' }} />
                {/* Status Bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:44, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', fontSize:15, fontWeight:600, zIndex:30 }}>
                  <div>9:41</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:2 }}>
                      {[4,7,10,13].map((h,i)=>(<div key={i} style={{ width:3, height:h, background:'#000', borderRadius:1 }} />))}
                    </div>
                    <div style={{ position:'relative', width:18, height:14 }}>
                      <svg viewBox="0 0 20 14" width={18} height={14}>
                        <path d="M10 13c.9 0 1.6-.7 1.6-1.6S10.9 9.8 10 9.8 8.4 10.5 8.4 11.4 9.1 13 10 13Z" fill="#000" />
                        <path d="M3.3 6.6a9.2 9.2 0 0 1 13.4 0l-1.2 1.2a7.5 7.5 0 0 0-11 0L3.3 6.6Z" fill="#000" />
                        <path d="M6.2 9.3a5.3 5.3 0 0 1 7.6 0l-1.2 1.2a3.6 3.6 0 0 0-5.2 0l-1.2-1.2Z" fill="#000" />
                      </svg>
                    </div>
                    <div style={{ position:'relative', width:28, height:14, border:'2px solid #000', borderRadius:4, display:'flex', alignItems:'center', padding:'0 3px', boxSizing:'border-box' }}>
                      <div style={{ position:'absolute', top:3, right:-5, width:3, height:8, background:'#000', borderRadius:1 }} />
                      <div style={{ width:'100%', height:6, background:'#000', borderRadius:2 }} />
                    </div>
                  </div>
                </div>
                {/* Navigation Header */}
                <div style={{ position:'absolute', top:44, left:0, right:0, height:52, background:'#F2F2F7', borderBottom:'1px solid #C7C7CC', display:'flex', alignItems:'center', padding:'0 12px', fontSize:17, zIndex:20 }}>
                  <div style={{ fontSize:17, color:'#007AFF' }}>Back</div>
                  <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', fontSize:17, fontWeight:600 }}>{contactName || 'Contact'}</div>
                </div>
                {/* Messages (static final state) with reserved space for keyboard */}
                <div style={{ position:'absolute', top:96, left:0, right:0, bottom:300, padding:'12px 12px 4px', display:'flex', flexDirection:'column', justifyContent:'flex-end', boxSizing:'border-box', zIndex:10 }}>
                  {messages.length === 0 ? (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#8E8E93', fontSize:14 }}>
                      Your conversation will appear here...
                    </div>
                  ) : (
                    messages.map((m,i)=>{
                      const sent = m.characterId === 'you';
                      const prev = messages[i-1];
                      const next = messages[i+1];
                      const first = !prev || prev.characterId !== m.characterId;
                      const last = !next || next.characterId !== m.characterId;
                      const bubbleStyle: React.CSSProperties = {
                        maxWidth:'78%',
                        padding:'8px 14px',
                        backgroundColor: sent ? '#007AFF' : '#E5E5EA',
                        color: sent ? '#fff' : '#000',
                        fontSize:17,
                        lineHeight:1.25,
                        fontFamily:'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        wordWrap:'break-word',
                        borderTopLeftRadius: sent ? 18 : (first ? 18 : 6),
                        borderTopRightRadius: sent ? (first ? 18 : 6) : 18,
                        borderBottomLeftRadius: sent ? 18 : (last ? 18 : 6),
                        borderBottomRightRadius: sent ? (last ? 18 : 6) : 18,
                        boxShadow: sent ? '0 1px 1px rgba(0,0,0,.25)' : '0 1px 1px rgba(0,0,0,.15)',
                        letterSpacing:-0.2
                      };
                      return (
                        <div key={m.id} style={{ display:'flex', justifyContent: sent ? 'flex-end':'flex-start', marginBottom:6 }}>
                          <div style={bubbleStyle}>{m.text || <span style={{ opacity:0.4 }}>(empty)</span>}</div>
                        </div>
                      );
                    })
                  )}
                </div>
                {/* Static Keyboard */}
                <div style={{ position:'absolute', left:0, right:0, bottom:0, background:'#D1D4DA', borderTop:'1px solid #B4B7BD', fontFamily:'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', height:300 }}>
                  <div style={{ display:'flex', alignItems:'center', padding:'6px 8px', gap:8, background:'#F2F2F7' }}>
                    <div style={{ width:32, height:32, borderRadius:16, background:'#C7C7CC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📷</div>
                    <div style={{ flex:1, background:'#FFFFFF', borderRadius:16, padding:'6px 12px', color:'#000', fontSize:16, minHeight:32, display:'flex', alignItems:'center' }}>iMessage</div>
                    <div style={{ width:32, height:32, borderRadius:16, background:'#C7C7CC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎤</div>
                  </div>
                  <div style={{ padding:'4px 6px 8px' }}>
                    {[['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['⇧','Z','X','C','V','B','N','M','⌫'], ['123','😀','space','return']].map((row,i)=>(
                      <div key={i} style={{ display:'flex', justifyContent:'center', marginBottom:i===3?0:6 }}>
                        {row.map(k=>{
                          const isSpace = k==='space';
                          return (
                            <div key={k} style={{ flex:isSpace?4:1, background:'#fff', color:'#000', borderRadius:6, padding:'10px 6px', textAlign:'center', fontSize:14, fontWeight:500, boxShadow:'0 1px 0 rgba(0,0,0,0.25)', margin:'0 3px' }}>
                              {isSpace? '' : k}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for mobile bottom bar */}
        <div className="h-24 lg:hidden" />

        {/* Mobile bottom action bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 px-4 py-3 p-2.5 flex gap-3 items-center pb-[env(safe-area-inset-bottom)]">
         
          <Button onClick={downloadFramesJson} disabled={messages.length===0 || isGeneratingVideo} className="flex-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 hover:opacity-90 text-white font-medium h-11">
            {isGeneratingVideo ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
