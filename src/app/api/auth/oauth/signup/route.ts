import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'

/**
 * OAuth signup endpoint for syncing OAuth users
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name, provider } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if this is a sync call from auth server
    const isSyncCall = request.headers.get('x-sync-from') === 'auth-server'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    // If user exists and this is a sync call, return success
    if (existingUser && isSyncCall) {
      return NextResponse.json(
        { message: 'User already exists (synced)' },
        { status: 200 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    // Create OAuth user (no password)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: null, // OAuth users don't have passwords
      },
    })

    // Also sync to auth server
    if (!isSyncCall) {
      try {
        await fetch(`${AUTH_SERVER_URL}/api/auth/oauth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-from': 'main-app',
          },
          body: JSON.stringify({ email, name, provider }),
        })
      } catch (authServerError) {
        console.warn('Failed to sync OAuth user to auth server:', authServerError)
      }
    }

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('OAuth signup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

