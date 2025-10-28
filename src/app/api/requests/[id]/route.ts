import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const { name, method, url, headers, body: reqBody, bodyType, collectionId } = body

    // Check if request belongs to user
    const existingRequest = await prisma.request.findFirst({
      where: {
        id: requestId,
        userId: user.id,
      },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: {
        id: requestId,
      },
      data: {
        ...(name && { name }),
        ...(method && { method }),
        ...(url && { url }),
        ...(headers !== undefined && { headers: headers ? JSON.stringify(headers) : null }),
        ...(reqBody !== undefined && { body: reqBody }),
        ...(bodyType !== undefined && { bodyType }),
        ...(collectionId !== undefined && { collectionId }),
      },
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

    // Check if request belongs to user
    const existingRequest = await prisma.request.findFirst({
      where: {
        id: requestId,
        userId: user.id,
      },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Delete request
    await prisma.request.delete({
      where: {
        id: requestId,
      },
    })

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

