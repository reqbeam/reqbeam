import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyPKCESession } from '@/lib/pkceSession'
import WorkspaceRedirect from '@/components/WorkspaceRedirect'
import OAuthCallbackHandler from '@/components/OAuthCallbackHandler'

export default async function Home() {
  // Check for NextAuth session (for traditional login)
  const session = await getServerSession(authOptions)
  
  // Check for PKCE session (for OAuth PKCE login)
  const pkceUser = await verifyPKCESession()
  
  // If neither session exists, redirect to sign in
  if (!session && !pkceUser) {
    redirect('/auth/signin')
  }

  // This component will redirect to the appropriate workspace
  return (
    <>
      <OAuthCallbackHandler />
      <WorkspaceRedirect />
    </>
  )
}


