import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// Helper to parse variables JSON string to object
function parseVariables(variables: string): Record<string, string> {
  try {
    return variables ? JSON.parse(variables) : {}
  } catch {
    return {}
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: environmentId } = await params

    // Check if environment belongs to user
    const environment = await prisma.environment.findFirst({
      where: {
        id: environmentId,
        userId: user.id,
      },
    })

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      )
    }

    // Deactivate all other environments for this user in the same workspace
    // If environment has no workspace, only deactivate other environments with no workspace
    const workspaceFilter = environment.workspaceId 
      ? { workspaceId: environment.workspaceId }
      : { workspaceId: null }
    
    await prisma.environment.updateMany({
      where: {
        userId: user.id,
        isActive: true,
        ...workspaceFilter,
      },
      data: {
        isActive: false,
      },
    })

    // Activate the selected environment
    const activatedEnvironment = await prisma.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        isActive: true,
      },
    })

    return NextResponse.json({
      ...activatedEnvironment,
      variables: parseVariables(activatedEnvironment.variables),
    })
  } catch (error) {
    console.error('Error activating environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
