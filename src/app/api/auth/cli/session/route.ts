import { NextRequest, NextResponse } from 'next/server'
import { prisma, UserService } from '@reqbeam/db'

// In-memory store for CLI login sessions (in production, use Redis or database)
const cliSessions = new Map<string, {
  sessionId: string
  status: 'pending' | 'authenticated' | 'expired'
  token?: string
  user?: {
    id: string
    email: string
    name: string | null
  }
  expiresAt?: string
  createdAt: number
}>()

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now()
  // Use keys() for ES5 compatibility
  const sessionIds = Array.from(cliSessions.keys())
  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i]
    const session = cliSessions.get(sessionId)
    if (session && now - session.createdAt > 10 * 60 * 1000) { // 10 minutes expiry
      cliSessions.delete(sessionId)
    }
  }
}, 5 * 60 * 1000)

/**
 * Create a new CLI login session
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Create new session
    cliSessions.set(sessionId, {
      sessionId,
      status: 'pending',
      createdAt: Date.now(),
    })

    return NextResponse.json({
      sessionId,
      status: 'pending',
      message: 'Session created. Please complete login in browser.',
    })
  } catch (error) {
    console.error('Error creating CLI session:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get session status (for polling)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = cliSessions.get(sessionId)

    if (!session) {
      return NextResponse.json(
        { message: 'Session not found or expired' },
        { status: 404 }
      )
    }

    // Check if session expired
    if (Date.now() - session.createdAt > 10 * 60 * 1000) {
      cliSessions.delete(sessionId)
      return NextResponse.json(
        { message: 'Session expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      status: session.status,
      token: session.token,
      user: session.user,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error('Error getting CLI session:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update session with authentication data (called after successful login)
 */
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, token, user, expiresAt } = await request.json()

    if (!sessionId || !token || !user) {
      return NextResponse.json(
        { message: 'Session ID, token, and user are required' },
        { status: 400 }
      )
    }

    const session = cliSessions.get(sessionId)

    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      )
    }

    // Update session with auth data
    session.status = 'authenticated'
    session.token = token
    session.user = user
    session.expiresAt = expiresAt

    return NextResponse.json({
      sessionId: session.sessionId,
      status: session.status,
      message: 'Authentication successful',
    })
  } catch (error) {
    console.error('Error updating CLI session:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

