import { NextRequest, NextResponse } from 'next/server'
import { RequestService } from '@shared/index'
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

    const requestService = new RequestService()
    const newRequest = await requestService.createRequest({
      name,
      method,
      url,
      headers,
      body: reqBody,
      bodyType: bodyType || 'json',
      collectionId,
      userId: user.id,
      workspaceId,
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

