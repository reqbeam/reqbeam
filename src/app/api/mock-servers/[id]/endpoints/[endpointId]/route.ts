import { NextRequest, NextResponse } from 'next/server'
import { MockServerService } from '@shared/index'
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

    const mockServerService = new MockServerService()
    try {
      const updatedEndpoint = await mockServerService.updateEndpoint(endpointId, id, user.id, {
        method,
        path,
        response,
        statusCode,
        headers: headers ? JSON.stringify(headers) : undefined,
      })
      return NextResponse.json(updatedEndpoint)
    } catch (error: any) {
      if (error.message === 'Mock server not found' || error.message === 'Endpoint not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      throw error
    }
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

    const mockServerService = new MockServerService()
    try {
      await mockServerService.deleteEndpoint(endpointId, id, user.id)
      return NextResponse.json({ message: 'Endpoint deleted successfully' })
    } catch (error: any) {
      if (error.message === 'Mock server not found' || error.message === 'Endpoint not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error deleting mock endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

