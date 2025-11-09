import { NextRequest, NextResponse } from 'next/server'

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'

/**
 * Token verification endpoint that uses the auth server on port 4000
 * Use this to verify JWT tokens issued by the auth server
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required', valid: false },
        { status: 401 }
      )
    }

    // Call auth server verification endpoint
    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Token verification failed', valid: false },
          { status: response.status }
        )
      }

      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Auth server connection error:', fetchError)
      return NextResponse.json(
        { message: 'Unable to connect to authentication server', valid: false },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}

