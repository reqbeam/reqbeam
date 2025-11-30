import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyPKCESession } from '@/lib/pkceSession'
import Dashboard from '@/components/Dashboard'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  // Check for NextAuth session (for traditional login)
  const session = await getServerSession(authOptions)
  
  // Check for PKCE session (for OAuth PKCE login)
  const pkceUser = await verifyPKCESession()
  
  // If neither session exists, redirect to sign in
  if (!session && !pkceUser) {
    redirect('/auth/signin')
  }

  const { workspaceId } = await params
  return <Dashboard workspaceId={workspaceId} />
}

