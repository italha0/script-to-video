'use client'

import type React from "react"

import { createClient } from "@/lib/appwrite/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"

export default function LoginPage() {
  const { setUser } = useAppStore();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams?.get("redirect") ?? null
  const redirectTo = (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//"))
    ? redirectParam
    : "/editor"

  useEffect(() => {
    const { account } = createClient()
    const checkSession = async () => {
      try {
        await account.get()
        router.replace(redirectTo)
      } catch (error) {
        // Not logged in
      }
    }
    checkSession()
  }, [router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { account } = createClient();
    setIsLoading(true);
    setError(null);
    try {
      // Check for existing session
      let sessionExists = false;
      try {
        await account.get();
        sessionExists = true;
      } catch {}
      if (!sessionExists) {
        await account.createEmailPasswordSession(email, password);
      }
      const user = await account.get();
      setUser(user);
      if (typeof window !== 'undefined') {
        window.location.replace(redirectTo);
      } else {
        router.replace(redirectTo);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }



  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <Card className="bg-background-light/70 backdrop-blur border-border/70">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
            <CardDescription className="text-foreground-muted">Sign in to your ChatVideo account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} />
              </div>
              {error && <div className="text-xs rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading?"Signing in...":"Sign in"}</Button>
            </form>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white"
                onClick={() => {
                  const { account } = createClient();
                  const isProd = window.location.hostname === 'www.mockvideo.app';
                  const currentUrl = window.location.origin;
                  const success = isProd
                    ? 'https://www.mockvideo.app/auth/oauth-callback?redirect=' + encodeURIComponent(redirectTo)
                    : currentUrl + '/auth/oauth-callback?redirect=' + encodeURIComponent(redirectTo);
                  const failure = isProd
                    ? 'https://www.mockvideo.app/auth/login'
                    : currentUrl + '/auth/login';
                  account.createOAuth2Session(
                    'google' as any, // Type assertion for now - will be fixed with proper import
                    success,
                    failure
                  );
                }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block mr-2 align-middle"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.962 32.083 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.813.857 6.654 2.278l6.435-6.435C33.36 6.532 28.905 5 24 5 12.954 5 4 13.954 4 25s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.341-.138-2.651-.389-3.917z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.104 19.001 13 24 13c2.507 0 4.813.857 6.654 2.278l6.435-6.435C33.36 6.532 28.905 5 24 5c-7.732 0-14.313 4.388-17.694 10.691z"/><path fill="#FBBC05" d="M24 43c5.315 0 9.799-1.757 13.066-4.771l-6.066-4.966C29.418 35 24 35 24 35c-5.418 0-9.962-2.917-11.303-7.083l-6.571 4.819C9.687 40.612 16.268 45 24 45z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C33.962 32.083 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.813.857 6.654 2.278l6.435-6.435C33.36 6.532 28.905 5 24 5c-7.732 0-14.313 4.388-17.694 10.691z" opacity=".15"/></g></svg>
                Sign in with Google
              </Button>
              <div className="text-center text-xs text-foreground-muted">
                Don't have an account? <Link href="/auth/signup" className="text-primary hover:text-primary-hover font-medium">Sign up</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
