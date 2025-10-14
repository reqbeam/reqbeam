import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collections = await prisma.collection.findMany({
      where: {
        userId: session.user.id,
      },
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, collectionId, request: requestData } = body

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
          userId: session.user.id,
        },
      })

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        )
      }

      // Create the request
      const newRequest = await prisma.request.create({
        data: {
          name: requestData.name,
          method: requestData.method,
          url: requestData.url,
          headers: requestData.headers ? JSON.stringify(requestData.headers) : null,
          body: requestData.body || null,
          bodyType: requestData.bodyType || 'json',
          collectionId: collectionId,
          userId: session.user.id,
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
        userId: session.user.id,
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

