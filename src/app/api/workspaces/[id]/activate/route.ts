import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// POST /api/workspaces/:id/activate - Set active workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this workspace
    const { id } = await params
    const workspaceService = new WorkspaceService()
    const workspace = await workspaceService.getWorkspace(id, user.id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Return the workspace data - the actual activation will be handled client-side
    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error activating workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

