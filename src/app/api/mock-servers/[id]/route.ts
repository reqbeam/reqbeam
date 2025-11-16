import { NextRequest, NextResponse } from 'next/server'
import { MockServerService } from '@shared/index'
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

    const mockServerService = new MockServerService()
    const mockServer = await mockServerService.getMockServer(id, user.id)

    if (!mockServer) {
      return NextResponse.json(
        { error: 'Mock server not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mockServer)
  } catch (error) {
    console.error('Error fetching mock server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
      name,
      responseDelay,
      defaultStatusCode,
      isRunning,
    } = body

    // Update mock server
    const mockServerService = new MockServerService()
    try {
      const updatedMockServer = await mockServerService.updateMockServer(id, user.id, {
        name,
        responseDelay,
        defaultStatusCode,
        isRunning,
      })
      return NextResponse.json(updatedMockServer)
    } catch (error: any) {
      if (error.message === 'Mock server not found') {
        return NextResponse.json(
          { error: 'Mock server not found' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating mock server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete mock server (endpoints will be cascade deleted)
    const mockServerService = new MockServerService()
    try {
      await mockServerService.deleteMockServer(id, user.id)
      return NextResponse.json({ message: 'Mock server deleted successfully' })
    } catch (error: any) {
      if (error.message === 'Mock server not found') {
        return NextResponse.json(
          { error: 'Mock server not found' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error deleting mock server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

