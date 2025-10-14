'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings, Trash2, Edit, Check } from 'lucide-react'

interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  isActive: boolean
}

export default function Environments() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null)
  const [newEnvName, setNewEnvName] = useState('')
  const [newEnvVariables, setNewEnvVariables] = useState<Record<string, string>>({})
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarValue, setNewVarValue] = useState('')

  useEffect(() => {
    fetchEnvironments()
  }, [])

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/environments')
      if (response.ok) {
        const data = await response.json()
        setEnvironments(data)
      }
    } catch (error) {
      console.error('Error fetching environments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createEnvironment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEnvName.trim()) return

    try {
      const response = await fetch('/api/environments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newEnvName,
          variables: newEnvVariables,
        }),
      })

      if (response.ok) {
        setNewEnvName('')
        setNewEnvVariables({})
        setShowCreateForm(false)
        fetchEnvironments()
      }
    } catch (error) {
      console.error('Error creating environment:', error)
    }
  }

  const updateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEnv) return

    try {
      const response = await fetch(`/api/environments/${editingEnv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingEnv.name,
          variables: editingEnv.variables,
        }),
      })

      if (response.ok) {
        setEditingEnv(null)
        fetchEnvironments()
      }
    } catch (error) {
      console.error('Error updating environment:', error)
    }
  }

  const deleteEnvironment = async (envId: string) => {
    if (!confirm('Are you sure you want to delete this environment?')) return

    try {
      const response = await fetch(`/api/environments/${envId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchEnvironments()
      }
    } catch (error) {
      console.error('Error deleting environment:', error)
    }
  }

  const setActiveEnvironment = async (envId: string) => {
    try {
      const response = await fetch(`/api/environments/${envId}/activate`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchEnvironments()
      }
    } catch (error) {
      console.error('Error setting active environment:', error)
    }
  }

  const addVariable = () => {
    if (newVarKey && newVarValue) {
      if (editingEnv) {
        setEditingEnv({
          ...editingEnv,
          variables: {
            ...editingEnv.variables,
            [newVarKey]: newVarValue,
          },
        })
      } else {
        setNewEnvVariables({
          ...newEnvVariables,
          [newVarKey]: newVarValue,
        })
      }
      setNewVarKey('')
      setNewVarValue('')
    }
  }

  const removeVariable = (key: string) => {
    if (editingEnv) {
      const newVars = { ...editingEnv.variables }
      delete newVars[key]
      setEditingEnv({
        ...editingEnv,
        variables: newVars,
      })
    } else {
      const newVars = { ...newEnvVariables }
      delete newVars[key]
      setNewEnvVariables(newVars)
    }
  }

  const startEdit = (env: Environment) => {
    setEditingEnv(env)
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingEnv(null)
    setNewEnvName('')
    setNewEnvVariables({})
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Environments</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Create/Edit Environment Form */}
      {(showCreateForm || editingEnv) && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <form onSubmit={editingEnv ? updateEnvironment : createEnvironment} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environment Name
              </label>
              <input
                type="text"
                value={editingEnv ? editingEnv.name : newEnvName}
                onChange={(e) => editingEnv ? setEditingEnv({...editingEnv, name: e.target.value}) : setNewEnvName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Development"
                required
              />
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variables
              </label>
              
              {/* Existing Variables */}
              <div className="space-y-2 mb-3">
                {Object.entries(editingEnv ? editingEnv.variables : newEnvVariables).map(([key, value]) => (
                  <div key={key} className="flex space-x-2">
                    <input
                      type="text"
                      value={key}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <input
                      type="text"
                      value={value}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariable(key)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Variable */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  placeholder="Variable name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  placeholder="Variable value"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addVariable}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
              >
                {editingEnv ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Environments List */}
      <div className="space-y-2">
        {environments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No environments yet</p>
            <p className="text-sm">Create your first environment to get started</p>
          </div>
        ) : (
          environments.map((env) => (
            <div
              key={env.id}
              className={`border rounded-lg p-3 hover:bg-gray-50 ${
                env.isActive ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{env.name}</h4>
                      {env.isActive && (
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
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
                      onClick={() => setActiveEnvironment(env.id)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                      title="Set as active"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(env)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit environment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteEnvironment(env.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
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
                    <div key={key} className="flex items-center space-x-2 text-sm">
                      <span className="font-mono text-gray-600">{key}</span>
                      <span className="text-gray-400">=</span>
                      <span className="text-gray-500 truncate">{value}</span>
                    </div>
                  ))}
                  {Object.keys(env.variables).length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{Object.keys(env.variables).length - 3} more variables
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}


