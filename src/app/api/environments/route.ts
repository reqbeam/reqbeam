import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspaceId from query params or header
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id')

    const whereClause: any = {
      userId: user.id,
    }

    // Filter by workspace if workspaceId is provided
    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const environments = await prisma.environment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(environments)
  } catch (error) {
    console.error('Error fetching environments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, variables, workspaceId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Environment name is required' },
        { status: 400 }
      )
    }

    // Count existing environments for this workspace
    const whereClause: any = {
      userId: user.id,
    }
    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const existingEnvironments = await prisma.environment.count({
      where: whereClause,
    })

    const environment = await prisma.environment.create({
      data: {
        name,
        variables: variables || {},
        userId: user.id,
        workspaceId: workspaceId || null,
        isActive: existingEnvironments === 0, // First environment is active by default
      },
    })

    return NextResponse.json(environment, { status: 201 })
  } catch (error) {
    console.error('Error creating environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


