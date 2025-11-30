import { NextRequest, NextResponse } from 'next/server'
import { prisma, RequestService } from '@reqbeam/db'
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

    const requestService = new RequestService(prisma)
    const updatedRequest = await requestService.updateRequest(
      requestId,
      user.id,
      {
        name,
        method,
        url,
        headers,
        body: reqBody,
        bodyType,
        auth,
        collectionId,
      }
    )

    return NextResponse.json(updatedRequest)
  } catch (error: any) {
    console.error('Error updating request:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 400 }
      )
    }
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

    const requestService = new RequestService(prisma)
    await requestService.deleteRequest(requestId, user.id)

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting request:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

