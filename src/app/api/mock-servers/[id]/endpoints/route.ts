import { NextRequest, NextResponse } from 'next/server'
import { prisma, MockServerService } from '@postmind/db'
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

    // Get endpoints using service
    const mockServerService = new MockServerService(prisma)
    const endpoints = await mockServerService.getMockEndpoints(id, user.id)

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

    // Create endpoint using service
    const mockServerService = new MockServerService(prisma)
    await mockServerService.createMockEndpoints([{
      mockServerId: id,
      method: method.toUpperCase(),
      path,
      response: response || '{}',
      statusCode,
      headers: headers ? JSON.stringify(headers) : JSON.stringify({ 'Content-Type': 'application/json' }),
    }])

    // Get the created endpoint (we'll need to fetch it)
    const endpoints = await mockServerService.getMockEndpoints(id, user.id)
    const endpoint = endpoints.find(e => e.path === path && e.method === method.toUpperCase())
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Failed to create endpoint' },
        { status: 500 }
      )
    }

    return NextResponse.json(endpoint, { status: 201 })
  } catch (error) {
    console.error('Error creating mock endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

