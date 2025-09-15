"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAppStore } from "@/lib/store"

export default function EditorPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setUser, setActiveTab } = useAppStore()

  useEffect(() => {
    // Check auth and redirect to main app
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      setActiveTab('editor')
      router.push('/')
    }
    checkAuth()
  }, [router, setUser, setActiveTab])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <p>Redirecting to editor...</p>
      </div>
    </div>
  )
}