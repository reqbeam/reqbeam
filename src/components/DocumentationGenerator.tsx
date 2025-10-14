'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, Copy, Check } from 'lucide-react'

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
  headers?: Record<string, string>
  body?: string
  bodyType?: string
}

export default function DocumentationGenerator() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown')
  const [generatedDoc, setGeneratedDoc] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const generateDocumentation = async () => {
    if (!selectedCollection) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: selectedCollection,
          format,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedDoc(data.documentation)
      }
    } catch (error) {
      console.error('Error generating documentation:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDoc)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const downloadDocumentation = () => {
    const blob = new Blob([generatedDoc], {
      type: format === 'markdown' ? 'text/markdown' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documentation.${format === 'markdown' ? 'md' : 'json'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectedCollectionData = collections.find(c => c.id === selectedCollection)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documentation Generator
        </h2>
        <p className="text-gray-600">
          Generate documentation from your API collections
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a collection...</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="markdown"
                  checked={format === 'markdown'}
                  onChange={(e) => setFormat(e.target.value as 'markdown' | 'json')}
                  className="mr-2"
                />
                <span className="text-sm">Markdown</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as 'markdown' | 'json')}
                  className="mr-2"
                />
                <span className="text-sm">JSON</span>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={generateDocumentation}
          disabled={!selectedCollection || isGenerating}
          className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>{isGenerating ? 'Generating...' : 'Generate Documentation'}</span>
        </button>

        {/* Generated Documentation */}
        {generatedDoc && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generated Documentation
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={downloadDocumentation}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md">
              <pre className="p-4 bg-gray-50 text-sm overflow-auto max-h-96">
                {generatedDoc}
              </pre>
            </div>
          </div>
        )}

        {/* Collection Preview */}
        {selectedCollectionData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Collection Preview: {selectedCollectionData.name}
            </h3>
            <div className="space-y-3">
              {selectedCollectionData.requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                      {request.method}
                    </span>
                    <span className="font-medium text-gray-900">{request.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 font-mono">
                    {request.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


