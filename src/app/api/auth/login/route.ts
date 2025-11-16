import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@shared/index'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find user
    const userService = new UserService()
    const user = await userService.findByEmail(email)

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has a password (OAuth users don't have passwords)
    if (!user.password) {
      return NextResponse.json(
        { message: 'This account uses OAuth login. Please use Google sign in.' },
        { status: 401 }
      )
    }

    // Verify password using bcrypt
    const bcrypt = await import('bcryptjs')
    const isPasswordValid = await bcrypt.default.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate a simple token (in production, use JWT or similar)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
