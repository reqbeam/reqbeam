import { NextRequest, NextResponse } from 'next/server'
import { CollectionService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspaceId from query params or header
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id') || undefined

    const collectionService = new CollectionService()
    const collections = await collectionService.getCollections(user.id, workspaceId)

    return NextResponse.json(collections)
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, collectionId, workspaceId, request: requestData } = body

    const collectionService = new CollectionService()
    const { RequestService } = await import('../../../../shared/index.js')
    const requestService = new RequestService()

    // If saving a request to a collection
    if (collectionId && requestData) {
      if (!requestData.name || !requestData.method || !requestData.url) {
        return NextResponse.json(
          { error: 'Request name, method, and URL are required' },
          { status: 400 }
        )
      }

      // Get collection to get workspaceId
      const collection = await collectionService.getCollection(collectionId, user.id)
      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        )
      }

      // Create the request
      const newRequest = await requestService.createRequest({
        name: requestData.name,
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
        bodyType: requestData.bodyType || 'json',
        auth: requestData.auth,
        collectionId: collectionId,
        userId: user.id,
        workspaceId: collection.workspaceId || undefined,
      })

      return NextResponse.json(newRequest, { status: 201 })
    }

    // If creating a new collection
    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    const collection = await collectionService.createCollection({
      name,
      description,
      userId: user.id,
      workspaceId: workspaceId || undefined,
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Error creating collection or request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
