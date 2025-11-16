import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@shared/index'
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
    const workspaceService = new WorkspaceService()
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

    const workspaceService = new WorkspaceService()
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Workspace name cannot be empty' },
          { status: 400 }
        )
      }
    }

    const updatedWorkspace = await workspaceService.updateWorkspace(id, user.id, {
      name: name !== undefined ? name.trim() : undefined,
      description: description !== undefined ? description?.trim() || null : undefined,
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
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

    // Verify ownership (only owner can delete)
    const { id } = await params
    const workspaceService = new WorkspaceService()
    await workspaceService.deleteWorkspace(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

