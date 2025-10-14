'use client'

import { useState, useEffect } from 'react'
import { Plus, Folder, MoreVertical, Edit, Trash2, Play, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { useRequestStore } from '@/store/requestStore'

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
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const { createTab, updateTab, loadRequestIntoActiveTab } = useRequestStore()

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections')
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
    // Load request data into the active tab (or create new one if none exists)
    let parsedHeaders = {}
    try {
      parsedHeaders = request.headers ? JSON.parse(request.headers) : {}
    } catch {
      parsedHeaders = {}
    }
    
    loadRequestIntoActiveTab({
      name: request.name,
      method: request.method,
      url: request.url,
      headers: parsedHeaders,
      body: request.body || '',
      bodyType: (request.bodyType as 'json' | 'form-data' | 'x-www-form-urlencoded') || 'json',
    })
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

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading collections...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Collections</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Create Collection Form */}
      {showCreateForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <form onSubmit={createCollection} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="My API Collection"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Collection description..."
                rows={2}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections List */}
      <div className="space-y-2">
        {collections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No collections yet</p>
            <p className="text-sm">Create your first collection to get started</p>
          </div>
        ) : (
          collections.map((collection) => (
            <div
              key={collection.id}
              className="border border-gray-200 rounded-lg mb-2"
            >
              <div 
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleCollection(collection.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {expandedCollections.has(collection.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <Folder className="w-4 h-4 text-gray-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">{collection.name}</h4>
                      {collection.description && (
                        <p className="text-sm text-gray-500">{collection.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {collection.requests.length} requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {collection.requests.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          runRequest(collection.requests[0])
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Run first request"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCollection(collection.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Requests in Collection */}
              {expandedCollections.has(collection.id) && collection.requests.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-2 space-y-1">
                    {collection.requests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between py-2 px-3 hover:bg-white rounded cursor-pointer group"
                        onClick={() => runRequest(request)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded font-mono ${
                            request.method === 'GET' ? 'bg-green-100 text-green-700' :
                            request.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                            request.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                            request.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {request.method}
                          </span>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">{request.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            runRequest(request)
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Run request"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

