import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'
import { exportCollection } from '@/lib/importExportService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId } = await params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'json') as 'json' | 'yaml'

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: user.id,
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
            auth: true,
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Convert to export format
    const exportData = {
      name: collection.name,
      description: collection.description || undefined,
      requests: collection.requests.map(req => ({
        name: req.name,
        method: req.method,
        url: req.url,
        headers: req.headers ? (typeof req.headers === 'string' ? JSON.parse(req.headers) : req.headers) : undefined,
        body: req.body || undefined,
        bodyType: req.bodyType || 'json',
        auth: req.auth ? (typeof req.auth === 'string' ? JSON.parse(req.auth) : req.auth) : undefined,
      })),
    }

    const exportedContent = exportCollection(exportData, format)

    // Return file with appropriate headers
    const contentType = format === 'yaml' ? 'application/x-yaml' : 'application/json'
    const extension = format === 'yaml' ? 'yaml' : 'json'
    const filename = `${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`

    return new NextResponse(exportedContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting collection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

