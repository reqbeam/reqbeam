import { NextRequest, NextResponse } from 'next/server'

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'

/**
 * Signup endpoint that uses the auth server on port 4000
 * This is an additional authentication option alongside the regular /api/auth/signup
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call auth server on port 4000
    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(
          { 
            message: data.message || 'Signup failed',
            errors: data.errors || undefined
          },
          { status: response.status }
        )
      }

      return NextResponse.json(data, { status: 201 })
    } catch (fetchError) {
      console.error('Auth server connection error:', fetchError)
      return NextResponse.json(
        { message: 'Unable to connect to authentication server' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

