import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Dashboard from '@/components/Dashboard'

export default async function WorkspacePage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return <Dashboard workspaceId={params.workspaceId} />
}

