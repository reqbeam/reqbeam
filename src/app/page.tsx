import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import WorkspaceRedirect from '@/components/WorkspaceRedirect'
import OAuthCallbackHandler from '@/components/OAuthCallbackHandler'

// Mark as dynamic since it uses session and client components with context
export const dynamic = 'force-dynamic'
export const revalidate = 0

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


