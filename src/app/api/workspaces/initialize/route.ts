import { NextRequest, NextResponse } from 'next/server'
import { prisma, UserService, WorkspaceService, CollectionService, RequestService, EnvironmentService } from '@postmind/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// POST /api/workspaces/initialize - Initialize default workspace for user
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists in database
    const userService = new UserService(prisma)
    const dbUser = await userService.getUserById(user.id)
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Check if user already has workspaces
    const workspaceService = new WorkspaceService(prisma)
    const workspaces = await workspaceService.getWorkspaces(user.id)

    if (workspaces.length > 0) {
      return NextResponse.json(
        { message: 'User already has workspaces', workspace: workspaces[0] },
        { status: 200 }
      )
    }

    // Create default workspace
    console.log('Initializing workspace for userId:', user.id)
    const defaultWorkspace = await workspaceService.createWorkspace(user.id, {
      name: 'My Workspace',
      description: 'Default workspace',
    })

    // Migrate existing data to default workspace using service
    await workspaceService.migrateDataToWorkspace(user.id, defaultWorkspace.id)

    return NextResponse.json(
      { message: 'Default workspace created', workspace: defaultWorkspace },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error initializing workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

