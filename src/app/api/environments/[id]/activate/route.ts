import { NextRequest, NextResponse } from 'next/server'
import { prisma, EnvironmentService } from '@postmind/db'
import { getAuthenticatedUser } from '@/lib/apiAuth'

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

    const environmentService = new EnvironmentService(prisma)
    const activatedEnvironment = await environmentService.activateEnvironment(
      environmentId,
      user.id
    )

    return NextResponse.json(activatedEnvironment)
  } catch (error: any) {
    console.error('Error activating environment:', error)
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
