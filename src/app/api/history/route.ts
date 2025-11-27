import { NextRequest, NextResponse } from 'next/server'
import { prisma, HistoryService } from '@reqbeam/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/history - Fetch all history entries
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') as 'CLI' | 'WEB' | null
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id')
    const limit = parseInt(searchParams.get('limit') || '100')

    const historyService = new HistoryService(prisma)
    const history = await historyService.getApiHistory(user.id, {
      source: source || undefined,
      workspaceId: workspaceId || undefined,
      limit,
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

// POST /api/history - Add a new history entry
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { method, url, statusCode, source, duration, error, workspaceId } = body

    // Validate required fields
    if (!method || !url || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: method, url, source' },
        { status: 400 }
      )
    }

    const historyService = new HistoryService(prisma)
    const historyEntry = await historyService.createApiHistory(user.id, {
      method,
      url,
      statusCode,
      source,
      duration,
      error,
      workspaceId,
    })

    return NextResponse.json(historyEntry, { status: 201 })
  } catch (error: any) {
    console.error('Error creating history entry:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/history - Clear history for current workspace or user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    const historyService = new HistoryService(prisma)
    await historyService.clearApiHistory(user.id, workspaceId || undefined)
    
    return NextResponse.json({ 
      message: workspaceId 
        ? 'Workspace history cleared successfully' 
        : 'All history cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing history:', error)
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    )
  }
}

