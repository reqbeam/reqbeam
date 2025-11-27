import { NextRequest, NextResponse } from 'next/server'
import { prisma, WorkspaceService } from '@reqbeam/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'
import yaml from 'js-yaml'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'json') as 'json' | 'yaml'
    const includeHistory = searchParams.get('includeHistory') === 'true'

    // Get workspace for export using service
    const workspaceService = new WorkspaceService(prisma)
    const workspace = await workspaceService.getWorkspaceForExport(workspaceId, user.id, includeHistory)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Build export data
    const exportData = {
      workspace: {
        name: workspace.name,
        description: workspace.description,
        exportedAt: new Date().toISOString(),
        collections: (workspace.collections || []).map((collection: any) => ({
          name: collection.name,
          description: collection.description,
          requests: (collection.requests || []).map((req: any) => ({
            name: req.name,
            method: req.method,
            url: req.url,
            headers: req.headers ? (typeof req.headers === 'string' ? JSON.parse(req.headers) : req.headers) : undefined,
            body: req.body || undefined,
            bodyType: req.bodyType || 'json',
            auth: req.auth ? (typeof req.auth === 'string' ? JSON.parse(req.auth) : req.auth) : undefined,
          })),
        })),
        environments: (workspace.environments || []).map((env: any) => ({
          name: env.name,
          variables: typeof env.variables === 'string' ? JSON.parse(env.variables) : env.variables,
          isActive: env.isActive,
        })),
        ...(includeHistory && workspace.requestHistories && {
          history: (workspace.requestHistories || []).map((hist: any) => ({
            requestId: hist.requestId,
            statusCode: hist.statusCode,
            response: hist.response,
            headers: hist.headers ? (typeof hist.headers === 'string' ? JSON.parse(hist.headers) : hist.headers) : undefined,
            duration: hist.duration,
            size: hist.size,
            error: hist.error,
            createdAt: hist.createdAt.toISOString(),
          })),
        }),
      },
    }

    // Export in requested format
    let exportedContent: string
    const contentType = format === 'yaml' ? 'application/x-yaml' : 'application/json'
    const extension = format === 'yaml' ? 'yaml' : 'json'
    const filename = `${workspace.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`

    if (format === 'yaml') {
      exportedContent = yaml.dump(exportData, { indent: 2 })
    } else {
      exportedContent = JSON.stringify(exportData, null, 2)
    }

    return new NextResponse(exportedContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

