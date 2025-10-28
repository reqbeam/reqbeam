import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Migrate history entries without workspace to this workspace
    const result = await prisma.apiHistory.updateMany({
      where: {
        userId: user.id,
        workspaceId: null,
      },
      data: {
        workspaceId: workspaceId,
      },
    })

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

