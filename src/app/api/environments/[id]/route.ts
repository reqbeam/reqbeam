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

export async function GET(
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

    return NextResponse.json({
      ...environment,
      variables: parseVariables(environment.variables),
    })
  } catch (error) {
    console.error('Error fetching environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: environmentId } = await params
    const { name, variables } = await request.json()

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

    // Update environment
    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name
    }
    if (variables !== undefined) {
      updateData.variables = JSON.stringify(variables || {})
    }

    const updatedEnvironment = await prisma.environment.update({
      where: {
        id: environmentId,
      },
      data: updateData,
    })

    return NextResponse.json({
      ...updatedEnvironment,
      variables: parseVariables(updatedEnvironment.variables),
    })
  } catch (error) {
    console.error('Error updating environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete environment
    await prisma.environment.delete({
      where: {
        id: environmentId,
      },
    })

    return NextResponse.json({ message: 'Environment deleted successfully' })
  } catch (error) {
    console.error('Error deleting environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
