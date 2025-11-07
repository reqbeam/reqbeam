'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

interface MockEndpoint {
  id: string
  method: string
  path: string
  response: string | null
  statusCode: number
  headers: string | null
}

interface MockEndpointEditorProps {
  serverId: string
  serverName: string
  serverBaseUrl: string
  endpoint: MockEndpoint | null
  onClose: () => void
  onSave: () => void
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export default function MockEndpointEditor({ 
  serverId, 
  serverName,
  serverBaseUrl,
  endpoint, 
  onClose,
  onSave 
}: MockEndpointEditorProps) {
  const [method, setMethod] = useState(endpoint?.method || 'GET')
  const [path, setPath] = useState(endpoint?.path || '')
  const [response, setResponse] = useState(endpoint?.response || '')
  const [statusCode, setStatusCode] = useState(endpoint?.statusCode || 200)
  const [headers, setHeaders] = useState<Record<string, string>>(() => {
    try {
      if (endpoint?.headers) {
        return JSON.parse(endpoint.headers)
      }
    } catch {}
    return { 'Content-Type': 'application/json' }
  })
  const [params, setParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>(() => {
    // Extract query params from path
    if (endpoint?.path) {
      try {
        const url = new URL(endpoint.path, 'http://dummy.com')
        const paramsArray: Array<{ key: string; value: string; enabled: boolean }> = []
        url.searchParams.forEach((value, key) => {
          paramsArray.push({ key, value, enabled: true })
        })
        return paramsArray
      } catch {
        // If path doesn't have query params, check if it's in the path itself
        const pathParts = endpoint.path.split('?')
        if (pathParts.length > 1) {
          const queryString = pathParts[1]
          const paramsArray: Array<{ key: string; value: string; enabled: boolean }> = []
          queryString.split('&').forEach(param => {
            const [key, value] = param.split('=')
            if (key) {
              paramsArray.push({ key: decodeURIComponent(key), value: decodeURIComponent(value || ''), enabled: true })
            }
          })
          return paramsArray
        }
      }
    }
    return []
  })
  const [basePath, setBasePath] = useState(() => {
    if (endpoint?.path) {
      const pathParts = endpoint.path.split('?')
      return pathParts[0]
    }
    return ''
  })
  const [activeTab, setActiveTab] = useState<'path' | 'headers' | 'body' | 'response'>('path')
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderValue, setNewHeaderValue] = useState('')
  const [newParamKey, setNewParamKey] = useState('')
  const [newParamValue, setNewParamValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Update path when basePath or params change
  useEffect(() => {
    const enabledParams = params.filter(p => p.enabled)
    if (enabledParams.length === 0) {
      setPath(basePath)
    } else {
      const queryString = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')
      setPath(`${basePath}?${queryString}`)
    }
  }, [basePath, params])

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setHeaders({
        ...headers,
        [newHeaderKey]: newHeaderValue,
      })
      setNewHeaderKey('')
      setNewHeaderValue('')
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers }
    delete newHeaders[key]
    setHeaders(newHeaders)
  }

  const addParam = () => {
    if (newParamKey) {
      setParams([
        ...params,
        { key: newParamKey, value: newParamValue, enabled: true }
      ])
      setNewParamKey('')
      setNewParamValue('')
    }
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const toggleParam = (index: number) => {
    setParams(params.map((param, i) =>
      i === index ? { ...param, enabled: !param.enabled } : param
    ))
  }

  const updateParam = (index: number, field: 'key' | 'value', value: string) => {
    setParams(params.map((param, i) =>
      i === index ? { ...param, [field]: value } : param
    ))
  }

  const handleSave = async () => {
    setError('')

    if (!method.trim() || !basePath.trim()) {
      setError('Method and path are required')
      return
    }

    // Validate JSON response
    if (response.trim()) {
      try {
        JSON.parse(response)
      } catch {
        setError('Response must be valid JSON')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (endpoint) {
        // Update existing endpoint
        const responseData = await fetch(`/api/mock-servers/${serverId}/endpoints/${endpoint.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: method.trim().toUpperCase(),
            path: path.trim(),
            response: response.trim() || null,
            statusCode,
            headers: Object.keys(headers).length > 0 ? headers : null,
          }),
        })

        if (responseData.ok) {
          onSave()
          onClose()
        } else {
          const data = await responseData.json()
          setError(data.error || 'Failed to update endpoint')
        }
      } else {
        // Create new endpoint
        const responseData = await fetch(`/api/mock-servers/${serverId}/endpoints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: method.trim().toUpperCase(),
            path: path.trim(),
            response: response.trim() || null,
            statusCode,
            headers: Object.keys(headers).length > 0 ? headers : null,
          }),
        })

        if (responseData.ok) {
          onSave()
          onClose()
        } else {
          const data = await responseData.json()
          setError(data.error || 'Failed to create endpoint')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-600',
      POST: 'bg-yellow-600',
      PUT: 'bg-blue-600',
      PATCH: 'bg-orange-600',
      DELETE: 'bg-red-600',
    }
    return colors[method.toUpperCase()] || 'bg-gray-600'
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#252525] transition-colors">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#3c3c3c] p-2 sm:p-3 md:p-4 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] rounded transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {endpoint ? 'Edit Mock Endpoint' : 'Create Mock Endpoint'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {serverName} • {serverBaseUrl}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        {/* Method and Path */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`w-24 px-2 py-2 border border-[#3c3c3c] rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0 text-white ${getMethodColor(method)}`}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] rounded px-3 py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{serverBaseUrl}</span>
            <input
              type="text"
              value={basePath}
              onChange={(e) => setBasePath(e.target.value)}
              placeholder="/users/:id"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-200 text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#3c3c3c] px-2 sm:px-4 transition-colors">
        <div className="flex space-x-3 sm:space-x-6 overflow-x-auto scrollbar-hide">
          {[
            { key: 'path', label: 'Path & Params' },
            { key: 'headers', label: 'Headers' },
            { key: 'body', label: 'Body' },
            { key: 'response', label: 'Response' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-2 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-orange-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {/* Path & Params Tab */}
        {activeTab === 'path' && (
          <div className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-400 mb-3 transition-colors">
              Query Parameters
            </h3>
            
            {/* Existing Params */}
            <div className="space-y-2 mb-4">
              {params.length > 0 ? (
                params.map((param, index) => (
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
                        onChange={(e) => updateParam(index, 'key', e.target.value)}
                        placeholder="Key"
                        className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded text-xs sm:text-sm transition-colors"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateParam(index, 'value', e.target.value)}
                        placeholder="Value"
                        className={`w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded text-xs sm:text-sm transition-colors ${
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
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 py-4 sm:py-6 text-center transition-colors">
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
                  onKeyPress={(e) => e.key === 'Enter' && addParam()}
                  placeholder="Key"
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-500 dark:placeholder:text-gray-600 text-xs sm:text-sm transition-colors"
                />
                <input
                  type="text"
                  value={newParamValue}
                  onChange={(e) => setNewParamValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParam()}
                  placeholder="Value"
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-500 dark:placeholder:text-gray-600 text-xs sm:text-sm transition-colors"
                />
              </div>
              <button
                onClick={addParam}
                className="px-2 sm:px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1 flex-shrink-0 text-xs sm:text-sm transition-colors"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Headers Tab */}
        {activeTab === 'headers' && (
          <div className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-400 mb-3 transition-colors">
              Response Headers
            </h3>
            
            {/* Existing Headers */}
            <div className="space-y-2 mb-4">
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newHeaders = { ...headers }
                        delete newHeaders[key]
                        newHeaders[e.target.value] = value
                        setHeaders(newHeaders)
                      }}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded text-xs sm:text-sm transition-colors"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        setHeaders({
                          ...headers,
                          [key]: e.target.value,
                        })
                      }}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded text-xs sm:text-sm transition-colors"
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
                  onKeyPress={(e) => e.key === 'Enter' && newHeaderValue && addHeader()}
                  placeholder="Header name"
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-500 dark:placeholder:text-gray-600 text-xs sm:text-sm transition-colors"
                />
                <input
                  type="text"
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && newHeaderKey && addHeader()}
                  placeholder="Header value"
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-gray-500 dark:placeholder:text-gray-600 text-xs sm:text-sm transition-colors"
                />
              </div>
              <button
                onClick={addHeader}
                className="px-2 sm:px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1 flex-shrink-0 text-xs sm:text-sm transition-colors"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Body Tab */}
        {activeTab === 'body' && (
          <div className="p-3 sm:p-4">
            <div className="mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-400 mb-2 transition-colors">
                Status Code
              </label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(parseInt(e.target.value))}
                className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs sm:text-sm transition-colors"
              >
                <option value={200}>200 - OK</option>
                <option value={201}>201 - Created</option>
                <option value={204}>204 - No Content</option>
                <option value={400}>400 - Bad Request</option>
                <option value={401}>401 - Unauthorized</option>
                <option value={403}>403 - Forbidden</option>
                <option value={404}>404 - Not Found</option>
                <option value={500}>500 - Internal Server Error</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Note: The body tab is for configuring the status code. The response body is configured in the Response tab.
            </p>
          </div>
        )}

        {/* Response Tab */}
        {activeTab === 'response' && (
          <div className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-400 mb-3 transition-colors">
              Response Body (JSON)
            </h3>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder='{\n  "message": "Hello, World!",\n  "data": {}\n}'
              className="w-full h-64 sm:h-96 px-2 sm:px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] text-gray-900 dark:text-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-xs sm:text-sm placeholder:text-gray-500 dark:placeholder:text-gray-600 resize-y transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  )
}
