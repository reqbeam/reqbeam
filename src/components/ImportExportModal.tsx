'use client'

import { useState, useRef } from 'react'
import { X, Upload, Download, FileText, Loader2 } from 'lucide-react'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'collection' | 'workspace'
  mode: 'import' | 'export'
  collectionId?: string
  workspaceId?: string
  collectionName?: string
  workspaceName?: string
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export default function ImportExportModal({
  isOpen,
  onClose,
  type,
  mode,
  collectionId,
  workspaceId,
  collectionName,
  workspaceName,
  onSuccess,
  onError,
}: ImportExportModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [format, setFormat] = useState<'json' | 'yaml'>('json')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const isValidType = 
      file.name.endsWith('.json') || 
      file.name.endsWith('.yaml') || 
      file.name.endsWith('.yml')
    
    if (!isValidType) {
      onError?.('Invalid file type. Please upload a .json or .yaml file.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (type === 'collection') {
        if (workspaceId) {
          formData.append('workspaceId', workspaceId)
        }
      }

      const endpoint = type === 'collection' 
        ? '/api/collections/import'
        : '/api/workspaces/import'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      const successMessage = type === 'collection'
        ? `Successfully imported ${data.importedCount || data.requests?.length || 0} requests into "${data.collection?.name || 'collection'}"`
        : `Successfully imported workspace "${data.workspace?.name || 'workspace'}" with ${data.stats?.collections || 0} collections, ${data.stats?.requests || 0} requests, and ${data.stats?.environments || 0} environments`

      onSuccess?.(successMessage)
      onClose()
      
      // Refresh the page to show imported data
      window.location.reload()
    } catch (error: any) {
      onError?.(error.message || 'Failed to import file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleExport = () => {
    const endpoint = type === 'collection'
      ? `/api/collections/${collectionId}/export?format=${format}`
      : `/api/workspaces/${workspaceId}/export?format=${format}`

    // Trigger download
    window.location.href = endpoint
    
    onSuccess?.(
      type === 'collection'
        ? `Exporting "${collectionName || 'collection'}"...`
        : `Exporting "${workspaceName || 'workspace'}"...`
    )
    setTimeout(() => onClose(), 1000)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#252526] rounded-lg shadow-xl w-full max-w-md mx-4 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
            {mode === 'import' ? 'Import' : 'Export'} {type === 'collection' ? 'Collection' : 'Workspace'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'import' ? (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-[#555] hover:border-orange-400 dark:hover:border-orange-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors">
                  Drag and drop a file here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 transition-colors">
                  Supports {type === 'collection' ? 'Reqbeam, external collections, or OpenAPI' : 'Reqbeam'} formats (.json, .yaml)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Choose File'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                  Export Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="json"
                      checked={format === 'json'}
                      onChange={(e) => setFormat(e.target.value as 'json' | 'yaml')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">JSON</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yaml"
                      checked={format === 'yaml'}
                      onChange={(e) => setFormat(e.target.value as 'json' | 'yaml')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">YAML</span>
                  </label>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#2a2a2b] rounded-lg p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                      {type === 'collection' ? collectionName || 'Collection' : workspaceName || 'Workspace'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                      {type === 'collection' 
                        ? 'This will export the collection with all requests.'
                        : 'This will export the workspace with all collections, requests, environments, and optional history.'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center justify-center space-x-2 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export {type === 'collection' ? 'Collection' : 'Workspace'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

