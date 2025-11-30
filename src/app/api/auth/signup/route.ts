import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma, UserService } from '@reqbeam/db'
import { validatePassword } from '@/utils/passwordValidation'

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: 'Password validation failed', errors: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Check if this is a sync call from auth server
    const isSyncCall = request.headers.get('x-sync-from') === 'auth-server'

    // Check if user already exists
    const userService = new UserService(prisma)
    const existingUser = await userService.getUserByEmail(email)

    // If user exists and this is a sync call, return success (user already synced)
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in main database
    const user = await userService.createUser({
      name,
      email,
      password: hashedPassword,
    })

    // Also create user in auth server database (skip if this is a sync call from auth server)
    if (!isSyncCall) {
      try {
        await fetch(`${AUTH_SERVER_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-from': 'main-app',
          },
          body: JSON.stringify({ name, email, password }),
        })
        // Note: We don't fail if auth server is unavailable, user is already created in main DB
      } catch (authServerError) {
        console.warn('Failed to sync user to auth server:', authServerError)
        // Continue anyway - user is created in main database
      }
    }

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
