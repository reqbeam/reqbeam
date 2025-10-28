'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Loader2 } from 'lucide-react'

export default function WorkspaceRedirect() {
  const router = useRouter()
  const { workspaces, activeWorkspace, fetchWorkspaces, isInitialized, isLoading } = useWorkspaceStore()

  useEffect(() => {
    const initialize = async () => {
      // Fetch workspaces if not already initialized
      if (!isInitialized) {
        await fetchWorkspaces()
      }
    }

    initialize()
  }, [isInitialized, fetchWorkspaces])

  useEffect(() => {
    // Once workspaces are loaded, redirect to the active or first workspace
    if (isInitialized && !isLoading && workspaces.length > 0) {
      const targetWorkspace = activeWorkspace || workspaces[0]
      router.push(`/w/${targetWorkspace.id}`)
    }
  }, [isInitialized, isLoading, workspaces, activeWorkspace, router])

  return (
    <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading workspace...</p>
      </div>
    </div>
  )
}

