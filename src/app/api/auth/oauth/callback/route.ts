import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeAuthToken } from '@/utils/authToken'

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'

// Mark as dynamic since it uses request headers/URL
export const dynamic = 'force-dynamic'

/**
 * OAuth callback handler that gets JWT token from auth server
 * This is called after successful OAuth login
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/signin?error=oauth_failed', request.url))
    }

    // Get JWT token from auth server for OAuth user
    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/oauth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          provider: 'google',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store token in a way that can be accessed by the client
        // We'll pass it via query param and handle in the page
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('token', data.token)
        redirectUrl.searchParams.set('oauth', 'true')
        
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Failed to get token from auth server:', error)
    }

    // If token fetch fails, still redirect (user is logged in via NextAuth)
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=oauth_failed', request.url))
  }
}


