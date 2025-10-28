import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// POST /api/workspaces/initialize - Initialize default workspace for user
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Check if user already has workspaces
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        ownerId: user.id,
      },
    })

    if (existingWorkspace) {
      return NextResponse.json(
        { message: 'User already has workspaces', workspace: existingWorkspace },
        { status: 200 }
      )
    }

    // Create default workspace
    console.log('Initializing workspace for userId:', user.id)
    const defaultWorkspace = await prisma.workspace.create({
      data: {
        name: 'My Workspace',
        description: 'Default workspace',
        owner: { connect: { id: user.id } },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: true,
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
    })

    // Migrate existing data to default workspace
    await prisma.$transaction([
      // Update collections
      prisma.collection.updateMany({
        where: {
          userId: user.id,
          workspaceId: null,
        },
        data: {
          workspaceId: defaultWorkspace.id,
        },
      }),
      // Update requests
      prisma.request.updateMany({
        where: {
          userId: user.id,
          workspaceId: null,
        },
        data: {
          workspaceId: defaultWorkspace.id,
        },
      }),
      // Update environments
      prisma.environment.updateMany({
        where: {
          userId: user.id,
          workspaceId: null,
        },
        data: {
          workspaceId: defaultWorkspace.id,
        },
      }),
      // Update tabs
      prisma.tab.updateMany({
        where: {
          userId: user.id,
          workspaceId: null,
        },
        data: {
          workspaceId: defaultWorkspace.id,
        },
      }),
    ])

    return NextResponse.json(
      { message: 'Default workspace created', workspace: defaultWorkspace },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error initializing workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

