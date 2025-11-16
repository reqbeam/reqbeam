import { NextRequest, NextResponse } from 'next/server'
import { prisma, WorkspaceService, HistoryService } from '@postmind/db'
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
    const workspaceService = new WorkspaceService(prisma)
    const workspace = await workspaceService.getWorkspace(workspaceId, user.id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Migrate history entries using service
    const historyService = new HistoryService(prisma)
    const migratedCount = await historyService.migrateHistoryToWorkspace(user.id, workspaceId)

    return NextResponse.json({
      message: 'History migrated successfully',
      migratedCount,
    })
  } catch (error) {
    console.error('Error migrating history:', error)
    return NextResponse.json(
      { error: 'Failed to migrate history' },
      { status: 500 }
    )
  }
}

