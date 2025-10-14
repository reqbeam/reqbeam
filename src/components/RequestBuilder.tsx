'use client'

import { useState, useEffect } from 'react'
import { Send, Plus, Trash2, Save, Folder } from 'lucide-react'
import { useRequestStore } from '@/store/requestStore'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export default function RequestBuilder() {
  const { activeTab, tabs, updateTab, sendRequest, isLoading } = useRequestStore()
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderValue, setNewHeaderValue] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [requestName, setRequestName] = useState('')

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
    }
  }

  const handleSaveToCollection = async () => {
    if (!currentTab || !selectedCollection || !requestName) return

    // Validate required fields
    if (!currentTab.url.trim()) {
      alert('Please enter a URL before saving')
      return
    }

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: selectedCollection,
          request: {
            name: requestName.trim(),
            method: currentTab.method,
            url: currentTab.url.trim(),
            headers: currentTab.headers || {},
            body: currentTab.body || '',
            bodyType: currentTab.bodyType || 'json',
          },
        }),
      })

      if (response.ok) {
        setShowSaveModal(false)
        setRequestName('')
        setSelectedCollection('')
        fetchCollections()
        alert(`Request "${requestName}" saved successfully to collection!`)
      } else {
        const errorData = await response.json()
        alert(`Error saving request: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving request:', error)
      alert('Failed to save request. Please try again.')
    }
  }

  const currentTab = tabs.find(tab => tab.id === activeTab)

  if (!currentTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Request Selected
          </h3>
          <p className="text-gray-500">
            Create a new request to get started
          </p>
        </div>
      </div>
    )
  }

  const handleMethodChange = (method: string) => {
    updateTab(currentTab.id, { method })
  }

  const handleUrlChange = (url: string) => {
    updateTab(currentTab.id, { url })
  }

  const handleBodyChange = (body: string) => {
    updateTab(currentTab.id, { body })
  }

  const handleBodyTypeChange = (bodyType: 'json' | 'form-data' | 'x-www-form-urlencoded') => {
    updateTab(currentTab.id, { bodyType })
  }

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      const newHeaders = {
        ...currentTab.headers,
        [newHeaderKey]: newHeaderValue,
      }
      updateTab(currentTab.id, { headers: newHeaders })
      setNewHeaderKey('')
      setNewHeaderValue('')
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...currentTab.headers }
    delete newHeaders[key]
    updateTab(currentTab.id, { headers: newHeaders })
  }

  const handleSendRequest = () => {
    sendRequest(currentTab.id)
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Request URL and Method */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex space-x-2">
          <select
            value={currentTab.method}
            onChange={(e) => handleMethodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={currentTab.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
            title="Save to Collection"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button
            onClick={handleSendRequest}
            disabled={isLoading || !currentTab.url}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Request Body */}
      {['POST', 'PUT', 'PATCH'].includes(currentTab.method) && (
        <div className="border-b border-gray-200 p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body Type
            </label>
            <div className="flex space-x-4">
              {['json', 'form-data', 'x-www-form-urlencoded'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="bodyType"
                    value={type}
                    checked={currentTab.bodyType === type}
                    onChange={(e) => handleBodyTypeChange(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <textarea
            value={currentTab.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={
              currentTab.bodyType === 'json'
                ? 'Enter JSON body'
                : currentTab.bodyType === 'form-data'
                ? 'Enter form data'
                : 'Enter URL encoded data'
            }
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
          />
        </div>
      )}

      {/* Headers */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Headers</h3>
        
        {/* Existing Headers */}
        <div className="space-y-2 mb-4">
          {Object.entries(currentTab.headers).map(([key, value]) => (
            <div key={key} className="flex space-x-2">
              <input
                type="text"
                value={key}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <input
                type="text"
                value={value}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={() => removeHeader(key)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Header */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newHeaderKey}
            onChange={(e) => setNewHeaderKey(e.target.value)}
            placeholder="Header name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <input
            type="text"
            value={newHeaderValue}
            onChange={(e) => setNewHeaderValue(e.target.value)}
            placeholder="Header value"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addHeader}
            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Save to Collection Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Request to Collection</h3>
            
            {/* Request Preview */}
            {currentTab && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Request Preview:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Method:</span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      currentTab.method === 'GET' ? 'bg-green-100 text-green-700' :
                      currentTab.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                      currentTab.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                      currentTab.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {currentTab.method}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">URL:</span>
                    <span className="text-gray-600 font-mono text-xs truncate">{currentTab.url || 'No URL'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Headers:</span>
                    <span className="text-gray-600 text-xs">{Object.keys(currentTab.headers || {}).length} header(s)</span>
                  </div>
                  {currentTab.body && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Body:</span>
                      <span className="text-gray-600 text-xs">{currentTab.bodyType} ({currentTab.body.length} chars)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Name *
                </label>
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Enter request name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection *
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToCollection}
                disabled={!requestName.trim() || !selectedCollection}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

