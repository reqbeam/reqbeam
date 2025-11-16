import { NextRequest, NextResponse } from 'next/server'
import { EnvironmentService } from '@shared/index'
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

    const environmentService = new EnvironmentService()
    const activatedEnvironment = await environmentService.activateEnvironment(environmentId, user.id)

    return NextResponse.json(activatedEnvironment)
  } catch (error) {
    console.error('Error activating environment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
