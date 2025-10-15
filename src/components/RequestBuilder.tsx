'use client'

import { useState, useEffect } from 'react'
import { Send, Plus, Trash2, Save, Folder } from 'lucide-react'
import { useRequestStore } from '@/store/requestStore'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export default function RequestBuilder() {
  const { activeTab, tabs, updateTab, sendRequest, isLoading } = useRequestStore()
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderValue, setNewHeaderValue] = useState('')
  const [newParamKey, setNewParamKey] = useState('')
  const [newParamValue, setNewParamValue] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [requestName, setRequestName] = useState('')
  const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'headers' | 'body'>('params')

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
      <div className="flex-1 flex items-center justify-center bg-[#252525]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-300 mb-2">
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

  const addParam = () => {
    if (newParamKey && newParamValue) {
      const newParams = [
        ...(currentTab.params || []),
        { key: newParamKey, value: newParamValue, enabled: true }
      ]
      updateTab(currentTab.id, { params: newParams })
      updateUrlWithParams(newParams)
      setNewParamKey('')
      setNewParamValue('')
    }
  }

  const removeParam = (index: number) => {
    const newParams = currentTab.params.filter((_, i) => i !== index)
    updateTab(currentTab.id, { params: newParams })
    updateUrlWithParams(newParams)
  }

  const toggleParam = (index: number) => {
    const newParams = currentTab.params.map((param, i) =>
      i === index ? { ...param, enabled: !param.enabled } : param
    )
    updateTab(currentTab.id, { params: newParams })
    updateUrlWithParams(newParams)
  }

  const updateUrlWithParams = (params: any[]) => {
    const baseUrl = currentTab.url.split('?')[0]
    const enabledParams = params.filter(p => p.enabled)
    
    if (enabledParams.length === 0) {
      updateTab(currentTab.id, { url: baseUrl })
      return
    }

    const queryString = enabledParams
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    
    updateTab(currentTab.id, { url: `${baseUrl}?${queryString}` })
  }

  const handleSendRequest = () => {
    sendRequest(currentTab.id)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#252525]">
      {/* Request URL and Method */}
      <div className="border-b border-[#3c3c3c] p-2 sm:p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Method and URL */}
          <div className="flex gap-2 flex-1 min-w-0">
            <select
              value={currentTab.method}
              onChange={(e) => handleMethodChange(e.target.value)}
              className={`w-20 sm:w-24 px-2 py-2 border border-[#3c3c3c] rounded text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0 ${
                currentTab.method === 'GET' ? 'bg-green-600 text-white' :
                currentTab.method === 'POST' ? 'bg-yellow-600 text-white' :
                currentTab.method === 'PUT' ? 'bg-blue-600 text-white' :
                currentTab.method === 'DELETE' ? 'bg-red-600 text-white' :
                'bg-gray-600 text-white'
              }`}
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
              placeholder="https://api.example.com"
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-600 text-xs sm:text-sm"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-700 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              title="Save to Collection"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleSendRequest}
              disabled={isLoading || !currentTab.url}
              className="flex-1 md:flex-none px-4 sm:px-6 py-2 bg-[#ff6c37] text-white rounded hover:bg-[#ff8c5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs for Params/Headers/Body */}
      <div className="border-b border-[#3c3c3c] px-2 sm:px-4">
        <div className="flex space-x-3 sm:space-x-6 overflow-x-auto scrollbar-hide">
          {[
            { key: 'params', label: 'Params' },
            { key: 'headers', label: 'Headers' },
            { key: 'body', label: 'Body' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveRequestTab(tab.key as any)}
              className={`px-2 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeRequestTab === tab.key
                  ? 'text-white border-orange-500'
                  : 'text-gray-400 hover:text-white border-transparent hover:border-orange-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {/* Params Tab */}
        {activeRequestTab === 'params' && (
          <div className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3">Query Parameters</h3>
            
            {/* Existing Params */}
            <div className="space-y-2 mb-4">
              {currentTab.params && currentTab.params.length > 0 ? (
                currentTab.params.map((param, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={() => toggleParam(index)}
                      className="mt-2 sm:mt-3 flex-shrink-0"
                    />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={param.key}
                        readOnly
                        className={`w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded text-xs sm:text-sm ${
                          !param.enabled ? 'opacity-50' : ''
                        }`}
                      />
                      <input
                        type="text"
                        value={param.value}
                        readOnly
                        className={`w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded text-xs sm:text-sm ${
                          !param.enabled ? 'opacity-50' : ''
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => removeParam(index)}
                      className="px-2 sm:px-3 py-2 text-red-400 hover:bg-red-900/20 rounded flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs sm:text-sm text-gray-500 py-4 sm:py-6 text-center">
                  <p>No query parameters yet</p>
                  <p className="text-xs mt-1">Add parameters below to build your query string</p>
                </div>
              )}
            </div>

            {/* Add New Param */}
            <div className="flex items-start gap-2">
              <div className="w-4 sm:w-6 flex-shrink-0"></div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newParamKey}
                  onChange={(e) => setNewParamKey(e.target.value)}
                  placeholder="Key"
                  className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-600 text-xs sm:text-sm"
                />
                <input
                  type="text"
                  value={newParamValue}
                  onChange={(e) => setNewParamValue(e.target.value)}
                  placeholder="Value"
                  className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-600 text-xs sm:text-sm"
                />
              </div>
              <button
                onClick={addParam}
                className="px-2 sm:px-3 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-700 flex items-center justify-center gap-1 flex-shrink-0 text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Headers Tab */}
        {activeRequestTab === 'headers' && (
          <div className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3">Headers</h3>
            
            {/* Existing Headers */}
            <div className="space-y-2 mb-4">
              {Object.entries(currentTab.headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={key}
                      readOnly
                      className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={value}
                      readOnly
                      className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded text-xs sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeHeader(key)}
                    className="px-2 sm:px-3 py-2 text-red-400 hover:bg-red-900/20 rounded flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Header */}
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                  placeholder="Header name"
                  className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-600 text-xs sm:text-sm"
                />
                <input
                  type="text"
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                  placeholder="Header value"
                  className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-600 text-xs sm:text-sm"
                />
              </div>
              <button
                onClick={addHeader}
                className="px-2 sm:px-3 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-700 flex items-center justify-center gap-1 flex-shrink-0 text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Body Tab */}
        {activeRequestTab === 'body' && (
          <div className="p-3 sm:p-4">
            <div className="mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
                Body Type
              </label>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {['json', 'form-data', 'x-www-form-urlencoded'].map((type) => (
                  <label key={type} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value={type}
                      checked={currentTab.bodyType === type}
                      onChange={(e) => handleBodyTypeChange(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="text-xs sm:text-sm capitalize text-gray-300">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <textarea
              value={currentTab.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder={
                currentTab.bodyType === 'json'
                  ? '{\n  "key": "value"\n}'
                  : currentTab.bodyType === 'form-data'
                  ? 'key1=value1\nkey2=value2'
                  : 'key1=value1&key2=value2'
              }
              className="w-full h-48 sm:h-64 px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-xs sm:text-sm placeholder:text-gray-600 resize-y"
            />
          </div>
        )}
      </div>

      {/* Save to Collection Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252525] border border-[#3c3c3c] rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Save Request to Collection</h3>
            
            {/* Request Preview */}
            {currentTab && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-md">
                <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-2">Request Preview:</h4>
                <div className="space-y-1 text-xs sm:text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Method:</span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      currentTab.method === 'GET' ? 'bg-green-600 text-white' :
                      currentTab.method === 'POST' ? 'bg-yellow-600 text-white' :
                      currentTab.method === 'PUT' ? 'bg-blue-600 text-white' :
                      currentTab.method === 'DELETE' ? 'bg-red-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {currentTab.method}
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium whitespace-nowrap">URL:</span>
                    <span className="text-gray-400 font-mono text-xs break-all">{currentTab.url || 'No URL'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Headers:</span>
                    <span className="text-gray-400 text-xs">{Object.keys(currentTab.headers || {}).length} header(s)</span>
                  </div>
                  {currentTab.body && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Body:</span>
                      <span className="text-gray-400 text-xs">{currentTab.bodyType} ({currentTab.body.length} chars)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Request Name *
                </label>
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Enter request name"
                  className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-600 text-xs sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Collection *
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs sm:text-sm"
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
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-gray-400 hover:text-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToCollection}
                disabled={!requestName.trim() || !selectedCollection}
                className="w-full sm:w-auto px-4 py-2 bg-[#ff6c37] text-white rounded hover:bg-[#ff8c5a] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

