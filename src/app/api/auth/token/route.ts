import { NextRequest, NextResponse } from 'next/server'
import { prisma, UserService } from '@postmind/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    
    // Verify user exists
    const userService = new UserService(prisma)
    const user = await userService.getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

