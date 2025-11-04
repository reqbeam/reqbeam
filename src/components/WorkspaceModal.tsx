'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface WorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  workspaceId?: string
  workspaceName?: string
  workspaceDescription?: string
}

export default function WorkspaceModal({
  isOpen,
  onClose,
  mode = 'create',
  workspaceId,
  workspaceName = '',
  workspaceDescription = '',
}: WorkspaceModalProps) {
  const [name, setName] = useState(workspaceName)
  const [description, setDescription] = useState(workspaceDescription)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { createWorkspace, updateWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (isOpen) {
      setName(workspaceName)
      setDescription(workspaceDescription)
      setError('')
    }
  }, [isOpen, workspaceName, workspaceDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Workspace name is required')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const workspace = await createWorkspace(name.trim(), description.trim() || undefined)
        if (workspace) {
          onClose()
          // Navigate to the new workspace
          window.location.href = `/w/${workspace.id}`
        } else {
          setError('Failed to create workspace')
        }
      } else if (mode === 'edit' && workspaceId) {
        await updateWorkspace(workspaceId, name.trim(), description.trim() || undefined)
        onClose()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-md transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 transition-colors">
            {mode === 'create' ? 'Create New Workspace' : 'Edit Workspace'}
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
            <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Name <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="e.g., My API Projects"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Description <span className="text-gray-600 dark:text-gray-500 text-xs">(optional)</span>
            </label>
            <textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#3c3c3c] text-gray-900 dark:text-gray-300 rounded border border-gray-300 dark:border-[#555] focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="e.g., Workspace for client API testing"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-[#3c3c3c] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-[#555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

