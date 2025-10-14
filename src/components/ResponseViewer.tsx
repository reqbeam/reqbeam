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
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sending request...</p>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
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
    <div className="h-full min-h-0 flex flex-col bg-white">
      {/* Response Header */}
      <div className="border-b border-gray-200 p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <span className={`text-lg font-semibold ${getStatusColor()}`}>
              {response.status ? `${response.status} ${response.statusText}` : 'Error'}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {response.duration && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{response.duration}ms</span>
              </div>
            )}
            {response.size && (
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{response.size} bytes</span>
              </div>
            )}
          </div>
        </div>

        {/* Response Tabs */}
        <div className="flex space-x-4">
          {['body', 'headers', 'cookies'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md capitalize ${
                activeTab === tab
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
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
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 font-medium">Error</span>
                  </div>
                  <p className="text-red-600 mt-2">{response.error}</p>
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
                <div key={key} className="flex py-2 border-b border-gray-100">
                  <div className="w-1/3 font-medium text-gray-700 pr-2 overflow-hidden text-ellipsis whitespace-nowrap">{key}</div>
                  <div className="w-2/3 text-gray-600 font-mono text-sm overflow-auto overflow-x-auto whitespace-pre">{value}</div>
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

