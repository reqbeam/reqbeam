import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const whereClause: any = {
      userId: user.id,
    }

    // Filter by workspace if workspaceId is provided
    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const collections = await prisma.collection.findMany({
      where: whereClause,
      include: {
        requests: {
          select: {
            id: true,
            name: true,
            method: true,
            url: true,
            headers: true,
            body: true,
            bodyType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

      // Verify the collection belongs to the user
      const collection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: user.id,
        },
      })

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        )
      }

      // Create the request with workspaceId from collection
      const newRequest = await prisma.request.create({
        data: {
          name: requestData.name,
          method: requestData.method,
          url: requestData.url,
          headers: requestData.headers ? requestData.headers : undefined,
          body: requestData.body || null,
          bodyType: requestData.bodyType || 'json',
          collectionId: collectionId,
          userId: user.id,
          workspaceId: collection.workspaceId,
        },
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

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: user.id,
        workspaceId: workspaceId || null,
      },
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

