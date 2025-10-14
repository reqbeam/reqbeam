import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // Deactivate all other environments for this user
    await prisma.environment.updateMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Activate the selected environment
    await prisma.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        isActive: true,
      },
    })

    return NextResponse.json({ message: 'Environment activated successfully' })
  } catch (error) {
    console.error('Error activating environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


