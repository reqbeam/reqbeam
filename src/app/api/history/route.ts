import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/history - Fetch all history entries
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') // Optional filter: "CLI" or "WEB"
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {
      userId: user.id,
    }

    if (source) {
      where.source = source
    }

    // Filter by workspace if provided
    // Include both workspace-specific entries AND legacy entries (workspaceId: null)
    if (workspaceId) {
      where.OR = [
        { workspaceId: workspaceId },
        { workspaceId: null }  // Include legacy entries without workspace
      ]
    }

    const history = await prisma.apiHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
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

    // Validate source
    if (!['CLI', 'WEB'].includes(source)) {
      return NextResponse.json(
        { error: 'Source must be either "CLI" or "WEB"' },
        { status: 400 }
      )
    }

    // Create history entry
    const historyEntry = await prisma.apiHistory.create({
      data: {
        method: method.toUpperCase(),
        url,
        statusCode: statusCode || null,
        source,
        duration: duration || null,
        error: error || null,
        userId: user.id,
        workspaceId: workspaceId || null,
      },
    })

    return NextResponse.json(historyEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating history entry:', error)
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

    const where: any = {
      userId: user.id,
    }

    // If workspaceId provided, only delete history for that workspace
    if (workspaceId) {
      where.workspaceId = workspaceId
    }

    await prisma.apiHistory.deleteMany({ where })
    
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

