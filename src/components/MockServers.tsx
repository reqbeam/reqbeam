'use client'

import { useState, useEffect } from 'react'
import { Plus, Server, Play, Square, Edit, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import MockServerModal from './MockServerModal'
import MockEndpointEditor from './MockEndpointEditor'

interface MockEndpoint {
  id: string
  method: string
  path: string
  response: string | null
  statusCode: number
  headers: string | null
}

interface MockServer {
  id: string
  name: string
  baseUrl: string
  collectionId: string | null
  workspaceId: string | null
  isRunning: boolean
  responseDelay: number
  defaultStatusCode: number
  collection?: {
    id: string
    name: string
  }
  endpoints: MockEndpoint[]
  _count?: {
    endpoints: number
  }
}

export default function MockServers() {
  const [mockServers, setMockServers] = useState<MockServer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingServer, setEditingServer] = useState<MockServer | null>(null)
  const [editingEndpoint, setEditingEndpoint] = useState<{ serverId: string; endpoint: MockEndpoint | null } | null>(null)
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())
  const { activeWorkspace } = useWorkspaceStore()

  useEffect(() => {
    fetchMockServers()
  }, [activeWorkspace])

  const fetchMockServers = async () => {
    try {
      const url = activeWorkspace
        ? `/api/mock-servers?workspaceId=${activeWorkspace.id}`
        : '/api/mock-servers'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMockServers(data)
      }
    } catch (error) {
      console.error('Error fetching mock servers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleServer = (serverId: string) => {
    setExpandedServers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serverId)) {
        newSet.delete(serverId)
      } else {
        newSet.add(serverId)
      }
      return newSet
    })
  }

  const toggleServerStatus = async (serverId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/mock-servers/${serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRunning: !currentStatus,
        }),
      })

      if (response.ok) {
        fetchMockServers()
      }
    } catch (error) {
      console.error('Error toggling server status:', error)
    }
  }

  const deleteServer = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this mock server?')) return

    try {
      const response = await fetch(`/api/mock-servers/${serverId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMockServers()
      }
    } catch (error) {
      console.error('Error deleting mock server:', error)
    }
  }

  const copyMockUrl = (baseUrl: string) => {
    const fullUrl = `${window.location.origin}${baseUrl}`
    navigator.clipboard.writeText(fullUrl)
    // You could add a toast notification here
  }

  const copyEndpointUrl = (baseUrl: string, path: string) => {
    const fullUrl = `${window.location.origin}${baseUrl}${path}`
    navigator.clipboard.writeText(fullUrl)
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-500',
      POST: 'bg-green-500',
      PUT: 'bg-yellow-500',
      PATCH: 'bg-orange-500',
      DELETE: 'bg-red-500',
    }
    return colors[method.toUpperCase()] || 'bg-gray-500'
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading mock servers...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-[#3c3c3c] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mock Servers</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors"
          title="Create Mock Server"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Mock Servers List */}
      <div className="flex-1 overflow-y-auto">
        {mockServers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No mock servers yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-sm text-orange-500 hover:text-orange-600"
            >
              Create your first mock server
            </button>
          </div>
        ) : (
          <div className="p-2">
            {mockServers.map((server) => (
              <div
                key={server.id}
                className="mb-2 rounded border border-gray-200 dark:border-[#3c3c3c] bg-white dark:bg-[#2a2a2b]"
              >
                {/* Server Header */}
                <div className="p-2 flex flex-col justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <button
                      onClick={() => toggleServer(server.id)}
                      className="mr-2 p-0.5 hover:bg-gray-200 dark:hover:bg-[#3c3c3c] rounded"
                    >
                      {expandedServers.has(server.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Server className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {server.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {server.collection?.name || 'No collection'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        server.isRunning
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {server.isRunning ? 'Running' : 'Stopped'}
                    </span>
                    <button
                      onClick={() => toggleServerStatus(server.id, server.isRunning)}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors"
                      title={server.isRunning ? 'Stop Server' : 'Start Server'}
                    >
                      {server.isRunning ? (
                        <Square className="w-4 h-4 text-red-500" />
                      ) : (
                        <Play className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                    <button
                      onClick={() => copyMockUrl(server.baseUrl)}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors"
                      title="Copy Base URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingServer(server)}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors"
                      title="Edit Server"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteServer(server.id)}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors text-red-500"
                      title="Delete Server"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Server Details (Expanded) */}
                {expandedServers.has(server.id) && (
                  <div className="border-t border-gray-200 dark:border-[#3c3c3c] p-2">
                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="mb-1">
                        <strong>Base URL:</strong>{' '}
                        <code className="bg-gray-100 dark:bg-[#3c3c3c] px-1 py-0.5 rounded">
                          {window.location.origin}{server.baseUrl}
                        </code>
                      </div>
                      <div className="mb-1">
                        <strong>Endpoints:</strong> {server.endpoints?.length || 0}
                      </div>
                    </div>

                    {/* Endpoints List */}
                    <div className="space-y-1">
                      {server.endpoints && server.endpoints.length > 0 ? (
                        server.endpoints.map((endpoint) => (
                          <div
                            key={endpoint.id}
                            className="flex items-center justify-between p-1.5 rounded bg-gray-50 dark:bg-[#1e1e1e] hover:bg-gray-100 dark:hover:bg-[#2a2a2b]"
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded text-white font-medium mr-2 ${getMethodColor(
                                  endpoint.method
                                )}`}
                              >
                                {endpoint.method}
                              </span>
                              <code className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {endpoint.path}
                              </code>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                ({endpoint.statusCode})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() =>
                                  copyEndpointUrl(server.baseUrl, endpoint.path)
                                }
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors"
                                title="Copy URL"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setEditingEndpoint({ serverId: server.id, endpoint })
                                }
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors"
                                title="Edit Endpoint"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                          No endpoints yet
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setEditingEndpoint({ serverId: server.id, endpoint: null })
                        }
                        className="w-full mt-2 px-2 py-1.5 text-xs font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Endpoint
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <MockServerModal
          onClose={() => {
            setShowCreateModal(false)
            fetchMockServers()
          }}
        />
      )}

      {editingServer && (
        <MockServerModal
          mockServer={editingServer}
          onClose={() => {
            setEditingServer(null)
            fetchMockServers()
          }}
        />
      )}

      {editingEndpoint && (
        <div className="fixed inset-y-0 left-0 md:left-72 right-0 z-50 bg-white dark:bg-[#1e1e1e]">
          <MockEndpointEditor
            serverId={editingEndpoint.serverId}
            serverName={mockServers.find(s => s.id === editingEndpoint.serverId)?.name || ''}
            serverBaseUrl={mockServers.find(s => s.id === editingEndpoint.serverId)?.baseUrl || ''}
            endpoint={editingEndpoint.endpoint}
            onClose={() => {
              setEditingEndpoint(null)
            }}
            onSave={() => {
              fetchMockServers()
            }}
          />
        </div>
      )}
    </div>
  )
}

