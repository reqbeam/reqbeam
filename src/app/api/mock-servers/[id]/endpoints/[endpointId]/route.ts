import { NextRequest, NextResponse } from 'next/server'
import { prisma, MockServerService } from '@postmind/db'
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

    // Update endpoint using service
    const mockServerService = new MockServerService(prisma)
    const updatedEndpoint = await mockServerService.updateMockEndpoint(id, endpointId, user.id, {
      method: method ? method.toUpperCase() : undefined,
      path,
      response,
      statusCode,
      headers: headers !== undefined ? (headers ? JSON.stringify(headers) : null) : undefined,
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

    // Delete endpoint using service
    const mockServerService = new MockServerService(prisma)
    await mockServerService.deleteMockEndpoint(id, endpointId, user.id)

    return NextResponse.json({ message: 'Endpoint deleted successfully' })
  } catch (error) {
    console.error('Error deleting mock endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

