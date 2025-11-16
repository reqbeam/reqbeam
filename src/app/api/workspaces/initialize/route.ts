import { NextRequest, NextResponse } from 'next/server'
import { UserService, WorkspaceService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// POST /api/workspaces/initialize - Initialize default workspace for user
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists in database
    const userService = new UserService()
    const dbUser = await userService.findById(user.id)
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Check if user already has workspaces
    const workspaceService = new WorkspaceService()
    const hasWorkspaces = await workspaceService.hasWorkspaces(user.id)

    if (hasWorkspaces) {
      const workspaces = await workspaceService.getWorkspaces(user.id)
      return NextResponse.json(
        { message: 'User already has workspaces', workspace: workspaces[0] },
        { status: 200 }
      )
    }

    // Create default workspace
    console.log('Initializing workspace for userId:', user.id)
    const defaultWorkspace = await workspaceService.createWorkspace({
      name: 'My Workspace',
      description: 'Default workspace',
      ownerId: user.id,
    })

    // Migrate existing data to default workspace
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

