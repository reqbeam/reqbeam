'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { storeAuthToken } from '@/utils/authToken'

function CliLoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const sid = searchParams.get('sessionId')
    if (sid) {
      setSessionId(sid)
    } else {
      setError('Missing session ID. Please use the CLI command to open this page.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId) {
      setError('Session ID is missing')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // First, login through auth server to get JWT token
      const authServerResponse = await fetch('/api/auth/server/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (authServerResponse.ok) {
        const authData = await authServerResponse.json()
        
        // Store JWT token in localStorage
        if (authData.token && authData.user) {
          storeAuthToken(authData.token, authData.user, authData.expiresAt)
        }

        // Also maintain NextAuth session for backward compatibility
        await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        // Update CLI session with authentication data
        const sessionResponse = await fetch('/api/auth/cli/session', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            token: authData.token,
            user: authData.user,
            expiresAt: authData.expiresAt,
          }),
        })

        if (sessionResponse.ok) {
          // Show success message and close window after a delay
          setError('')
          setTimeout(() => {
            // Try to close the window (works if opened by CLI)
            if (window.opener) {
              window.close()
            } else {
              // If window can't be closed, redirect to success page
              router.push('/auth/cli-login/success')
            }
          }, 1500)
        } else {
          setError('Failed to complete CLI authentication')
        }
      } else {
        // If auth server fails, try NextAuth as fallback
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid credentials')
        } else {
          // Get user info from session
          const sessionResponse = await fetch('/api/auth/session')
          const session = await sessionResponse.json()
          
          if (session?.user) {
            // Generate token similar to auth server
            const tokenData = `${session.user.id}:${Date.now()}`
            const token = btoa(tokenData) // Browser-compatible base64 encoding
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            
            // Store token in localStorage
            storeAuthToken(token, {
              id: session.user.id,
              email: session.user.email || email,
              name: session.user.name,
            }, expiresAt)

            // Update CLI session
            const updateResponse = await fetch('/api/auth/cli/session', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                token,
                user: {
                  id: session.user.id,
                  email: session.user.email || email,
                  name: session.user.name,
                },
                expiresAt,
              }),
            })

            if (updateResponse.ok) {
              setTimeout(() => {
                if (window.opener) {
                  window.close()
                } else {
                  router.push('/auth/cli-login/success')
                }
              }, 1500)
            } else {
              setError('Failed to complete CLI authentication')
            }
          } else {
            setError('Failed to get user session')
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!sessionId) {
      setError('Session ID is missing')
      return
    }

    // For OAuth, we'll need to handle the callback differently
    // For now, show a message that OAuth needs to be handled separately
    setError('OAuth login for CLI is not yet supported. Please use email/password login.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            CLI Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Complete your login to authenticate the CLI
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-[#2d2d2d] rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-[#2d2d2d] rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !sessionId}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Use regular login page instead
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CliLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CliLoginContent />
    </Suspense>
  )
}

