'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Folder, MoreVertical, Edit, Trash2, Play, Loader2, ChevronDown, ChevronRight, FileText, X, Check } from 'lucide-react'
import { useRequestStore } from '@/store/requestStore'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface Collection {
  id: string
  name: string
  description?: string
  requests: Request[]
}

interface Request {
  id: string
  name: string
  method: string
  url: string
  collectionId: string
  headers?: string
  body?: string
  bodyType?: string
  auth?: string | object
}

interface CollectionsProps {
  searchQuery?: string
}

export default function Collections({ searchQuery = '' }: CollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'collection' | 'request'; id: string; collectionId?: string } | null>(null)
  const [showAddRequestForm, setShowAddRequestForm] = useState<string | null>(null)
  const [newRequestName, setNewRequestName] = useState('')
  const [newRequestMethod, setNewRequestMethod] = useState('GET')
  const editInputRef = useRef<HTMLInputElement>(null)
  const { createTab, updateTab, tabs, setActiveTab } = useRequestStore()
  const { activeWorkspace } = useWorkspaceStore()

  useEffect(() => {
    fetchCollections()
  }, [activeWorkspace])

  const fetchCollections = async () => {
    try {
      // Include workspaceId in the query if available
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
    } finally {
      setIsLoading(false)
    }
  }

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDescription,
          workspaceId: activeWorkspace?.id,
        }),
      })

      if (response.ok) {
        setNewCollectionName('')
        setNewCollectionDescription('')
        setShowCreateForm(false)
        fetchCollections()
      }
    } catch (error) {
      console.error('Error creating collection:', error)
    }
  }

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCollections()
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  const runRequest = (request: Request) => {
    // Check if this request is already open in a tab
    const existingTab = tabs.find(tab => tab.requestId === request.id)
    
    if (existingTab) {
      // Switch to the existing tab instead of creating a new one
      setActiveTab(existingTab.id)
      return
    }
    
    // Request is not open, create a new tab
    let parsedHeaders = {}
    try {
      parsedHeaders = request.headers ? JSON.parse(request.headers) : {}
    } catch {
      parsedHeaders = {}
    }
    
    let parsedAuth = null
    try {
      if (request.auth) {
        parsedAuth = typeof request.auth === 'string' ? JSON.parse(request.auth) : request.auth
      }
    } catch {
      parsedAuth = null
    }
    
    // Create a new tab - zustand updates are synchronous, so we can access state immediately
    createTab()
    
    // Get the newly created tab ID from the store state (zustand updates are synchronous)
    const newTabId = useRequestStore.getState().activeTab
    
    if (newTabId) {
      updateTab(newTabId, {
        name: request.name,
        method: request.method,
        url: request.url,
        headers: parsedHeaders,
        body: request.body || '',
        bodyType: (request.bodyType as 'json' | 'form-data' | 'x-www-form-urlencoded') || 'json',
        auth: parsedAuth,
        requestId: request.id,
        collectionId: request.collectionId,
      })
    }
  }

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  const startEditingCollection = (collection: Collection) => {
    setEditingCollectionId(collection.id)
    setEditingName(collection.name)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const startEditingRequest = (request: Request) => {
    setEditingRequestId(request.id)
    setEditingName(request.name)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const saveCollectionName = async (collectionId: string) => {
    if (!editingName.trim()) {
      setEditingCollectionId(null)
      return
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName }),
      })

      if (response.ok) {
        setEditingCollectionId(null)
        fetchCollections()
      }
    } catch (error) {
      console.error('Error renaming collection:', error)
    }
  }

  const saveRequestName = async (requestId: string) => {
    if (!editingName.trim()) {
      setEditingRequestId(null)
      return
    }

    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName }),
      })

      if (response.ok) {
        setEditingRequestId(null)
        fetchCollections()
      }
    } catch (error) {
      console.error('Error renaming request:', error)
    }
  }

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return

    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCollections()
      }
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const addRequestToCollection = async (collectionId: string) => {
    if (!newRequestName.trim()) return

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRequestName,
          method: newRequestMethod,
          url: 'https://api.example.com',
          collectionId,
          workspaceId: activeWorkspace?.id,
        }),
      })

      if (response.ok) {
        setNewRequestName('')
        setNewRequestMethod('GET')
        setShowAddRequestForm(null)
        fetchCollections()
      }
    } catch (error) {
      console.error('Error adding request:', error)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, type: 'collection' | 'request', id: string, collectionId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, collectionId })
  }

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // Listen for global refresh events (from RequestBuilder saves)
  useEffect(() => {
    const onRefresh = () => fetchCollections()
    window.addEventListener('collections:refresh', onRefresh as any)
    return () => window.removeEventListener('collections:refresh', onRefresh as any)
  }, [])

  useEffect(() => {
    if (editingCollectionId || editingRequestId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingCollectionId, editingRequestId])

  // Filter collections based on search query
  const filteredCollections = collections.filter(collection => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const matchesCollection = collection.name.toLowerCase().includes(query)
    const matchesRequest = collection.requests.some(req => 
      req.name.toLowerCase().includes(query) || 
      req.url.toLowerCase().includes(query)
    )
    return matchesCollection || matchesRequest
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-400 transition-colors" />
        <span className="ml-2 text-gray-700 dark:text-gray-500 transition-colors">Loading...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Create Button */}
      <div className="p-3 border-b border-gray-200 dark:border-[#3c3c3c] flex-shrink-0 transition-colors">
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Create Collection Form */}
      {showCreateForm && (
        <div className="p-3 bg-gray-100 dark:bg-[#2a2a2b] border-b border-gray-200 dark:border-[#3c3c3c] flex-shrink-0 transition-colors">
          <form onSubmit={createCollection} className="space-y-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Collection Name"
              required
              autoFocus
            />
            <input
              type="text"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Description (optional)"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewCollectionName('')
                  setNewCollectionDescription('')
                }}
                className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-[#3c3c3c] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-[#555] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600 transition-colors" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 transition-colors">No collections yet</p>
            <p className="text-gray-700 dark:text-gray-600 text-xs transition-colors">Create your first collection to organize requests</p>
          </div>
        ) : (
          <div className="py-1">
            {filteredCollections.map((collection) => (
              <div key={collection.id} className="mb-1">
                {/* Collection Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2b] cursor-pointer group transition-colors"
                  onClick={() => toggleCollection(collection.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'collection', collection.id)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {expandedCollections.has(collection.id) ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    )}
                    <Folder className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    {editingCollectionId === collection.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => saveCollectionName(collection.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCollectionName(collection.id)
                          if (e.key === 'Escape') setEditingCollectionId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-orange-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate transition-colors">{collection.name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddRequestForm(collection.id)
                      }}
                      className="p-1 text-gray-600 dark:text-gray-500 hover:text-orange-500 transition-colors"
                      title="Add request"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContextMenu(e, 'collection', collection.id)
                      }}
                      className="p-1 text-gray-600 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add Request Form */}
                {showAddRequestForm === collection.id && (
                  <div className="ml-6 px-3 py-2 bg-gray-50 dark:bg-[#2a2a2b] transition-colors">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newRequestName}
                        onChange={(e) => setNewRequestName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="Request Name"
                        autoFocus
                      />
                      <select
                        value={newRequestMethod}
                        onChange={(e) => setNewRequestMethod(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addRequestToCollection(collection.id)}
                          className="flex-1 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddRequestForm(null)
                            setNewRequestName('')
                            setNewRequestMethod('GET')
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-[#3c3c3c] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-[#555] text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requests List */}
                {expandedCollections.has(collection.id) && (
                  <div className="ml-6">
                    {collection.requests.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-700 dark:text-gray-600 transition-colors">
                        No requests
                      </div>
                    ) : (
                      collection.requests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2b] cursor-pointer group transition-colors"
                          onClick={() => runRequest(request)}
                          onContextMenu={(e) => handleContextMenu(e, 'request', request.id, collection.id)}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
                              request.method === 'GET' ? 'bg-green-600/20 text-green-400' :
                              request.method === 'POST' ? 'bg-blue-600/20 text-blue-400' :
                              request.method === 'PUT' ? 'bg-yellow-600/20 text-yellow-400' :
                              request.method === 'DELETE' ? 'bg-red-600/20 text-red-400' :
                              request.method === 'PATCH' ? 'bg-purple-600/20 text-purple-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {request.method}
                            </span>
                            {editingRequestId === request.id ? (
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => saveRequestName(request.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRequestName(request.id)
                                  if (e.key === 'Escape') setEditingRequestId(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-2 py-1 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 text-sm rounded border border-orange-500 focus:outline-none transition-colors"
                              />
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate transition-colors">{request.name}</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleContextMenu(e, 'request', request.id, collection.id)
                            }}
                            className="p-1 text-gray-600 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-[#2a2a2b] border border-gray-200 dark:border-[#555] rounded shadow-lg py-1 z-50 min-w-[160px] transition-colors"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'collection' ? (
            <>
              <button
                onClick={() => {
                  const collection = collections.find(c => c.id === contextMenu.id)
                  if (collection) startEditingCollection(collection)
                  setContextMenu(null)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <button
                onClick={() => {
                  setShowAddRequestForm(contextMenu.id)
                  setContextMenu(null)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Request</span>
              </button>
              <div className="border-t border-[#555] my-1"></div>
              <button
                onClick={() => {
                  deleteCollection(contextMenu.id)
                  setContextMenu(null)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const collection = collections.find(c => c.id === contextMenu.collectionId)
                  const request = collection?.requests.find(r => r.id === contextMenu.id)
                  if (request) startEditingRequest(request)
                  setContextMenu(null)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <div className="border-t border-[#555] my-1"></div>
              <button
                onClick={() => {
                  deleteRequest(contextMenu.id)
                  setContextMenu(null)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

