'use client'

import { useState, useEffect } from 'react'
import { History as HistoryIcon, RefreshCw, Trash2, Terminal, Globe, Clock, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface HistoryEntry {
  id: string
  method: string
  url: string
  statusCode: number | null
  source: 'CLI' | 'WEB'
  duration: number | null
  error: string | null
  createdAt: string
}

interface HistoryProps {
  onSelectRequest?: (entry: HistoryEntry) => void
}

export default function History({ onSelectRequest }: HistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'CLI' | 'WEB'>('ALL')
  const [hasLegacyHistory, setHasLegacyHistory] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const { activeWorkspace } = useWorkspaceStore()

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filter !== 'ALL') {
        params.append('source', filter)
      }

      // Filter by active workspace if available
      // If no workspace, API will return all user history
      if (activeWorkspace) {
        params.append('workspaceId', activeWorkspace.id)
      }
      
      const response = await fetch(`/api/history?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
        
        // Check if there's any legacy history (without workspaceId)
        if (activeWorkspace) {
          const legacyCount = data.filter((entry: any) => !entry.workspaceId).length
          setHasLegacyHistory(legacyCount > 0)
        }
      } else {
        console.error('Failed to fetch history:', response.status)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    const confirmMessage = activeWorkspace
      ? `Are you sure you want to clear all history for "${activeWorkspace.name}"?`
      : 'Are you sure you want to clear all history?'
    
    if (!confirm(confirmMessage)) return
    
    try {
      const params = new URLSearchParams()
      if (activeWorkspace) {
        params.append('workspaceId', activeWorkspace.id)
      }

      const response = await fetch(`/api/history?${params.toString()}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setHistory([])
      }
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  // Refetch when filter or workspace changes
  useEffect(() => {
    fetchHistory()
  }, [filter, activeWorkspace])

  const migrateHistory = async () => {
    if (!activeWorkspace) return
    
    setIsMigrating(true)
    try {
      const response = await fetch('/api/history/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setHasLegacyHistory(false)
        fetchHistory()
        alert(`Successfully migrated ${data.migratedCount} history entries to "${activeWorkspace.name}"`)
      } else {
        alert('Failed to migrate history')
      }
    } catch (error) {
      console.error('Error migrating history:', error)
      alert('Error migrating history')
    } finally {
      setIsMigrating(false)
    }
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-600 text-white'
      case 'POST':
        return 'bg-yellow-600 text-white'
      case 'PUT':
        return 'bg-blue-600 text-white'
      case 'DELETE':
        return 'bg-red-600 text-white'
      case 'PATCH':
        return 'bg-purple-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-gray-500'
    if (status >= 200 && status < 300) return 'text-green-500'
    if (status >= 300 && status < 400) return 'text-blue-500'
    if (status >= 400 && status < 500) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now'
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }
    // More than 1 day
    return date.toLocaleDateString()
  }

  const formatUrl = (url: string) => {
    if (url.length > 40) {
      return url.substring(0, 37) + '...'
    }
    return url
  }

  return (
    <div className="flex flex-col h-full">
      {/* Migration Banner */}
      {hasLegacyHistory && activeWorkspace && (
        <div className="p-3 bg-orange-500/10 border-b border-orange-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-orange-400 font-medium">Legacy History Found</p>
              <p className="text-xs text-orange-300/80 mt-0.5">
                You have history entries not yet associated with this workspace
              </p>
            </div>
            <button
              onClick={migrateHistory}
              disabled={isMigrating}
              className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isMigrating ? 'Migrating...' : 'Migrate to This Workspace'}
            </button>
          </div>
        </div>
      )}

      {/* Header with filters */}
      <div className="p-3 border-b border-[#3c3c3c] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Request History</h3>
          <div className="flex gap-2">
            <button
              onClick={fetchHistory}
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#3c3c3c] rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={clearHistory}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filter === 'ALL'
                ? 'bg-orange-500 text-white'
                : 'bg-[#3c3c3c] text-gray-400 hover:bg-[#4c4c4c]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('CLI')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
              filter === 'CLI'
                ? 'bg-orange-500 text-white'
                : 'bg-[#3c3c3c] text-gray-400 hover:bg-[#4c4c4c]'
            }`}
          >
            <Terminal className="w-3 h-3" />
            CLI
          </button>
          <button
            onClick={() => setFilter('WEB')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
              filter === 'WEB'
                ? 'bg-orange-500 text-white'
                : 'bg-[#3c3c3c] text-gray-400 hover:bg-[#4c4c4c]'
            }`}
          >
            <Globe className="w-3 h-3" />
            Web
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-8">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-sm text-gray-500">No requests yet</p>
            <p className="text-xs mt-2 text-gray-600">
              {filter === 'ALL' 
                ? 'Your request history will appear here'
                : `No ${filter} requests found`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#3c3c3c]">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-3 hover:bg-[#2a2a2b] cursor-pointer transition-colors group"
                onClick={() => onSelectRequest?.(entry)}
              >
                {/* Method and Source */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(
                        entry.method
                      )}`}
                    >
                      {entry.method}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {entry.source === 'CLI' ? (
                        <Terminal className="w-3 h-3" />
                      ) : (
                        <Globe className="w-3 h-3" />
                      )}
                      {entry.source}
                    </span>
                  </div>
                  
                  {entry.error ? (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      Error
                    </span>
                  ) : entry.statusCode ? (
                    <span className={`text-xs font-medium ${getStatusColor(entry.statusCode)}`}>
                      {entry.statusCode}
                    </span>
                  ) : null}
                </div>

                {/* URL */}
                <div className="text-xs text-gray-300 mb-2 font-mono break-all">
                  {formatUrl(entry.url)}
                </div>

                {/* Error Message */}
                {entry.error && (
                  <div className="text-xs text-red-400 mb-2 truncate">
                    {entry.error}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.duration ? `${entry.duration}ms` : 'N/A'}
                  </span>
                  <span>{formatTimestamp(entry.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

