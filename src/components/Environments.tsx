'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings, Trash2, Edit, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useEnvironmentStore } from '@/store/environmentStore'
import EnvironmentModal from './EnvironmentModal'

export default function Environments() {
  const {
    environments,
    activeEnvironment,
    isLoading,
    fetchEnvironments,
    setActiveEnvironment,
    deleteEnvironment,
  } = useEnvironmentStore()
  const { activeWorkspace } = useWorkspaceStore()

  const [showModal, setShowModal] = useState(false)
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null)

  useEffect(() => {
    if (activeWorkspace) {
      fetchEnvironments(activeWorkspace.id)
    } else {
      fetchEnvironments()
    }
  }, [activeWorkspace, fetchEnvironments])

  const handleCreate = () => {
    setEditingEnvId(null)
    setShowModal(true)
  }

  const handleEdit = (envId: string) => {
    setEditingEnvId(envId)
    setShowModal(true)
  }

  const handleDelete = async (envId: string) => {
    if (confirm('Are you sure you want to delete this environment?')) {
      await deleteEnvironment(envId)
      if (activeWorkspace) {
        await fetchEnvironments(activeWorkspace.id)
      } else {
        await fetchEnvironments()
      }
    }
  }

  const handleActivate = async (envId: string) => {
    await setActiveEnvironment(envId)
    if (activeWorkspace) {
      await fetchEnvironments(activeWorkspace.id)
    } else {
      await fetchEnvironments()
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Environments</h3>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Current Active Environment */}
      {activeEnvironment && (
        <div className="mb-4 p-3 bg-[#1e1e1e] border border-orange-500/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-200">
              Active: {activeEnvironment.name}
            </span>
            <span className="px-2 py-0.5 text-xs bg-orange-600 text-white rounded">
              Active
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {Object.keys(activeEnvironment.variables).length} variables
          </div>
        </div>
      )}

      {/* Environments List */}
      <div className="space-y-2">
        {environments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-300">No environments yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first environment to get started
            </p>
          </div>
        ) : (
          environments.map((env) => (
            <div
              key={env.id}
              className={`border rounded-lg p-3 hover:bg-[#2a2a2a] transition-colors ${
                env.isActive
                  ? 'border-orange-500/50 bg-[#2a1a0f]'
                  : 'border-[#3c3c3c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-200">{env.name}</h4>
                      {env.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {Object.keys(env.variables).length} variables
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {!env.isActive && (
                    <button
                      onClick={() => handleActivate(env.id)}
                      className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                      title="Set as active"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(env.id)}
                    className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Edit environment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(env.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete environment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Variables Preview */}
              {Object.keys(env.variables).length > 0 && (
                <div className="mt-3 space-y-1">
                  {Object.entries(env.variables).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 text-xs">
                      <code className="text-orange-400 font-mono">{`{{${key}}}`}</code>
                      <span className="text-gray-400">=</span>
                      <span className="text-gray-500 truncate">{value}</span>
                    </div>
                  ))}
                  {Object.keys(env.variables).length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{Object.keys(env.variables).length - 3} more variables
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <EnvironmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEnvId(null)
        }}
        environmentId={editingEnvId}
      />
    </div>
  )
}


