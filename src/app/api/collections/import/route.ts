import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'
import { normalizeCollection } from '@/lib/importExportService'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspaceId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    const fileName = file.name
    const fileType = fileName.endsWith('.yaml') || fileName.endsWith('.yml') ? 'yaml' : 'json'

    // Parse and normalize collection
    let normalizedCollection
    try {
      normalizedCollection = normalizeCollection(fileContent, fileType, fileName)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to parse file: ${error.message}` },
        { status: 400 }
      )
    }

    // Verify workspace access if workspaceId is provided
    if (workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id
                }
              }
            }
          ]
        }
      })

      if (!workspace) {
        return NextResponse.json(
          { error: 'Workspace not found or access denied' },
          { status: 403 }
        )
      }
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name: normalizedCollection.name,
        description: normalizedCollection.description || null,
        userId: user.id,
        workspaceId: workspaceId || null,
      },
    })

    // Create requests
    const createdRequests = []
    for (const request of normalizedCollection.requests) {
      try {
        const createdRequest = await prisma.request.create({
          data: {
            name: request.name,
            method: request.method,
            url: request.url,
            headers: request.headers
              ? (typeof request.headers === 'string' ? request.headers : JSON.stringify(request.headers))
              : null,
            body: request.body || null,
            bodyType: request.bodyType || 'json',
            auth: request.auth
              ? (typeof request.auth === 'string' ? request.auth : JSON.stringify(request.auth))
              : null,
            collectionId: collection.id,
            userId: user.id,
            workspaceId: workspaceId || null,
          },
        })
        createdRequests.push(createdRequest)
      } catch (error) {
        console.error(`Error creating request "${request.name}":`, error)
        // Continue with other requests even if one fails
      }
    }

    return NextResponse.json({
      collection,
      requests: createdRequests,
      importedCount: createdRequests.length,
      totalCount: normalizedCollection.requests.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing collection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

