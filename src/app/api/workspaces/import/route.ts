import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService, CollectionService, RequestService, EnvironmentService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'
import yaml from 'js-yaml'

interface ImportedWorkspace {
  workspace: {
    name: string
    description?: string
    collections?: Array<{
      name: string
      description?: string
      requests?: Array<{
        name: string
        method: string
        url: string
        headers?: Record<string, string>
        body?: string
        bodyType?: string
        auth?: any
      }>
    }>
    environments?: Array<{
      name: string
      variables: Record<string, string>
      isActive?: boolean
    }>
    history?: Array<{
      requestId: string
      statusCode?: number
      response?: string
      headers?: Record<string, string>
      duration?: number
      size?: number
      error?: string
      createdAt: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

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

    // Parse file
    let importedData: ImportedWorkspace
    try {
      if (fileType === 'yaml') {
        importedData = yaml.load(fileContent) as ImportedWorkspace
      } else {
        importedData = JSON.parse(fileContent) as ImportedWorkspace
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to parse file: ${error.message}` },
        { status: 400 }
      )
    }

    if (!importedData.workspace) {
      return NextResponse.json(
        { error: 'Invalid workspace file format' },
        { status: 400 }
      )
    }

    const workspaceData = importedData.workspace

    // Create new workspace
    const workspaceService = new WorkspaceService()
    const workspace = await workspaceService.createWorkspace({
      name: workspaceData.name || 'Imported Workspace',
      description: workspaceData.description || undefined,
      ownerId: user.id,
    })

    const stats = {
      collections: 0,
      requests: 0,
      environments: 0,
      history: 0,
    }

    // Import collections
    const collectionService = new CollectionService()
    const requestService = new RequestService()
    const environmentService = new EnvironmentService()

    if (workspaceData.collections) {
      for (const collectionData of workspaceData.collections) {
        try {
          const collection = await collectionService.createCollection({
            name: collectionData.name,
            description: collectionData.description || undefined,
            userId: user.id,
            workspaceId: workspace.id,
          })
          stats.collections++

          // Import requests
          if (collectionData.requests) {
            for (const requestData of collectionData.requests) {
              try {
                await requestService.createRequest({
                  name: requestData.name,
                  method: requestData.method,
                  url: requestData.url,
                  headers: requestData.headers
                    ? (typeof requestData.headers === 'string' ? requestData.headers : JSON.stringify(requestData.headers))
                    : undefined,
                  body: requestData.body || undefined,
                  bodyType: requestData.bodyType || 'json',
                  auth: requestData.auth
                    ? (typeof requestData.auth === 'string' ? requestData.auth : JSON.stringify(requestData.auth))
                    : undefined,
                  collectionId: collection.id,
                  userId: user.id,
                  workspaceId: workspace.id,
                })
                stats.requests++
              } catch (error) {
                console.error(`Error importing request "${requestData.name}":`, error)
                // Continue with other requests
              }
            }
          }
        } catch (error) {
          console.error(`Error importing collection "${collectionData.name}":`, error)
          // Continue with other collections
        }
      }
    }

    // Import environments
    if (workspaceData.environments) {
      for (const envData of workspaceData.environments) {
        try {
          await environmentService.createEnvironment({
            name: envData.name,
            variables: envData.variables || {},
            userId: user.id,
            workspaceId: workspace.id,
            isActive: envData.isActive || false,
          })
          stats.environments++
        } catch (error) {
          console.error(`Error importing environment "${envData.name}":`, error)
          // Continue with other environments
        }
      }
    }

    // Import history (optional - requires matching request IDs)
    // Note: History is tied to specific request IDs, so we'll skip it for now
    // as the imported requests have new IDs. Future enhancement could map old IDs to new ones.

    return NextResponse.json({
      workspace,
      stats,
      message: `Successfully imported workspace with ${stats.collections} collections, ${stats.requests} requests, and ${stats.environments} environments`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

