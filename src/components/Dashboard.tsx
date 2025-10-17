'use client'

import { useSession, signOut } from 'next-auth/react'
import Sidebar from './Sidebar'
import RequestBuilder from './RequestBuilder'
import ResponseViewer from './ResponseViewer'
import { useRequestStore } from '@/store/requestStore'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const { data: session } = useSession()
  const { activeTab, tabs, createTab, closeTab, setActiveTab } = useRequestStore()

  const handleNewRequest = () => {
    createTab()
  }

  const handleCloseTab = (tabId: string) => {
    closeTab(tabId)
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#1e1e1e]">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar onNewRequest={handleNewRequest} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <header className="bg-[#252525] border-b border-[#3c3c3c] px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-base sm:text-lg font-semibold text-white">API NEXUS</h1>
            <button
              onClick={handleNewRequest}
              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-700 flex items-center gap-1 sm:gap-2"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user?.email && (
              <span className="hidden sm:inline text-sm text-gray-400 truncate max-w-[150px]">{session.user.email}</span>
            )}
            <button
              onClick={() => signOut()}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="bg-[#252525] border-b border-[#3c3c3c] flex items-center min-w-0 w-full">
            <div className="flex space-x-1 overflow-x-auto overflow-y-hidden px-2 sm:px-4 w-full" style={{ scrollbarWidth: 'thin', scrollbarColor: '#666 transparent' }}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center px-2 sm:px-4 py-2 cursor-pointer border-b-2 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-white bg-[#2a2a2a]'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]'
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
                    className="ml-2 sm:ml-3 text-gray-500 hover:text-gray-200 text-lg"
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
          <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:border-r border-[#3c3c3c]">
            <RequestBuilder />
          </div>

          {/* Response Viewer */}
          <div className="w-full lg:w-1/2 border-t lg:border-t-0 lg:border-l border-[#3c3c3c] min-w-0 min-h-0 overflow-hidden">
            <ResponseViewer />
          </div>
        </div>
      </div>
    </div>
  )
}


