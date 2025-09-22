'use client'

import { useAppStore } from "@/lib/store"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, supabase])

  return <>{children}</>
}