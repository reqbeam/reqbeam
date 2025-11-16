import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService, HistoryService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// POST /api/history/migrate - Migrate history entries to workspace
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    // Verify workspace belongs to user
    const workspaceService = new WorkspaceService()
    const workspace = await workspaceService.getWorkspace(workspaceId, user.id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Migrate history entries without workspace to this workspace
    const historyService = new HistoryService()
    const result = await historyService.migrateHistory(user.id, workspaceId)

    return NextResponse.json({
      message: 'History migrated successfully',
      migratedCount: result.count,
    })
  } catch (error) {
    console.error('Error migrating history:', error)
    return NextResponse.json(
      { error: 'Failed to migrate history' },
      { status: 500 }
    )
  }
}

