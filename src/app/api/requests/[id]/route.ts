import { NextRequest, NextResponse } from 'next/server'
import { RequestService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requestId } = await params
    const body = await request.json()
    const { name, method, url, headers, body: reqBody, bodyType, auth, collectionId } = body

    const requestService = new RequestService()
    const updatedRequest = await requestService.updateRequest(requestId, user.id, {
      name,
      method,
      url,
      headers,
      body: reqBody,
      bodyType,
      auth,
      collectionId,
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating request:', error)
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

    const { id: requestId } = await params

    const requestService = new RequestService()
    await requestService.deleteRequest(requestId, user.id)

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

