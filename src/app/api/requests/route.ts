import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, method, url, headers, body: reqBody, bodyType, collectionId } = body

    if (!name || !method || !url) {
      return NextResponse.json(
        { error: 'Request name, method, and URL are required' },
        { status: 400 }
      )
    }

    // Verify the collection belongs to the user if collectionId is provided
    if (collectionId) {
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
    }

    // Create the request
    const newRequest = await prisma.request.create({
      data: {
        name,
        method,
        url,
        headers: headers ? JSON.stringify(headers) : null,
        body: reqBody || null,
        bodyType: bodyType || 'json',
        collectionId: collectionId || null,
        userId: user.id,
      },
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

