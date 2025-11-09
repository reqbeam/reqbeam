'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { storeAuthToken } from '@/utils/authToken'

function OAuthCallbackHandlerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const oauth = searchParams.get('oauth')

    if (token && oauth === 'true') {
      // Get user info from NextAuth session
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((session) => {
          if (session?.user) {
            // Store token in localStorage
            storeAuthToken(
              token,
              {
                id: session.user.id || '',
                email: session.user.email || '',
                name: session.user.name || null,
              },
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            )

            // Clean up URL
            router.replace('/')
          }
        })
        .catch((error) => {
          console.error('Failed to get session:', error)
          router.replace('/')
        })
    }
  }, [searchParams, router])

  return null
}

export default function OAuthCallbackHandler() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackHandlerContent />
    </Suspense>
  )
}

