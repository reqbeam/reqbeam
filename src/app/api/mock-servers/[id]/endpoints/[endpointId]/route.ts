import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, endpointId } = await params
    const body = await request.json()
    const {
      method,
      path,
      response,
      statusCode,
      headers,
    } = body

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

    // Verify endpoint belongs to mock server
    const existingEndpoint = await prisma.mockEndpoint.findFirst({
      where: {
        id: endpointId,
        mockServerId: id,
      },
    })

    if (!existingEndpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    // Update endpoint
    const updatedEndpoint = await prisma.mockEndpoint.update({
      where: {
        id: endpointId,
      },
      data: {
        ...(method && { method: method.toUpperCase() }),
        ...(path && { path }),
        ...(response !== undefined && { response }),
        ...(statusCode !== undefined && { statusCode }),
        ...(headers !== undefined && { headers: headers ? JSON.stringify(headers) : null }),
      },
    })

    return NextResponse.json(updatedEndpoint)
  } catch (error) {
    console.error('Error updating mock endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, endpointId } = await params

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

    // Verify endpoint belongs to mock server
    const existingEndpoint = await prisma.mockEndpoint.findFirst({
      where: {
        id: endpointId,
        mockServerId: id,
      },
    })

    if (!existingEndpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    // Delete endpoint
    await prisma.mockEndpoint.delete({
      where: {
        id: endpointId,
      },
    })

    return NextResponse.json({ message: 'Endpoint deleted successfully' })
  } catch (error) {
    console.error('Error deleting mock endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

