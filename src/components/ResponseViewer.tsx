'use client'

import { useState } from 'react'
import { Clock, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useRequestStore } from '@/store/requestStore'

export default function ResponseViewer() {
  const { response, isLoading } = useRequestStore()
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'cookies'>('body')

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#252525]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6c37] mx-auto mb-4"></div>
          <p className="text-gray-400">Sending request...</p>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center bg-[#252525]">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No Response
          </h3>
          <p className="text-gray-500">
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
    if (response.error) return 'text-red-600'
    if (response.status && response.status >= 200 && response.status < 300) return 'text-green-600'
    if (response.status && response.status >= 400) return 'text-red-600'
    return 'text-yellow-600'
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
    <div className="h-full min-h-0 flex flex-col bg-[#252525]">
      {/* Response Header */}
      <div className="border-b border-[#3c3c3c] p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-gray-400">STATUS</span>
            <span className={`text-base font-semibold ${getStatusColor()}`}>
              {response.status ? `${response.status} ${response.statusText}` : 'Error'}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
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
        </div>

        {/* Response Tabs */}
        <div className="flex space-x-6">
          {['body', 'headers', 'cookies'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-2 text-sm font-medium capitalize border-b-2 ${
                activeTab === tab
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
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
                <div className="bg-red-900/20 border border-red-900/40 rounded-md p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-400 font-medium">Error</span>
                  </div>
                  <p className="text-red-400 mt-2">{response.error}</p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-0 overflow-auto overflow-x-auto">
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
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
                <div key={key} className="flex py-2 border-b border-[#3c3c3c]">
                  <div className="w-1/3 font-medium text-gray-300 pr-2 overflow-hidden text-ellipsis whitespace-nowrap">{key}</div>
                  <div className="w-2/3 text-gray-400 font-mono text-sm overflow-auto overflow-x-auto whitespace-pre">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="p-4">
            <div className="text-gray-500 text-center py-8">
              No cookies in response
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

