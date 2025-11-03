'use client'

import { useEffect } from 'react'
import { useEnvironmentStore } from '@/store/environmentStore'
import { useWorkspaceStore } from '@/store/workspaceStore'

export default function EnvironmentSwitcher() {
  const {
    environments,
    activeEnvironment,
    isLoading,
    fetchEnvironments,
    setActiveEnvironment,
  } = useEnvironmentStore()
  const { activeWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (activeWorkspace) {
      fetchEnvironments(activeWorkspace.id)
    } else {
      fetchEnvironments()
    }
  }, [activeWorkspace, fetchEnvironments])

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const environmentId = e.target.value
    if (environmentId) {
      await setActiveEnvironment(environmentId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Loading environments...</span>
      </div>
    )
  }

  if (environments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>No environments</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-300">Environment:</span>
      <select
        value={activeEnvironment?.id || ''}
        onChange={handleChange}
        className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500 min-w-[180px]"
      >
        {environments.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name} {env.isActive ? '✓' : ''}
          </option>
        ))}
      </select>
      {activeEnvironment && (
        <span className="text-xs text-gray-500">
          ({Object.keys(activeEnvironment.variables).length} variables)
        </span>
      )}
    </div>
  )
}

