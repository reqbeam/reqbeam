'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Building2, Check, Settings } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface WorkspaceSwitcherProps {
  onCreateNew?: () => void
  onManage?: () => void
}

export default function WorkspaceSwitcher({ onCreateNew, onManage }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces, isInitialized } = useWorkspaceStore()

  // Fetch workspaces on mount
  useEffect(() => {
    if (!isInitialized) {
      fetchWorkspaces()
    }
  }, [isInitialized, fetchWorkspaces])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleWorkspaceChange = async (workspaceId: string) => {
    setIsOpen(false)
    // Navigate to the workspace URL
    router.push(`/w/${workspaceId}`)
  }

  const handleCreateNew = () => {
    setIsOpen(false)
    if (onCreateNew) {
      onCreateNew()
    }
  }

  const handleManage = () => {
    setIsOpen(false)
    if (onManage) {
      onManage()
    }
  }

  if (!activeWorkspace) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#2a2a2b] rounded text-gray-600 dark:text-gray-400 text-sm transition-colors">
        <Building2 className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Workspace Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#2a2a2b] hover:bg-gray-200 dark:hover:bg-[#3c3c3c] rounded transition-colors text-gray-700 dark:text-gray-300 text-sm border border-gray-300 dark:border-[#3c3c3c] min-w-[200px]"
      >
        <Building2 className="w-4 h-4 flex-shrink-0 text-orange-500" />
        <div className="flex-1 text-left truncate">
          <div className="font-medium truncate">{activeWorkspace.name}</div>
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3c3c3c] rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto transition-colors">
          {/* Workspaces List */}
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider transition-colors">
              Your Workspaces
            </div>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceChange(workspace.id)}
                className="w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2b] transition-colors flex items-center gap-3 group"
              >
                <Building2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate transition-colors">
                    {workspace.name}
                  </div>
                  {workspace.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-500 truncate transition-colors">
                      {workspace.description}
                    </div>
                  )}
                  {workspace._count && (
                    <div className="text-xs text-gray-600 dark:text-gray-600 transition-colors">
                      {workspace._count.collections} collections · {workspace._count.requests} requests
                    </div>
                  )}
                </div>
                {activeWorkspace.id === workspace.id && (
                  <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-[#3c3c3c] py-2 transition-colors">
            <button
              onClick={handleCreateNew}
              className="w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2b] transition-colors flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <Plus className="w-4 h-4 text-orange-500" />
              <span>Create New Workspace</span>
            </button>
            {onManage && (
              <button
                onClick={handleManage}
                className="w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2b] transition-colors flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
              >
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                <span>Manage Workspaces</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

