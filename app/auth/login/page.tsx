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
import { MessageSquare } from "lucide-react"

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
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">MockVideo</span>
              <span className="text-sm text-muted-foreground ml-2">AI</span>
            </div>
          </div>
          <p className="text-muted-foreground">Create viral videos with AI automation</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/5">
          <CardHeader className="text-center space-y-4 pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to continue creating amazing videos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                  value={email} 
                  onChange={(e)=>setEmail(e.target.value)}
                  className="h-12 px-4 rounded-xl border-border/50 bg-background/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <Link href="#" className="text-sm text-primary hover:text-primary-hover font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password"
                  required 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)}
                  className="h-12 px-4 rounded-xl border-border/50 bg-background/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              {error && (
                <div className="text-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-border/50 bg-white hover:bg-gray-50 text-foreground rounded-xl font-medium transition-all duration-200"
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
                <svg width="20" height="20" viewBox="0 0 48 48" className="mr-3">
                  <g>
                    <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.962 32.083 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.813.857 6.654 2.278l6.435-6.435C33.36 6.532 28.905 5 24 5 12.954 5 4 13.954 4 25s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.341-.138-2.651-.389-3.917z"/>
                    <path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.104 19.001 13 24 13c2.507 0 4.813.857 6.654 2.278l6.435-6.435C33.36 6.532 28.905 5 24 5c-7.732 0-14.313 4.388-17.694 10.691z"/>
                    <path fill="#FBBC05" d="M24 43c5.315 0 9.799-1.757 13.066-4.771l-6.066-4.966C29.418 35 24 35 24 35c-5.418 0-9.962-2.917-11.303-7.083l-6.571 4.819C9.687 40.612 16.268 45 24 45z"/>
                    <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C33.962 32.083 29.418 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.813.857 6.654 2.278l6.435-6.435C33.36 6.532 28.905 5 24 5c-7.732 0-14.313 4.388-17.694 10.691z" opacity=".15"/>
                  </g>
                </svg>
                Continue with Google
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account? 
                <Link href="/auth/signup" className="text-primary hover:text-primary-hover font-semibold ml-1">
                  Sign up for free
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
