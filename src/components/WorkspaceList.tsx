'use client'

import { useState, useEffect } from 'react'
import { Building2, Edit, Trash2, Users, FolderOpen, Globe } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import WorkspaceModal from './WorkspaceModal'

export default function WorkspaceList() {
  const [editingWorkspace, setEditingWorkspace] = useState<{
    id: string
    name: string
    description: string | null
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { workspaces, activeWorkspace, deleteWorkspace, fetchWorkspaces, setActiveWorkspace } = useWorkspaceStore()

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  const handleEdit = (workspace: any) => {
    setEditingWorkspace({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (workspaceId: string, workspaceName: string) => {
    if (confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`)) {
      await deleteWorkspace(workspaceId)
    }
  }

  const handleSwitchWorkspace = async (workspaceId: string) => {
    window.location.href = `/w/${workspaceId}`
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingWorkspace(null)
  }

  return (
    <div className="p-6 bg-white dark:bg-[#1e1e1e] min-h-screen transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Workspaces</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">
            Organize your API projects, requests, and environments into separate workspaces
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={`bg-white dark:bg-[#252526] border rounded-lg p-5 hover:border-orange-500/50 transition-all ${
                activeWorkspace?.id === workspace.id
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : 'border-gray-200 dark:border-[#3c3c3c]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate transition-colors">
                      {workspace.name}
                    </h3>
                    {activeWorkspace?.id === workspace.id && (
                      <span className="inline-block px-2 py-0.5 bg-orange-600/20 text-orange-500 text-xs rounded mt-1">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {workspace.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 transition-colors">
                  {workspace.description}
                </p>
              )}

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  <FolderOpen className="w-4 h-4" />
                  <span>{workspace._count?.collections || 0} Collections</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span>{workspace._count?.requests || 0} Requests</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  <Users className="w-4 h-4" />
                  <span>
                    {workspace.members.length + 1} Member
                    {workspace.members.length + 1 !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Owner Info */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
                <div className="text-xs text-gray-600 dark:text-gray-500 transition-colors">Owner</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 truncate transition-colors">
                  {workspace.owner.name || workspace.owner.email}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {activeWorkspace?.id !== workspace.id && (
                  <button
                    onClick={() => handleSwitchWorkspace(workspace.id)}
                    className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
                  >
                    Switch
                  </button>
                )}
                <button
                  onClick={() => handleEdit(workspace)}
                  className="px-3 py-2 bg-[#3c3c3c] hover:bg-[#555] text-gray-300 rounded transition-colors"
                  title="Edit workspace"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {workspaces.length > 1 && (
                  <button
                    onClick={() => handleDelete(workspace.id, workspace.name)}
                    className="px-3 py-2 bg-[#3c3c3c] hover:bg-red-600/20 text-gray-300 hover:text-red-400 rounded transition-colors"
                    title="Delete workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {workspaces.length === 0 && (
          <div className="text-center py-12 px-4">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-2">No workspaces found</p>
            <p className="text-gray-500 text-sm">
              Create your first workspace to get started
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingWorkspace && (
        <WorkspaceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode="edit"
          workspaceId={editingWorkspace.id}
          workspaceName={editingWorkspace.name}
          workspaceDescription={editingWorkspace.description || ''}
        />
      )}
    </div>
  )
}

