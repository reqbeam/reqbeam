import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

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
    const updatedEnvironment = await prisma.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        ...(name && { name }),
        ...(variables !== undefined && { variables: variables || {} }),
      },
    })

    return NextResponse.json(updatedEnvironment)
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
