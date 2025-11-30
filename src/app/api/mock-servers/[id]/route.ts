import { NextRequest, NextResponse } from 'next/server'
import { prisma, MockServerService } from '@reqbeam/db'
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

    const mockServerService = new MockServerService(prisma)
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

    // Update mock server using service
    const mockServerService = new MockServerService(prisma)
    const updatedMockServer = await mockServerService.updateMockServer(id, user.id, {
      name,
      responseDelay,
      defaultStatusCode,
      isRunning,
    })

    return NextResponse.json(updatedMockServer)
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

    // Delete mock server using service
    const mockServerService = new MockServerService(prisma)
    await mockServerService.deleteMockServer(id, user.id)

    return NextResponse.json({ message: 'Mock server deleted successfully' })
  } catch (error) {
    console.error('Error deleting mock server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

