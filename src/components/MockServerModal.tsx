'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface Collection {
  id: string
  name: string
}

interface MockServer {
  id: string
  name: string
  collectionId: string | null
  responseDelay: number
  defaultStatusCode: number
}

interface MockServerModalProps {
  mockServer?: MockServer | null
  onClose: () => void
}

export default function MockServerModal({ mockServer, onClose }: MockServerModalProps) {
  const [name, setName] = useState('')
  const [collectionId, setCollectionId] = useState<string>('')
  const [responseDelay, setResponseDelay] = useState(0)
  const [defaultStatusCode, setDefaultStatusCode] = useState(200)
  const [autoGenerateEndpoints, setAutoGenerateEndpoints] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { activeWorkspace } = useWorkspaceStore()

  useEffect(() => {
    fetchCollections()
    if (mockServer) {
      setName(mockServer.name)
      setCollectionId(mockServer.collectionId || '')
      setResponseDelay(mockServer.responseDelay)
      setDefaultStatusCode(mockServer.defaultStatusCode)
    }
  }, [mockServer])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Mock server name is required')
      return
    }

    setIsSubmitting(true)

    try {
      if (mockServer) {
        // Update existing mock server
        const response = await fetch(`/api/mock-servers/${mockServer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            responseDelay,
            defaultStatusCode,
          }),
        })

        if (response.ok) {
          onClose()
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to update mock server')
        }
      } else {
        // Create new mock server
        const response = await fetch('/api/mock-servers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            collectionId: collectionId || null,
            workspaceId: activeWorkspace?.id || null,
            responseDelay,
            defaultStatusCode,
            autoGenerateEndpoints,
          }),
        })

        if (response.ok) {
          onClose()
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to create mock server')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-md transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 transition-colors">
            {mockServer ? 'Edit Mock Server' : 'Create Mock Server'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="mock-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Name <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="mock-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="My Mock Server"
              required
            />
          </div>

          {/* Collection Selection */}
          {!mockServer && (
            <div>
              <label htmlFor="collection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Collection (Optional)
              </label>
              <select
                id="collection"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Auto-generate Endpoints */}
          {!mockServer && collectionId && (
            <div className="flex items-center">
              <input
                id="auto-generate"
                type="checkbox"
                checked={autoGenerateEndpoints}
                onChange={(e) => setAutoGenerateEndpoints(e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="auto-generate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-generate endpoints from collection
              </label>
            </div>
          )}

          {/* Response Delay */}
          <div>
            <label htmlFor="response-delay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Response Delay (ms)
            </label>
            <input
              id="response-delay"
              type="number"
              value={responseDelay}
              onChange={(e) => setResponseDelay(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Default Status Code */}
          <div>
            <label htmlFor="status-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Default Status Code
            </label>
            <select
              id="status-code"
              value={defaultStatusCode}
              onChange={(e) => setDefaultStatusCode(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value={200}>200 - OK</option>
              <option value={201}>201 - Created</option>
              <option value={400}>400 - Bad Request</option>
              <option value={401}>401 - Unauthorized</option>
              <option value={404}>404 - Not Found</option>
              <option value={500}>500 - Internal Server Error</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3c3c3c] rounded hover:bg-gray-200 dark:hover:bg-[#4a4a4a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : mockServer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

