import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Dashboard from '@/components/Dashboard'

// Mark as dynamic since it uses session and client components with context
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const { workspaceId } = await params
  return <Dashboard workspaceId={workspaceId} />
}

