import { NextRequest, NextResponse } from 'next/server'
import { prisma, CollectionService, RequestService } from '@reqbeam/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspaceId from query params or header
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id')

    const collectionService = new CollectionService(prisma)
    const collections = await collectionService.getCollections(user.id, {
      workspaceId: workspaceId || undefined,
    })

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

    // If saving a request to a collection
    if (collectionId && requestData) {
      if (!requestData.name || !requestData.method || !requestData.url) {
        return NextResponse.json(
          { error: 'Request name, method, and URL are required' },
          { status: 400 }
        )
      }

      const requestService = new RequestService(prisma)
      const newRequest = await requestService.createRequest(user.id, {
        name: requestData.name,
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
        bodyType: requestData.bodyType,
        auth: requestData.auth,
        collectionId: collectionId,
        workspaceId: workspaceId,
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

    const collectionService = new CollectionService(prisma)
    const collection = await collectionService.createCollection(user.id, {
      name,
      description,
      workspaceId: workspaceId || undefined,
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error: any) {
    console.error('Error creating collection or request:', error)
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
