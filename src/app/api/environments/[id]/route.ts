import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const environmentId = params.id
    const { name, variables } = await request.json()

    // Check if environment belongs to user
    const environment = await prisma.environment.findFirst({
      where: {
        id: environmentId,
        userId: session.user.id,
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
        name,
        variables: variables || {},
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const environmentId = params.id

    // Check if environment belongs to user
    const environment = await prisma.environment.findFirst({
      where: {
        id: environmentId,
        userId: session.user.id,
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


