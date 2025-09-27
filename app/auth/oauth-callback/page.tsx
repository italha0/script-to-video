'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/appwrite/client'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OAuthCallbackPage() {
  const { setUser } = useAppStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [error, setError] = useState<string>('')
  
  // Get redirect URL from query params or default to editor
  const redirectParam = searchParams?.get('redirect')
  const redirectTo = (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//'))
    ? redirectParam
    : '/editor'

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { account } = createClient()
        
        // Small delay to ensure OAuth session is properly set
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Try to get the current user session
        const user = await account.get()
        
        if (user) {
          // Set user in store
          setUser(user)
          setStatus('success')
          
          // Redirect after a brief delay to show success
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.replace(redirectTo)
            } else {
              router.replace(redirectTo)
            }
          }, 1500)
        } else {
          throw new Error('No user session found')
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setError(error?.message || 'Authentication failed')
        
        // Redirect to login after error delay
        setTimeout(() => {
          router.replace('/auth/login?error=' + encodeURIComponent('OAuth authentication failed'))
        }, 3000)
      }
    }

    handleOAuthCallback()
  }, [setUser, router, redirectTo])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <Card className="bg-background-light/70 backdrop-blur border-border/70">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl font-semibold">
              {status === 'checking' && 'Completing sign in...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Authentication failed'}
            </CardTitle>
            <CardDescription className="text-foreground-muted">
              {status === 'checking' && 'Please wait while we finish setting up your account'}
              {status === 'success' && 'Redirecting to your dashboard...'}
              {status === 'error' && error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'checking' && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
            {status === 'success' && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">Taking you to your dashboard...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}