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

    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        endpoints: {
          orderBy: {
            path: 'asc',
          },
        },
      },
    })

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

    // Check if mock server belongs to user
    const existingMockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingMockServer) {
      return NextResponse.json(
        { error: 'Mock server not found' },
        { status: 404 }
      )
    }

    // Update mock server
    const updatedMockServer = await prisma.mockServer.update({
      where: {
        id,
      },
      data: {
        ...(name && { name }),
        ...(responseDelay !== undefined && { responseDelay }),
        ...(defaultStatusCode !== undefined && { defaultStatusCode }),
        ...(isRunning !== undefined && { isRunning }),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        endpoints: true,
      },
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

    // Check if mock server belongs to user
    const existingMockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingMockServer) {
      return NextResponse.json(
        { error: 'Mock server not found' },
        { status: 404 }
      )
    }

    // Delete mock server (endpoints will be cascade deleted)
    await prisma.mockServer.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: 'Mock server deleted successfully' })
  } catch (error) {
    console.error('Error deleting mock server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

