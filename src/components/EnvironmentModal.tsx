'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useEnvironmentStore } from '@/store/environmentStore'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface EnvironmentModalProps {
  isOpen: boolean
  onClose: () => void
  environmentId?: string | null
}

export default function EnvironmentModal({
  isOpen,
  onClose,
  environmentId,
}: EnvironmentModalProps) {
  const { environments, createEnvironment, updateEnvironment, fetchEnvironments } =
    useEnvironmentStore()
  const { activeWorkspace } = useWorkspaceStore()

  const editingEnv = environmentId
    ? environments.find((e) => e.id === environmentId)
    : null

  const [name, setName] = useState('')
  const [variables, setVariables] = useState<Array<{ key: string; value: string }>>([])
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (editingEnv) {
        setName(editingEnv.name)
        setVariables(
          Object.entries(editingEnv.variables).map(([key, value]) => ({
            key,
            value,
          }))
        )
      } else {
        setName('')
        setVariables([])
      }
      setNewKey('')
      setNewValue('')
    }
  }, [isOpen, editingEnv])

  const handleAddVariable = () => {
    if (newKey.trim() && newValue.trim()) {
      // Check for duplicate key
      if (variables.some((v) => v.key === newKey.trim())) {
        alert('Variable key already exists')
        return
      }
      setVariables([...variables, { key: newKey.trim(), value: newValue.trim() }])
      setNewKey('')
      setNewValue('')
    }
  }

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const handleUpdateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...variables]
    updated[index] = { ...updated[index], [field]: value }
    setVariables(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Environment name is required')
      return
    }

    const variablesObj = variables.reduce(
      (acc, v) => {
        if (v.key.trim()) {
          acc[v.key.trim()] = v.value.trim()
        }
        return acc
      },
      {} as Record<string, string>
    )

    if (editingEnv) {
      await updateEnvironment(editingEnv.id, name.trim(), variablesObj)
    } else {
      await createEnvironment(name.trim(), variablesObj, activeWorkspace?.id || null)
    }

    await fetchEnvironments(activeWorkspace?.id || null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#3c3c3c] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3c3c3c] transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 transition-colors">
            {editingEnv ? 'Edit Environment' : 'Create Environment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Environment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Environment Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Development, Staging, Production"
                className="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] rounded px-3 py-2 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Variables
              </label>

              {/* Existing Variables Table */}
              {variables.length > 0 && (
                <div className="mb-3 border border-gray-200 dark:border-[#3c3c3c] rounded overflow-hidden transition-colors">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-[#2a2a2a] transition-colors">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-400 transition-colors">
                          Key
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-400 transition-colors">
                          Value
                        </th>
                        <th className="px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variables.map((variable, index) => (
                        <tr
                          key={index}
                          className="border-t border-gray-200 dark:border-[#3c3c3c] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={variable.key}
                              onChange={(e) =>
                                handleUpdateVariable(index, 'key', e.target.value)
                              }
                              className="w-full bg-transparent text-gray-900 dark:text-gray-200 text-sm focus:outline-none transition-colors"
                              placeholder="Variable name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={variable.value}
                              onChange={(e) =>
                                handleUpdateVariable(index, 'value', e.target.value)
                              }
                              className="w-full bg-transparent text-gray-900 dark:text-gray-200 text-sm focus:outline-none transition-colors"
                              placeholder="Variable value"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariable(index)}
                              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add New Variable */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Variable name (e.g., baseUrl)"
                  className="flex-1 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] rounded px-3 py-2 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddVariable()
                    }
                  }}
                />
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Variable value (e.g., https://api.dev.com)"
                  className="flex-1 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#3c3c3c] rounded px-3 py-2 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddVariable()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddVariable}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-600 dark:text-gray-500 transition-colors">
                Use variables in requests with {'{'} {'{'}
                variableName {'}'} {'}'}
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-[#3c3c3c] transition-colors">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="submit"
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            {editingEnv ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

