import { NextRequest, NextResponse } from 'next/server'
import { prisma, CollectionService } from '@postmind/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId } = await params

    const collectionService = new CollectionService(prisma)
    await collectionService.deleteCollection(collectionId, user.id)

    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting collection:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId } = await params
    const body = await request.json()
    const { name, description } = body

    const collectionService = new CollectionService(prisma)
    const updatedCollection = await collectionService.updateCollection(
      collectionId,
      user.id,
      {
        name,
        description,
      }
    )

    return NextResponse.json(updatedCollection)
  } catch (error: any) {
    console.error('Error updating collection:', error)
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
