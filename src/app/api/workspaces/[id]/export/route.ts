import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService, CollectionService, RequestService, EnvironmentService, HistoryService } from '@shared/index'
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

    // Verify workspace access
    const workspaceService = new WorkspaceService()
    const workspace = await workspaceService.getWorkspace(workspaceId, user.id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch related data using services
    const collectionService = new CollectionService()
    const requestService = new RequestService()
    const environmentService = new EnvironmentService()
    const historyService = new HistoryService()

    const collections = await collectionService.getCollections(user.id, workspaceId)
    const environments = await environmentService.getEnvironments(user.id, workspaceId)
    
    // Get requests for each collection
    const collectionsWithRequests = await Promise.all(
      collections.map(async (collection) => {
        const requests = await requestService.getRequests(user.id, collection.id)
        return {
          ...collection,
          requests: requests.map(req => ({
            name: req.name,
            method: req.method,
            url: req.url,
            headers: req.headers ? (typeof req.headers === 'string' ? JSON.parse(req.headers) : req.headers) : undefined,
            body: req.body || undefined,
            bodyType: req.bodyType || 'json',
            auth: req.auth ? (typeof req.auth === 'string' ? JSON.parse(req.auth) : req.auth) : undefined,
          })),
        }
      })
    )

    // Get history if requested
    let history: any[] = []
    if (includeHistory) {
      const historyEntries = await historyService.getHistory(user.id, workspaceId, undefined, 1000)
      history = historyEntries.map(hist => ({
        method: hist.method,
        url: hist.url,
        statusCode: hist.statusCode,
        response: null, // ApiHistory doesn't have response field
        headers: null,
        duration: hist.duration,
        size: null,
        error: hist.error,
        createdAt: hist.createdAt.toISOString(),
      }))
    }

    // Build export data
    const exportData = {
      workspace: {
        name: workspace.name,
        description: workspace.description || null,
        exportedAt: new Date().toISOString(),
        collections: collectionsWithRequests.map(collection => ({
          name: collection.name,
          description: collection.description || null,
          requests: collection.requests,
        })),
        environments: environments.map(env => ({
          name: env.name,
          variables: typeof env.variables === 'string' ? JSON.parse(env.variables) : env.variables,
          isActive: env.isActive,
        })),
        ...(includeHistory && history.length > 0 && { history }),
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

