'use client'

import type React from "react"

import { account } from "@/lib/appwrite/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await account.create('unique()', email, password)
      await account.createEmailPasswordSession(email, password)
      router.push("/editor")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <Card className="bg-background-light/70 backdrop-blur border-border/70">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
            <CardDescription className="text-foreground-muted">Start creating videos in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} />
              </div>
              {error && <div className="text-xs rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading?"Signing up...":"Sign up"}</Button>
            </form>
            <div className="mt-6 text-center text-xs text-foreground-muted">
              Already have an account? <Link href="/auth/login" className="text-primary hover:text-primary-hover font-medium">Log in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
