'use client'

import { useEffect, useState } from 'react'
import { Plus, Settings, Trash2, Edit, Check } from 'lucide-react'
import { useEnvironmentStore } from '@/store/environmentStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import EnvironmentModal from '@/components/EnvironmentModal'
import EnvironmentTable from '@/components/EnvironmentTable'

export default function EnvironmentsPage() {
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
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-200 mb-2">Environments</h1>
          <p className="text-gray-400 text-sm">
            Manage environment variables for your API requests
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Environment
        </button>
      </div>

      {/* Current Active Environment */}
      {activeEnvironment && (
        <div className="mb-6 p-4 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-200">
                Current Environment: {activeEnvironment.name}
              </h2>
              <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded">
                Active
              </span>
            </div>
            <button
              onClick={() => handleEdit(activeEnvironment.id)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <EnvironmentTable variables={activeEnvironment.variables} />
        </div>
      )}

      {/* All Environments List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">All Environments</h2>

        {environments.length === 0 ? (
          <div className="text-center py-12 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-300 mb-2">No environments yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Create your first environment to manage variables
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Environment
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {environments.map((env) => (
              <div
                key={env.id}
                className={`p-4 bg-[#1e1e1e] border rounded-lg ${
                  env.isActive
                    ? 'border-orange-500 bg-[#2a1a0f]'
                    : 'border-[#3c3c3c] hover:border-[#4c4c4c]'
                } transition-colors`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-200">{env.name}</h3>
                    {env.isActive && (
                      <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded">
                        Active
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {Object.keys(env.variables).length} variables
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!env.isActive && (
                      <button
                        onClick={() => handleActivate(env.id)}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        title="Set as active"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(env.id)}
                      className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                      title="Edit environment"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(env.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete environment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Variables Preview */}
                {Object.keys(env.variables).length > 0 && (
                  <div className="mt-3">
                    <EnvironmentTable variables={env.variables} />
                  </div>
                )}
              </div>
            ))}
          </div>
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

