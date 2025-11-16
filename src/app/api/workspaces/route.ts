import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/workspaces - List all user workspaces
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceService = new WorkspaceService()
    const workspaces = await workspaceService.getWorkspaces(user.id)

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    const workspaceService = new WorkspaceService()
    const workspace = await workspaceService.createWorkspace({
      name,
      description,
      ownerId: user.id,
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

