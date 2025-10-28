import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: id,
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
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
    })

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

    // Verify ownership or editor permission
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: { in: ['owner', 'editor'] },
              },
            },
          },
        ],
      },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Workspace name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
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
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: id,
        ownerId: user.id,
      },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or insufficient permissions' },
        { status: 404 }
      )
    }

    await prisma.workspace.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

