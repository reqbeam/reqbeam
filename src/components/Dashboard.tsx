'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import RequestBuilder from './RequestBuilder'
import ResponseViewer from './ResponseViewer'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import WorkspaceModal from './WorkspaceModal'
import ThemeSwitcher from './ThemeSwitcher'
import { useRequestStore } from '@/store/requestStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Plus, Loader2 } from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface DashboardProps {
  workspaceId?: string
}

export default function Dashboard({ workspaceId }: DashboardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { activeTab, tabs, createTab, closeTab, setActiveTab } = useRequestStore()
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces, isInitialized } = useWorkspaceStore()
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize and set active workspace based on URL
  useEffect(() => {
    const initializeWorkspace = async () => {
      if (!isInitialized) {
        await fetchWorkspaces()
      }

      if (workspaceId && isInitialized) {
        // Check if the workspace exists and user has access
        const workspace = workspaces.find(w => w.id === workspaceId)
        if (workspace) {
          if (!activeWorkspace || activeWorkspace.id !== workspaceId) {
            await setActiveWorkspace(workspaceId)
          }
          setIsLoading(false)
        } else {
          // Workspace not found or no access, redirect to first available workspace
          if (workspaces.length > 0) {
            router.push(`/w/${workspaces[0].id}`)
          } else {
            router.push('/')
          }
        }
      } else if (isInitialized) {
        setIsLoading(false)
      }
    }

    initializeWorkspace()
  }, [workspaceId, workspaces, activeWorkspace, isInitialized, setActiveWorkspace, fetchWorkspaces, router])

  const handleNewRequest = () => {
    createTab()
  }

  const handleCloseTab = (tabId: string) => {
    closeTab(tabId)
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const handleCreateWorkspace = () => {
    setIsWorkspaceModalOpen(true)
  }

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      handler: () => {
        handleNewRequest()
      },
    },
    {
      key: 'w',
      ctrlKey: true,
      shiftKey: true,
      handler: () => {
        if (activeTab) {
          handleCloseTab(activeTab)
        }
      },
    },
  ])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-[#1e1e1e] transition-colors">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 transition-colors">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background dark:bg-[#1e1e1e] transition-colors">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar onNewRequest={handleNewRequest} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-[#252525] border-b border-gray-200 dark:border-[#3c3c3c] px-3 sm:px-6 py-3 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hidden lg:block transition-colors">Postmind</h1>
            <WorkspaceSwitcher onCreateNew={handleCreateWorkspace} />
            <button
              onClick={handleNewRequest}
              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-2"
              title="New Request (Ctrl+Shift+N)"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user?.email && (
              <span className="hidden lg:inline text-sm text-gray-400 dark:text-gray-400 truncate max-w-[150px]">{session.user.email}</span>
            )}
            <ThemeSwitcher />
            <button
              onClick={() => signOut()}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-600 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

      {/* Workspace Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        mode="create"
      />

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="bg-white dark:bg-[#252525] border-b border-gray-200 dark:border-[#3c3c3c] flex items-center min-w-0 w-full transition-colors">
            <div className="flex space-x-1 overflow-x-auto overflow-y-hidden px-2 sm:px-4 w-full" style={{ scrollbarWidth: 'thin', scrollbarColor: '#666 transparent' }}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center px-2 sm:px-4 py-2 cursor-pointer border-b-2 whitespace-nowrap flex-shrink-0 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-gray-900 dark:text-white bg-gray-100 dark:bg-[#2a2a2a]'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className={`text-[10px] sm:text-xs font-medium mr-1 sm:mr-2 px-1 sm:px-1.5 py-0.5 rounded ${
                    tab.method === 'GET' ? 'bg-green-600 text-white' :
                    tab.method === 'POST' ? 'bg-yellow-600 text-white' :
                    tab.method === 'PUT' ? 'bg-blue-600 text-white' :
                    tab.method === 'DELETE' ? 'bg-red-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>{tab.method}</span>
                  <span className="text-xs sm:text-sm">{tab.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTab(tab.id)
                    }}
                    className="ml-2 sm:ml-3 text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 text-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Request Builder */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:border-r border-gray-200 dark:border-[#3c3c3c] transition-colors">
            <RequestBuilder />
          </div>

          {/* Response Viewer */}
          <div className="w-full lg:w-1/2 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-[#3c3c3c] min-w-0 min-h-0 overflow-hidden transition-colors">
            <ResponseViewer />
          </div>
        </div>
      </div>
    </div>
  )
}


