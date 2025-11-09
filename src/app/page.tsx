import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import WorkspaceRedirect from '@/components/WorkspaceRedirect'
import OAuthCallbackHandler from '@/components/OAuthCallbackHandler'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
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


