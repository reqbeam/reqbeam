import { NextRequest, NextResponse } from 'next/server'
import { CollectionService } from '@shared/index'
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

    const collectionService = new CollectionService()
    await collectionService.deleteCollection(collectionId, user.id)

    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('Error deleting collection:', error)
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

    const collectionService = new CollectionService()
    const updatedCollection = await collectionService.updateCollection(collectionId, user.id, { name, description })

    return NextResponse.json(updatedCollection)
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
