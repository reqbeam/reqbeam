import { NextRequest, NextResponse } from 'next/server'
import { prisma, EnvironmentService } from '@reqbeam/db'
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

    const environmentService = new EnvironmentService(prisma)
    const environments = await environmentService.getEnvironments(user.id, {
      workspaceId: workspaceId || undefined,
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

    const environmentService = new EnvironmentService(prisma)
    const environment = await environmentService.createEnvironment(user.id, {
      name,
      variables: variables || {},
      workspaceId: workspaceId || undefined,
    })

    return NextResponse.json(environment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating environment:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


