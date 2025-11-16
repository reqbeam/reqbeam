import { NextRequest, NextResponse } from 'next/server'
import { prisma, WorkspaceService } from '@postmind/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/workspaces - List all user workspaces
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceService = new WorkspaceService(prisma)
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

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      )
    }

    const workspaceService = new WorkspaceService(prisma)
    const workspace = await workspaceService.createWorkspace(user.id, {
      name: name.trim(),
      description: description?.trim(),
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error: any) {
    console.error('Error creating workspace:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

