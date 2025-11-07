'use client'

import { useState } from 'react'
import { Clock, FileText, AlertCircle, CheckCircle, XCircle, X } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useRequestStore } from '@/store/requestStore'
import { useThemeStore } from '@/store/themeStore'

export default function ResponseViewer() {
  const { response, isLoading, setResponse } = useRequestStore()
  const { theme } = useThemeStore()
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'cookies'>('body')

  const clearResponse = () => {
    setResponse(null)
  }
  
  // Use light theme for syntax highlighting in light mode, dark theme in dark mode
  const syntaxStyle = theme === 'dark' ? tomorrow : coy

  if (isLoading) {
    return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-[#252525] transition-colors">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6c37] mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 transition-colors">Sending request...</p>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#252525] transition-colors">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4 transition-colors" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
            No Response
          </h3>
          <p className="text-gray-600 dark:text-gray-500 transition-colors">
            Send a request to see the response here
          </p>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    if (response.error) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    if (response.status && response.status >= 200 && response.status < 300) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (response.status && response.status >= 400) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />
  }

  const getStatusColor = () => {
    if (response.error) return 'text-red-600 dark:text-red-400'
    if (response.status && response.status >= 200 && response.status < 300) return 'text-green-600 dark:text-green-400'
    if (response.status && response.status >= 400) return 'text-red-600 dark:text-red-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  const formatJson = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        return data
      }
    }
    return JSON.stringify(data, null, 2)
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-white dark:bg-[#252525] transition-colors">
      {/* Response Header */}
      <div className="border-b border-gray-200 dark:border-[#3c3c3c] p-4 shrink-0 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors">STATUS</span>
            <span className={`text-base font-semibold ${getStatusColor()}`}>
              {response.status ? `${response.status} ${response.statusText}` : 'Error'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              <div className="flex items-center space-x-1">
                <span className="text-xs">TIME</span>
                {response.duration && (
                  <span className="font-medium">{response.duration}ms</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs">SIZE</span>
                {response.size && (
                  <span className="font-medium">{response.size}B</span>
                )}
              </div>
            </div>
            <button
              onClick={clearResponse}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3c3c3c] rounded transition-colors"
              title="Clear Response"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Response Tabs */}
        <div className="flex space-x-6">
          {['body', 'headers', 'cookies'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'body' && (
          <div className="h-full min-h-0 overflow-auto overflow-x-auto">
            {response.error ? (
              <div className="p-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-md p-4 transition-colors">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 transition-colors" />
                    <span className="text-red-700 dark:text-red-400 font-medium transition-colors">Error</span>
                  </div>
                  <p className="text-red-700 dark:text-red-400 mt-2 transition-colors">{response.error}</p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-0 overflow-auto overflow-x-auto">
                <SyntaxHighlighter
                  language="json"
                  style={syntaxStyle}
                  customStyle={{
                    margin: 0,
                    height: '100%',
                    fontSize: '14px',
                    whiteSpace: 'pre',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    minWidth: 'max-content',
                    wordBreak: 'normal',
                    overflowWrap: 'normal',
                    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f9fafb',
                  }}
                  showLineNumbers
                  wrapLongLines={false}
                >
                  {formatJson(response.data)}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && response.headers && (
          <div className="p-4 overflow-auto overflow-x-auto">
            <div className="space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex py-2 border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300 pr-2 overflow-hidden text-ellipsis whitespace-nowrap transition-colors">{key}</div>
                  <div className="w-2/3 text-gray-600 dark:text-gray-400 font-mono text-sm overflow-auto overflow-x-auto whitespace-pre transition-colors">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="p-4">
            <div className="text-gray-600 dark:text-gray-500 text-center py-8 transition-colors">
              No cookies in response
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

