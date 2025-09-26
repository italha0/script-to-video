'use client'

import { useAppStore } from "@/lib/store"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/appwrite/client"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { account } = createClient();
      const user = await account.get();
      setUser(user);
    } catch (e: any) {
      setUser(null);
      setError(e?.message || "Not authenticated");
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Optionally, provide loading/error state via context if needed
  return <>{children}</>
}