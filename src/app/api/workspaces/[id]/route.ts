import { NextRequest, NextResponse } from 'next/server'
import { prisma, WorkspaceService } from '@reqbeam/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/workspaces/:id - Get specific workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const workspaceService = new WorkspaceService(prisma)
    const workspace = await workspaceService.getWorkspace(id, user.id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/workspaces/:id - Update workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Workspace name cannot be empty' },
        { status: 400 }
      )
    }

    const workspaceService = new WorkspaceService(prisma)
    const updatedWorkspace = await workspaceService.updateWorkspace(id, user.id, {
      name: name?.trim(),
      description: description?.trim(),
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error: any) {
    console.error('Error updating workspace:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/workspaces/:id - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const workspaceService = new WorkspaceService(prisma)
    await workspaceService.deleteWorkspace(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workspace:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

