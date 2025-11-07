'use client'

import { useState, useEffect } from 'react'
import { History as HistoryIcon, Settings, Search, Server, Filter, X } from 'lucide-react'
import Collections from './Collections'
import Environments from './Environments'
import History from './History'
import MockServers from './MockServers'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface SidebarProps {
  onNewRequest: () => void
}

export interface CollectionFilters {
  method?: string
  collectionId?: string
}

interface Collection {
  id: string
  name: string
}

export default function Sidebar({ onNewRequest }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'history' | 'environments' | 'mocks'>('collections')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<CollectionFilters>({})
  const [collections, setCollections] = useState<Collection[]>([])
  const { activeWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (activeTab === 'collections') {
      fetchCollections()
    }
  }, [activeTab, activeWorkspace])

  const fetchCollections = async () => {
    try {
      const url = activeWorkspace
        ? `/api/collections?workspaceId=${activeWorkspace.id}`
        : '/api/collections'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  return (
    <div className="w-72 h-screen bg-gray-50 dark:bg-[#252526] border-r border-gray-200 dark:border-[#3c3c3c] text-gray-700 dark:text-gray-300 flex flex-col transition-colors">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 dark:border-[#3c3c3c] flex-shrink-0 transition-colors">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'collections'
                ? 'text-orange-500 border-orange-500 bg-gray-100 dark:bg-[#2a2a2b]'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2b]'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'text-orange-500 border-orange-500 bg-gray-100 dark:bg-[#2a2a2b]'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2b]'
            }`}
          >
            <HistoryIcon className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => setActiveTab('mocks')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'mocks'
                ? 'text-orange-500 border-orange-500 bg-gray-100 dark:bg-[#2a2a2b]'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2b]'
            }`}
          >
            <Server className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => setActiveTab('environments')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'environments'
                ? 'text-orange-500 border-orange-500 bg-gray-100 dark:bg-[#2a2a2b]'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2b]'
            }`}
          >
            <Settings className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Search Bar and Filters */}
        {activeTab === 'collections' && (
          <div className="border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 placeholder-gray-500 dark:placeholder-gray-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                    showFilters || filters.method || filters.collectionId
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-100 dark:bg-[#3c3c3c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a4a4a]'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                  {(filters.method || filters.collectionId) && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {(filters.method ? 1 : 0) + (filters.collectionId ? 1 : 0)}
                    </span>
                  )}
                </button>
                {(filters.method || filters.collectionId) && (
                  <button
                    onClick={() => {
                      setFilters({})
                      setShowFilters(false)
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    title="Clear filters"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-[#3c3c3c] pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Collection
                  </label>
                  <select
                    value={filters.collectionId || ''}
                    onChange={(e) => setFilters({ ...filters, collectionId: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-xs rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">All Collections</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    HTTP Method
                  </label>
                  <select
                    value={filters.method || ''}
                    onChange={(e) => setFilters({ ...filters, method: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-xs rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'collections' && (
          <Collections searchQuery={searchQuery} filters={filters} />
        )}
        
        {activeTab === 'history' && (
          <History />
        )}

        {activeTab === 'mocks' && (
          <MockServers />
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
