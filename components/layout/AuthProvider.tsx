'use client'

import { useAppStore } from "@/lib/store"
import { useEffect } from "react"
import { account } from "@/lib/appwrite/client"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await account.get()
        setUser(user)
      } catch (e) {
        setUser(null)
      }
    }
    fetchUser()
  }, [setUser])

  return <>{children}</>
}