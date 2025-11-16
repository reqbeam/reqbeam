import { NextRequest, NextResponse } from 'next/server'
import { prisma, MockServerService, CollectionService } from '@postmind/db'
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

    const mockServerService = new MockServerService(prisma)
    const mockServers = await mockServerService.getMockServers(user.id, {
      workspaceId: workspaceId || undefined,
    })

    return NextResponse.json(mockServers)
  } catch (error) {
    console.error('Error fetching mock servers:', error)
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
    const {
      name,
      collectionId,
      workspaceId,
      responseDelay = 0,
      defaultStatusCode = 200,
      autoGenerateEndpoints = false,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Mock server name is required' },
        { status: 400 }
      )
    }

    // Verify collection belongs to user if provided
    let finalWorkspaceId = workspaceId
    if (collectionId) {
      const collectionService = new CollectionService(prisma)
      const collection = await collectionService.getCollection(collectionId, user.id)

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        )
      }

      finalWorkspaceId = finalWorkspaceId || collection.workspaceId || null
    }

    // Generate base URL with a unique mock ID
    const mockId = crypto.randomUUID().replace(/-/g, '').substring(0, 12)
    const baseUrl = `/api/mock/${mockId}`

    // Create mock server using service
    const mockServerService = new MockServerService(prisma)
    const mockServer = await mockServerService.createMockServer(
      user.id,
      {
        name,
        collectionId: collectionId || null,
        workspaceId: finalWorkspaceId || null,
        responseDelay,
        defaultStatusCode,
        isRunning: false,
      },
      baseUrl
    )

    // Auto-generate endpoints from collection if requested
    if (autoGenerateEndpoints && collectionId) {
      const collectionService = new CollectionService(prisma)
      const collection = await collectionService.getCollection(collectionId, user.id)

      if (collection && collection.requests && collection.requests.length > 0) {
        const endpoints = collection.requests.map((req) => {
          // Extract path from URL (remove domain if present)
          let path = req.url
          try {
            const urlObj = new URL(req.url)
            path = urlObj.pathname + urlObj.search
          } catch {
            // If URL parsing fails, use the whole URL as path
            if (!path.startsWith('/')) {
              path = '/' + path
            }
          }

          // Generate default response from request body or create a simple one
          let defaultResponse = req.body || '{}'
          try {
            // If body is JSON, use it; otherwise create a simple response
            if (req.bodyType === 'json' && req.body) {
              try {
                JSON.parse(req.body)
                defaultResponse = req.body
              } catch {
                defaultResponse = JSON.stringify({ message: 'Mock response', data: {} })
              }
            } else {
              defaultResponse = JSON.stringify({ message: 'Mock response', data: {} })
            }
          } catch {
            defaultResponse = JSON.stringify({ message: 'Mock response', data: {} })
          }

          return {
            mockServerId: mockServer.id,
            method: req.method,
            path: path,
            response: defaultResponse,
            statusCode: defaultStatusCode,
            headers: JSON.stringify({ 'Content-Type': 'application/json' }),
          }
        })

        await mockServerService.createMockEndpoints(endpoints)

        // Reload mock server with endpoints
        const updatedMockServer = await mockServerService.getMockServer(mockServer.id, user.id)

        return NextResponse.json(updatedMockServer, { status: 201 })
      }
    }

    return NextResponse.json(mockServer, { status: 201 })
  } catch (error) {
    console.error('Error creating mock server:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

