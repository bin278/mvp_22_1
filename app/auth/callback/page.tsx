"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// 禁用静态生成，强制动态渲染
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    if (hasProcessed) return

    const processAuth = async () => {
      // Check for hash fragments first (OAuth callback - Google, etc.)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const error = params.get('error')

        if (error) {
          // Error in hash, stay on page to show error
          setHasProcessed(true)
          return
        }

        if (accessToken) {
          // Has access token in hash
          // Supabase client automatically processes hash fragments
          // Wait a bit for Supabase to process it
          const timer = setTimeout(() => {
            if (user) {
              setHasProcessed(true)
              // Clear hash and redirect
              window.history.replaceState(null, '', window.location.pathname)
              router.replace('/')
            }
          }, 2000)

          return () => clearTimeout(timer)
        }
      }

      // Check for code in query params (PKCE flow)
      const code = searchParams.get('code')
      if (code && supabase) {
        try {
          // Exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setHasProcessed(true)
            router.replace('/login?error=code_exchange_failed')
            return
          }

          // Code exchanged successfully, wait for auth state to update
          const timer = setTimeout(() => {
            if (user) {
              setHasProcessed(true)
              // Clear query params and redirect
              window.history.replaceState(null, '', window.location.pathname)
              router.replace('/')
            } else if (!loading) {
              setHasProcessed(true)
              router.replace('/login?error=auth_failed')
            }
          }, 1500)

          return () => clearTimeout(timer)
        } catch (err) {
          console.error('Code exchange exception:', err)
          setHasProcessed(true)
          router.replace('/login?error=code_exchange_failed')
          return
        }
      }

      // No hash or code, check if already authenticated
      if (user) {
        setHasProcessed(true)
        router.replace('/')
        return
      }

      // No hash, no code, not authenticated, and done loading - redirect to login
      if (!loading) {
        setHasProcessed(true)
        router.replace('/login?error=auth_failed')
      }
    }

    processAuth()
  }, [user, loading, router, searchParams, hasProcessed])

  // Check for errors in URL hash
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const params = new URLSearchParams(hash.substring(1))
  const error = params.get('error')
  const errorDescription = params.get('error_description')

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>
              There was an error during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
                {errorDescription && (
                  <>
                    <br />
                    <strong>Details:</strong> {errorDescription}
                  </>
                )}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Go to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Authentication Successful</CardTitle>
            <CardDescription>
              Redirecting you to the home page...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Completing Authentication</CardTitle>
          <CardDescription>
            Please wait while we complete your login...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

