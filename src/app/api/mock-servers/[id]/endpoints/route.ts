import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify mock server belongs to user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!mockServer) {
      return NextResponse.json(
        { error: 'Mock server not found' },
        { status: 404 }
      )
    }

    const endpoints = await prisma.mockEndpoint.findMany({
      where: {
        mockServerId: id,
      },
      orderBy: [
        { method: 'asc' },
        { path: 'asc' },
      ],
    })

    return NextResponse.json(endpoints)
  } catch (error) {
    console.error('Error fetching mock endpoints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      method,
      path,
      response,
      statusCode = 200,
      headers,
    } = body

    if (!method || !path) {
      return NextResponse.json(
        { error: 'Method and path are required' },
        { status: 400 }
      )
    }

    // Verify mock server belongs to user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!mockServer) {
      return NextResponse.json(
        { error: 'Mock server not found' },
        { status: 404 }
      )
    }

    // Create endpoint
    const endpoint = await prisma.mockEndpoint.create({
      data: {
        mockServerId: id,
        method: method.toUpperCase(),
        path,
        response: response || null,
        statusCode,
        headers: headers ? JSON.stringify(headers) : JSON.stringify({ 'Content-Type': 'application/json' }),
      },
    })

    return NextResponse.json(endpoint, { status: 201 })
  } catch (error) {
    console.error('Error creating mock endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

