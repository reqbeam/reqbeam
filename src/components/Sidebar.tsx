'use client'

import { useState } from 'react'
import { History as HistoryIcon, Settings, Search } from 'lucide-react'
import Collections from './Collections'
import Environments from './Environments'
import History from './History'

interface SidebarProps {
  onNewRequest: () => void
}

export default function Sidebar({ onNewRequest }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'history' | 'environments'>('collections')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="w-72 h-screen bg-[#252526] border-r border-[#3c3c3c] text-gray-300 flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-[#3c3c3c] flex-shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'collections'
                ? 'text-orange-500 border-orange-500 bg-[#2a2a2b]'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-[#2a2a2b]'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'text-orange-500 border-orange-500 bg-[#2a2a2b]'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-[#2a2a2b]'
            }`}
          >
            <HistoryIcon className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => setActiveTab('environments')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'environments'
                ? 'text-orange-500 border-orange-500 bg-[#2a2a2b]'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-[#2a2a2b]'
            }`}
          >
            <Settings className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'collections' && (
          <div className="p-3 border-b border-[#3c3c3c]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#3c3c3c] text-gray-300 text-sm rounded border border-[#555] focus:outline-none focus:border-orange-500 placeholder-gray-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'collections' && (
          <Collections searchQuery={searchQuery} />
        )}
        
        {activeTab === 'history' && (
          <History />
        )}

        {activeTab === 'environments' && (
          <div className="p-3">
            <Environments />
          </div>
        )}
      </div>
    </div>
  )
}
