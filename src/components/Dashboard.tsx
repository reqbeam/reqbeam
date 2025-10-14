'use client'

import { useSession, signOut } from 'next-auth/react'
import Sidebar from './Sidebar'
import RequestBuilder from './RequestBuilder'
import ResponseViewer from './ResponseViewer'
import { useRequestStore } from '@/store/requestStore'

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
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar onNewRequest={handleNewRequest} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-gray-900">Postman Clone</h1>
            <button
              onClick={handleNewRequest}
              className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              New Request
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {session?.user?.email && (
              <span className="text-sm text-gray-600">{session.user.email}</span>
            )}
            <button
              onClick={() => signOut()}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center px-3 py-1 rounded-t-lg cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white border-t border-l border-r border-gray-200 text-primary-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className="text-sm font-medium">{tab.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTab(tab.id)
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Request Builder */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <RequestBuilder />
          </div>

          {/* Response Viewer */}
          <div className="w-full md:w-1/2 border-l border-gray-200 min-w-0 min-h-0 overflow-hidden">
            <ResponseViewer />
          </div>
        </div>
      </div>
    </div>
  )
}


