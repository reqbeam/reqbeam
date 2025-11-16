import { NextRequest, NextResponse } from 'next/server'
import { prisma, RequestService } from '@postmind/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, method, url, headers, body: reqBody, bodyType, collectionId, workspaceId } = body

    if (!name || !method || !url) {
      return NextResponse.json(
        { error: 'Request name, method, and URL are required' },
        { status: 400 }
      )
    }

    const requestService = new RequestService(prisma)
    const newRequest = await requestService.createRequest(user.id, {
      name,
      method,
      url,
      headers,
      body: reqBody,
      bodyType,
      collectionId,
      workspaceId,
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error: any) {
    console.error('Error creating request:', error)
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

