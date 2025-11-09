import { NextRequest, NextResponse } from 'next/server'

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'

/**
 * Login endpoint that uses the auth server on port 4000
 * This is an additional authentication option alongside the regular /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call auth server on port 4000
    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Login failed' },
          { status: response.status }
        )
      }

      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Auth server connection error:', fetchError)
      return NextResponse.json(
        { message: 'Unable to connect to authentication server' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

