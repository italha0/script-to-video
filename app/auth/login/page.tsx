'use client'

import type React from "react"

import { createClient } from "@/lib/appwrite/client"
// ...existing code...
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
// ...existing code...
export default function LoginPage() {
  // Google OAuth: check for Appwrite session and redirect if logged in
  useEffect(() => {
    const { account } = createClient();
    const checkSession = async () => {
      try {
        await account.get();
        // If already logged in, always redirect to /yt-shorts (or redirect param)
        router.replace(redirectTo || "/yt-shorts");
      } catch {
        // Not logged in, stay on login page
      }
    };
    checkSession();
    // eslint-disable-next-line
  }, []);
  const { setUser } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get redirect param from query string, default to /editor
  const redirectParam = searchParams?.get("redirect") ?? null;
  const redirectTo = (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//"))
    ? redirectParam
    : "/editor";

  // (Google OAuth logic will be re-implemented below)

  // Email/password login handler (Appwrite)
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
      setUser(user); // Store user in global state
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
  };

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
// ...existing code...
              <div className="text-center text-xs text-foreground-muted">
                Don't have an account? <Link href="/auth/signup" className="text-primary hover:text-primary-hover font-medium">Sign up</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  );
}